from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity
from app.extensions import db
from app.models.audit import AuditLog
from app.services.alert_service import AlertService
from datetime import datetime, timedelta

CRITICAL_ACTIONS = {
    "auth.revoked_refresh_token_reused",
    "employee.delete",
    "user.role_changed",
    "admin.password_changed"
}

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

    # --- Alerting System Trigger ---
    try:
        should_alert = False
        if action in CRITICAL_ACTIONS:
            should_alert = True
        elif action == "auth.login_failed":
            # Check if this failed login is targeting the 'admin' user
            if metadata and isinstance(metadata, dict) and metadata.get("username") == "admin":
                # Check for repeated failed attempts in the last 15 minutes
                fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
                recent_failures = AuditLog.query.filter(
                    AuditLog.action == "auth.login_failed",
                    AuditLog.metadata_json.like('%"username": "admin"%') | AuditLog.metadata_json.like("%'username': 'admin'%"),
                    AuditLog.created_at >= fifteen_mins_ago
                ).count()
                
                # If 3 or more failed attempts, trigger an alert
                if recent_failures >= 3:
                    should_alert = True

        if should_alert:
            details = (
                f"Actor ID: {actor_id}\n"
                f"Actor Role: {actor_role}\n"
                f"Target Type: {target_type}\n"
                f"Target ID: {target_id}\n"
                f"IP Address: {entry.ip_address}\n"
                f"Metadata: {entry.metadata_json}\n"
                f"Time (UTC): {entry.created_at}"
            )
            AlertService.send_security_alert(action, details)
    except Exception as e:
        import logging
        logging.error(f"Failed to process alerting logic in audit.py: {str(e)}")
