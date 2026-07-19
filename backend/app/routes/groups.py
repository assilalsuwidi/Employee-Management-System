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
    result = []
    for g in groups:
        members = GroupMember.query.filter_by(group_id=g.id).all()
        result.append({
            "id": g.id,
            "name": g.group_name,
            "description": g.description,
            "member_count": len(members),
            "member_ids": [m.employee_id for m in members]
        })
    return jsonify(success=True, data=result)


@groups_bp.route("", methods=["POST"])
@role_required("admin", "hr")
def create_group():
    data = request.get_json(silent=True) or {}
    if not data.get("group_name"):
        return jsonify(success=False, message="اسم المجموعة مطلوب"), 400

    group = Group(**{  # type: ignore
        "group_name": data.get("group_name"),
        "description": data.get("description"),
        "created_by": int(get_jwt_identity()) if get_jwt_identity() else None,
    })
    db.session.add(group)
    db.session.commit()

    for employee_id in data.get("employee_ids", []):
        db.session.add(GroupMember(**{"group_id": group.id, "employee_id": employee_id}))  # type: ignore
    db.session.commit()

    log_action("group.create", target_type="group", target_id=group.id)
    return jsonify(success=True, data={"id": group.id, "name": group.group_name}), 201


@groups_bp.route("/<int:group_id>", methods=["PUT"])
@role_required("admin", "hr")
def update_group(group_id):
    group = Group.query.get_or_404(group_id)
    data = request.get_json(silent=True) or {}

    if "group_name" in data and data["group_name"].strip():
        group.group_name = data["group_name"].strip()
    if "description" in data:
        group.description = data["description"]

    # تحديث الأعضاء
    if "employee_ids" in data:
        GroupMember.query.filter_by(group_id=group_id).delete()
        for employee_id in data["employee_ids"]:
            db.session.add(GroupMember(**{"group_id": group.id, "employee_id": employee_id}))  # type: ignore

    db.session.commit()
    log_action("group.update", target_type="group", target_id=group.id)
    return jsonify(success=True, message="تم تحديث المجموعة بنجاح")


@groups_bp.route("/<int:group_id>", methods=["DELETE"])
@role_required("admin", "hr")
def delete_group(group_id):
    group = Group.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    log_action("group.delete", target_type="group", target_id=group_id)
    return jsonify(success=True, message="تم حذف المجموعة بنجاح")
