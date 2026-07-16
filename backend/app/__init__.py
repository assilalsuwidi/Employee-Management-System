import os
from flask import Flask
from config import config
from app.extensions import db, jwt, cors, limiter


def create_app(config_name="default"):
    """Application Factory Pattern -- نفس النمط المستخدم في مشروع
    المهندس (run.py -> create_app(os.getenv('FLASK_CONFIG', 'default'))).
    يسمح هذا النمط بإنشاء نسخ متعددة من التطبيق (للتطوير / للاختبار /
    للإنتاج) بإعدادات مختلفة دون تكرار الكود."""

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config[config_name])

    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
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

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(employees_bp, url_prefix="/api/employees")
    app.register_blueprint(departments_bp, url_prefix="/api/departments")
    app.register_blueprint(groups_bp, url_prefix="/api/groups")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(payroll_bp, url_prefix="/api/payroll")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")

    from app.utils.errors import register_error_handlers
    register_error_handlers(app)

    @app.route("/api/uploads/<path:filename>")
    def serve_upload(filename):
        from flask import send_from_directory
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    return app
