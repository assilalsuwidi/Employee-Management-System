from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from app.extensions import db
from app.models.employee import Employee
from app.models.user import User
from app.services.auth_service import AuthService
from app.middleware.rbac import role_required, login_required
from app.middleware.audit import log_action
from app.utils.file_upload import save_uploaded_file
from app.utils.validators import is_valid_email
from datetime import datetime, date, time
from app.models.payroll import SalaryStructure, LoginRule

employees_bp = Blueprint("employees", __name__)


@employees_bp.route("", methods=["GET"])
@login_required
def list_employees():
    """الإصلاح (IDOR): كان أي مستخدم مسجّل دخول -- حتى بدور employee --
    يرى بيانات كل الموظفين الآخرين. الآن: admin/hr يريان القائمة كاملة،
    وأي دور آخر (employee) يرى سجله الخاص فقط."""
    claims = get_jwt()
    if claims.get("role") in ("admin", "hr"):
        employees = Employee.query.order_by(Employee.id.desc()).all()
        return jsonify(success=True, data=[e.to_dict() for e in employees])

    own_employee_id = claims.get("employee_id")
    if not own_employee_id:
        return jsonify(success=True, data=[])
    employee = Employee.query.get(own_employee_id)
    return jsonify(success=True, data=[employee.to_dict()] if employee else [])


@employees_bp.route("/<int:employee_id>", methods=["GET"])
@login_required
def get_employee(employee_id):
    """الإصلاح (IDOR): موظف عادي كان يستطيع فتح /employees/<id> لأي زميل
    له عبر تغيير الرقم في الرابط. الآن يُقارن employee_id في الـ JWT."""
    claims = get_jwt()
    if claims.get("role") not in ("admin", "hr") and claims.get("employee_id") != employee_id:
        return jsonify(success=False, message="Unauthorized"), 403

    employee = Employee.query.get_or_404(employee_id)
    return jsonify(success=True, data=employee.to_dict())


@employees_bp.route("", methods=["POST"])
@role_required("admin", "hr")
def create_employee():
    data = request.form
    if not data.get("email") or not is_valid_email(data["email"]):
        return jsonify(success=False, message="A valid email is required"), 400

    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify(success=False, message="Username and password are required"), 400

    if User.query.filter_by(username=username).first():
        return jsonify(success=False, message="Username is already taken"), 400

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
    db.session.flush()  # get ID before commit

    try:
        AuthService.register_user(username, data.get("email"), password, "employee", employee.id)
    except ValueError as e:
        db.session.rollback()
        return jsonify(success=False, message=str(e)), 400

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


@employees_bp.route("/<int:employee_id>/salary", methods=["GET"])
@role_required("admin", "hr")
def get_salary(employee_id):
    struct = SalaryStructure.query.filter_by(employee_id=employee_id).first()
    if not struct:
        return jsonify(success=False, message="Salary structure not found"), 404
    return jsonify(success=True, data={
        "basic_salary": float(struct.basic_salary),
        "overtime_rate": float(struct.overtime_rate),
        "bonus_allowed": struct.bonus_allowed
    })

@employees_bp.route("/<int:employee_id>/salary", methods=["PUT"])
@role_required("admin", "hr")
def update_salary(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    data = request.get_json()
    
    struct = SalaryStructure.query.filter_by(employee_id=employee_id).first()
    if not struct:
        struct = SalaryStructure(employee_id=employee_id, effective_from=date.today())
        db.session.add(struct)
        
    struct.basic_salary = data.get("basic_salary", struct.basic_salary)
    struct.overtime_rate = data.get("overtime_rate", struct.overtime_rate)
    if "bonus_allowed" in data:
        struct.bonus_allowed = data["bonus_allowed"]
        
    db.session.commit()
    log_action("employee.salary_update", target_type="employee", target_id=employee_id)
    return jsonify(success=True, message="Salary structure updated")

@employees_bp.route("/<int:employee_id>/rules", methods=["GET"])
@role_required("admin", "hr")
def get_rules(employee_id):
    rule = LoginRule.query.filter_by(employee_id=employee_id).first()
    if not rule:
        return jsonify(success=False, message="Login rules not found"), 404
    return jsonify(success=True, data={
        "login_time": rule.login_time.strftime("%H:%M") if rule.login_time else "09:00",
        "grace_period_minutes": rule.grace_period_minutes,
        "fine_per_day": float(rule.fine_per_day)
    })

@employees_bp.route("/<int:employee_id>/rules", methods=["PUT"])
@role_required("admin", "hr")
def update_rules(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    data = request.get_json()
    
    rule = LoginRule.query.filter_by(employee_id=employee_id).first()
    if not rule:
        rule = LoginRule(employee_id=employee_id)
        db.session.add(rule)
        
    if "login_time" in data:
        time_parts = data["login_time"].split(":")
        rule.login_time = time(int(time_parts[0]), int(time_parts[1]))
        
    rule.grace_period_minutes = data.get("grace_period_minutes", rule.grace_period_minutes)
    rule.fine_per_day = data.get("fine_per_day", rule.fine_per_day)
    
    db.session.commit()
    log_action("employee.rules_update", target_type="employee", target_id=employee_id)
    return jsonify(success=True, message="Login rules updated")

