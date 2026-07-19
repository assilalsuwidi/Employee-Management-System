import os
from flask import Flask, jsonify
from config import config
from app.extensions import db, jwt, cors, limiter, talisman


def create_app(config_name="default"):
    """Application Factory Pattern -- نفس النمط المستخدم في مشروع
    المهندس (run.py -> create_app(os.getenv('FLASK_CONFIG', 'default'))).
    يسمح هذا النمط بإنشاء نسخ متعددة من التطبيق (للتطوير / للاختبار /
    للإنتاج) بإعدادات مختلفة دون تكرار الكود."""

    app = Flask(__name__, instance_relative_config=True)  # NOSONAR - CSRF is handled by JWT/API design
    app.config.from_object(config[config_name])

    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    # الإصلاح: كان content_security_policy=None يعطّل الـ CSP فعليًا، بينما
    # docs/dast_report.md يدّعي أن هذه المشكلة "معالجة عبر Flask-Talisman" --
    # وهو تناقض مباشر بين الكود والتقرير. هذه سياسة API صارمة (default-src
    # 'none') لأن الـ backend لا يخدم أي HTML/JS بنفسه؛ الواجهة الأمامية
    # (React عبر Nginx) لها CSP خاصة بها منفصلة في إعداد الـ Docker.
    csp = {"default-src": "'none'", "frame-ancestors": "'none'"}
    # الإصلاح: force_https كانت مُثبَّتة على False دائمًا بصرف النظر عن
    # بيئة التشغيل، فلا تُجبر Talisman أي طلب HTTP على التحويل لـ HTTPS
    # حتى في الإنتاج. الآن تُقرأ من إعداد البيئة (FORCE_HTTPS)، والقيمة
    # الافتراضية في ProductionConfig هي True.
    talisman.init_app(
        app,
        force_https=app.config.get("FORCE_HTTPS", False),
        content_security_policy=csp,
    )

    # JWT Token Blocklisting - S-SDLC requirement for secure session management
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        from app.models.token import TokenBlocklist
        jti = jwt_payload["jti"]
        token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
        return token is not None

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """يُستدعى تلقائيًا عندما يُقدَّم رمز مُبطَل بالفعل (blocklisted).
        مع تدوير الـ refresh token، كل رمز refresh يُستخدم مرة واحدة فقط
        ثم يُبطَل فورًا -- فإن ظهر هنا رمز refresh تحديدًا، فهذا يعني أن
        نفس الرمز اسُتخدم مرتين، وهو مؤشر قوي على سرقة الرمز (نسخة
        مسروقة استُخدمت بالتوازي مع الاستخدام الشرعي لصاحبها). يُسجَّل
        هذا في audit_logs لمراجعته لاحقًا، بدل أن يمر بصمت كخطأ 401 عادي."""
        from flask import request
        from app.models.audit import AuditLog
        if jwt_payload.get("type") == "refresh":
            sub = jwt_payload.get("sub")
            db.session.add(AuditLog(**{  # type: ignore
                "actor_user_id": int(sub) if sub is not None else None,
                "actor_role": jwt_payload.get("role"),
                "action": "auth.revoked_refresh_token_reused",
                "target_type": "user",
                "target_id": int(sub) if sub is not None else None,
                "ip_address": request.remote_addr if request else None,
                "metadata_json": "Possible stolen/replayed refresh token detected via rotation",
            }))
            db.session.commit()
        return jsonify(success=False, message="Token has been revoked"), 401

    cors.init_app(app, supports_credentials=True, origins=app.config["CORS_ORIGINS"])
    limiter.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.employees import employees_bp
    from app.routes.departments import departments_bp
    from app.routes.groups import groups_bp
    from app.routes.attendance import attendance_bp
    from app.routes.payroll import payroll_bp
    from app.routes.tasks import tasks_bp
    from app.routes.audit import audit_bp
    from app.routes.leaves import leaves_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(employees_bp, url_prefix="/api/employees")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(groups_bp, url_prefix="/api/groups")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(payroll_bp, url_prefix="/api/payroll")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(leaves_bp, url_prefix="/api/leaves")

    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    @app.route("/api/uploads/<path:filename>", methods=["GET"])
    def serve_upload(filename):
        """الإصلاح: كان هذا المسار عامًا بالكامل (أي شخص يعرف/يخمّن اسم
        الملف يفتحه دون تسجيل دخول). الآن يتطلب JWT صالح على الأقل --
        نفس ما تتطلبه باقي بيانات النظام."""
        from flask import send_from_directory
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        response = send_from_directory(app.config["UPLOAD_FOLDER"], filename)
        # الإصلاح: نضيف X-Content-Type-Options: nosniff صراحة على هذا
        # المسار تحديدًا لأنه يُعيد ملفات رفعها المستخدمون -- منع أي
        # محاولة من المتصفح لتخمين/إعادة تفسير نوع الملف الفعلي
        # (content-sniffing) بغض النظر عن الامتداد الذي وافق عليه
        # file_upload.py وقت الرفع.
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    return app
