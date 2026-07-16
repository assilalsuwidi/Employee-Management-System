from flask import Blueprint, jsonify
from app.models.audit import AuditLog
from app.middleware.rbac import role_required

audit_bp = Blueprint("audit", __name__)


@audit_bp.route("", methods=["GET"])
@role_required("admin")
def list_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.id.desc()).limit(50).all()
    data = []
    for l in logs:
        data.append({
            "id": l.id,
            "actor_user_id": l.actor_user_id,
            "actor_role": l.actor_role,
            "action": l.action,
            "target_type": l.target_type,
            "target_id": l.target_id,
            "ip_address": l.ip_address,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return jsonify(success=True, data=data)
