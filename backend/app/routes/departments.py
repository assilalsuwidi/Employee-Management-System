from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.employee import Department
from app.middleware.rbac import role_required, login_required
from app.middleware.audit import log_action

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("", methods=["GET"])
@login_required
def list_departments():
    departments = Department.query.order_by(Department.name).all()
    return jsonify(success=True, data=[{"id": d.id, "name": d.name} for d in departments])


@departments_bp.route("", methods=["POST"])
@role_required("admin")
def create_department():
    name = (request.get_json(silent=True) or {}).get("name")
    if not name:
        return jsonify(success=False, message="Name is required"), 400
    department = Department(name=name)
    db.session.add(department)
    db.session.commit()
    log_action("department.create", target_type="department", target_id=department.id)
    return jsonify(success=True, data={"id": department.id, "name": department.name}), 201


@departments_bp.route("/<int:department_id>", methods=["PUT"])
@role_required("admin")
def update_department(department_id):
    department = Department.query.get_or_404(department_id)
    name = (request.get_json(silent=True) or {}).get("name")
    if not name:
        return jsonify(success=False, message="Name is required"), 400
    department.name = name
    db.session.commit()
    log_action("department.update", target_type="department", target_id=department.id)
    return jsonify(success=True, message="Department updated")


@departments_bp.route("/<int:department_id>", methods=["DELETE"])
@role_required("admin")
def delete_department(department_id):
    department = Department.query.get_or_404(department_id)
    db.session.delete(department)
    db.session.commit()
    log_action("department.delete", target_type="department", target_id=department_id)
    return jsonify(success=True, message="Department deleted")
