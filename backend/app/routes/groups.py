from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.group import Group, GroupMember
from app.middleware.rbac import role_required, login_required
from app.middleware.audit import log_action

groups_bp = Blueprint("groups", __name__)


@groups_bp.route("", methods=["GET"])
@login_required
def list_groups():
    groups = Group.query.order_by(Group.group_name).all()
    return jsonify(success=True, data=[{"id": g.id, "name": g.group_name} for g in groups])


@groups_bp.route("", methods=["POST"])
@role_required("admin", "hr")
def create_group():
    data = request.get_json(silent=True) or {}
    group = Group(
        group_name=data.get("group_name"),
        description=data.get("description"),
        created_by=int(get_jwt_identity()) if get_jwt_identity() else None,
    )
    db.session.add(group)
    db.session.commit()

    for employee_id in data.get("employee_ids", []):
        db.session.add(GroupMember(group_id=group.id, employee_id=employee_id))
    db.session.commit()

    log_action("group.create", target_type="group", target_id=group.id)
    return jsonify(success=True, data={"id": group.id}), 201

# TODO: رحّل edit.php و delete.php و view.php بنفس نمط employees_bp
