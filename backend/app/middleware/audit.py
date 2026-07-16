from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity
from app.extensions import db
from app.models.audit import AuditLog


def log_action(action, target_type=None, target_id=None, metadata=None):
    """يكتب سطراً واحداً في audit_logs. يُستدعى من داخل الـ services بعد
    نجاح أي عملية كتابة حساسة (إنشاء/تعديل/حذف موظف، توليد راتب، تغيير
    دور، محاولة دخول ناجحة/فاشلة...الخ)."""
    try:
        claims = get_jwt()
        actor_id = int(get_jwt_identity()) if get_jwt_identity() else None
        actor_role = claims.get("role")
    except RuntimeError:
        # استُدعيت خارج سياق طلب محمي بـ JWT (مثل محاولة تسجيل دخول فاشلة)
        actor_id, actor_role = None, None

    entry = AuditLog(
        actor_user_id=actor_id,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        ip_address=request.remote_addr if request else None,
        metadata_json=str(metadata) if metadata else None,
    )
    db.session.add(entry)
    db.session.commit()
