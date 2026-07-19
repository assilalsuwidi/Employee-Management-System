from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, get_jwt, get_jwt_identity, decode_token,
    set_refresh_cookies, unset_jwt_cookies,
)
from app.services.auth_service import AuthService
from app.extensions import limiter, db
from app.models.token import TokenBlocklist
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # حماية من هجمات التخمين (brute-force) لم تكن موجودة سابقاً
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(success=False, message="Username and password required"), 400

    result = AuthService.login_user(username, password)

    if not result[0]:
        return jsonify(success=False, message=result[1]), 401

    access_token, refresh_token, user = result

    # الإصلاح (تخزين التوكن): refresh_token لم يعد يُرجَع في جسم JSON
    # (حيث كانت الواجهة تحفظه في sessionStorage، وهو مكان يقدر أي كود
    # JavaScript يعمل على الصفحة -- بما فيه هجوم XSS لو ظهر مستقبلاً --
    # على قراءته). الآن يُوضَع في كوكي httpOnly لا يصل إليه JavaScript
    # إطلاقًا. access_token وحده يبقى بالجسم لأن الواجهة تحتفظ به في
    # الذاكرة فقط (React state) لا في أي تخزين دائم بالمتصفح.
    response = jsonify(
        success=True,
        message="Login successful",
        access_token=access_token,
        role=user.role,
        user_id=user.id,
        employee_id=user.employee_id,
    )
    set_refresh_cookies(response, refresh_token)
    return response


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """تسجيل الخروج الآمن بإضافة الرمز الحالي لقائمة الحظر (S-SDLC).

    الإصلاح: كان هذا المسار يحظر الـ access token فقط، فيبقى الـ refresh
    token المرتبط به صالحًا لمدة 7 أيام حتى لو سُجّل الخروج -- أي أن
    تسجيل الخروج لم يكن يُنهي الجلسة فعليًا. الآن يقرأ refresh token من
    كوكي httpOnly (وليس من جسم الطلب كما كان سابقًا، لأن الواجهة لم تعد
    تراه أصلاً) ويحظره أيضًا، ثم يمسح الكوكي من المتصفح."""
    jti = get_jwt()["jti"]
    db.session.add(TokenBlocklist(jti=jti))

    refresh_token = request.cookies.get("refresh_token_cookie")
    if refresh_token:
        try:
            decoded = decode_token(refresh_token)
            if decoded.get("type") == "refresh":
                db.session.add(TokenBlocklist(jti=decoded["jti"]))
        except Exception:
            # رمز غير صالح/منتهٍ أصلاً -- لا داعي لإفشال تسجيل الخروج بسببه
            pass

    db.session.commit()
    response = jsonify(success=True, message="Logged out successfully and token revoked")
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """الإصلاح: JWT_REFRESH_TOKEN_EXPIRES كان معرّفًا في config.py بدون أي
    مسار يستخدمه فعليًا. الآن يقبل هذا المسار refresh token فقط
    (refresh=True يمنع استخدام access token هنا)، يقرأه تلقائيًا من كوكي
    httpOnly (JWT_TOKEN_LOCATION يشمل "cookies")، ويصدر access token
    جديد قصير العمر. الواجهة تستدعي هذا المسار صامتًا عند تحميل الصفحة
    لاستعادة الجلسة، بدل الاعتماد على تخزين التوكن على القرص.

    تدوير الـ refresh token (خارج نطاق المحاضرة، إضافة أمنية إضافية):
    كل استخدام لرمز refresh صالح يُبطل الرمز نفسه فورًا ويصدر رمزًا
    جديدًا مكانه في كوكي جديد. لو استُخدم نفس الرمز القديم مرة أخرى (مثال:
    نسخة مسروقة استُخدمت بالتوازي مع الاستخدام الشرعي)، فسيُرفض فورًا
    لأنه أصبح ضمن TokenBlocklist -- انظر jwt.revoked_token_loader في
    app/__init__.py لتسجيل محاولات إعادة الاستخدام هذه في audit_logs."""
    user = User.query.get(get_jwt_identity())
    if not user or user.status != "active":
        return jsonify(success=False, message="Account inactive"), 401

    # إبطال رمز الـ refresh الحالي فورًا (تدوير) -- لا يُستخدم مرتين أبدًا
    old_jti = get_jwt()["jti"]
    db.session.add(TokenBlocklist(jti=old_jti))

    new_access_token, new_refresh_token = AuthService.issue_tokens(user)
    db.session.commit()

    response = jsonify(
        success=True,
        access_token=new_access_token,
        role=user.role,
        user_id=user.id,
        employee_id=user.employee_id,
    )
    set_refresh_cookies(response, new_refresh_token)
    return response
