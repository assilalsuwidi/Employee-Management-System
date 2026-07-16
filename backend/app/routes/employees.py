from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.employee import Employee
from app.middleware.rbac import role_required, login_required
from app.middleware.audit import log_action
from app.utils.file_upload import save_uploaded_file
from app.utils.validators import is_valid_email

employees_bp = Blueprint("employees", __name__)


@employees_bp.route("", methods=["GET"])
@login_required
def list_employees():
    employees = Employee.query.order_by(Employee.id.desc()).all()
    return jsonify(success=True, data=[e.to_dict() for e in employees])


@employees_bp.route("/<int:employee_id>", methods=["GET"])
@login_required
def get_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    return jsonify(success=True, data=employee.to_dict())


@employees_bp.route("", methods=["POST"])
@role_required("admin", "hr")
def create_employee():
    data = request.form
    if not data.get("email") or not is_valid_email(data["email"]):
        return jsonify(success=False, message="A valid email is required"), 400

    employee = Employee(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        department_id=data.get("department_id") or None,
        join_date=data.get("join_date"),
    )

    if "image" in request.files:
        path, error = save_uploaded_file(
            request.files["image"], "employees", {"png", "jpg", "jpeg", "webp"}
        )
        if error:
            return jsonify(success=False, message=error), 400
        employee.image = path

    db.session.add(employee)
    db.session.commit()
    log_action("employee.create", target_type="employee", target_id=employee.id)
    return jsonify(success=True, message="Employee created", data=employee.to_dict()), 201


@employees_bp.route("/<int:employee_id>", methods=["PUT"])
@role_required("admin", "hr")   # <-- الإصلاح: update.php القديم لم يكن فيه أي تحقق إطلاقاً
def update_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    data = request.form

    for field in ["first_name", "last_name", "phone", "address",
                  "emergency_name", "emergency_phone", "emergency_relation"]:
        if field in data:
            setattr(employee, field, data[field])

    if "email" in data:
        if not is_valid_email(data["email"]):
            return jsonify(success=False, message="Invalid email"), 400
        employee.email = data["email"]

    if "image" in request.files:
        path, error = save_uploaded_file(
            request.files["image"], "employees", {"png", "jpg", "jpeg", "webp"}
        )
        if error:
            return jsonify(success=False, message=error), 400
        employee.image = path

    db.session.commit()
    log_action("employee.update", target_type="employee", target_id=employee.id)
    return jsonify(success=True, message="Employee updated", data=employee.to_dict())


@employees_bp.route("/<int:employee_id>", methods=["DELETE"])
@role_required("admin", "hr")
def delete_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    db.session.delete(employee)
    db.session.commit()
    log_action("employee.delete", target_type="employee", target_id=employee_id)
    return jsonify(success=True, message="Employee deleted")

# TODO: قم بترحيل fetchByDepartment.php و count_by_department.php و
# fetchGroupEmployees.php بنفس النمط (route رفيع + منطق في service عند الحاجة)
