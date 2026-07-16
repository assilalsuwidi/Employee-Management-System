from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.extensions import limiter

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # حماية من هجمات التخمين (brute-force) لم تكن موجودة سابقاً
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify(success=False, message="Username and password required"), 400

    token, result = AuthService.login_user(username, password)

    if not token:
        return jsonify(success=False, message=result), 401

    user = result
    return jsonify(
        success=True,
        message="Login successful",
        access_token=token,
        role=user.role,
        user_id=user.id,
    )


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # مع JWT عديم الحالة (stateless)، يتم تسجيل الخروج من طرف العميل بحذف
    # الرمز فقط. لو احتجت إلغاءً من طرف الخادم لاحقاً، أضف قائمة حظر
    # للرموز (Flask-JWT-Extended يدعم هذا) قبل الانتقال إلى الإنتاج.
    return jsonify(success=True, message="Logged out")
