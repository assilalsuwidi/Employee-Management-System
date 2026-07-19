from flask import Blueprint, request, jsonify, current_app
from app.middleware.rbac import role_required
from app.middleware.audit import log_action

payroll_bp = Blueprint("payroll", __name__)


from app.services.payroll_service import PayrollService

@payroll_bp.route("/generate", methods=["POST"])
@role_required("admin", "hr")
def generate_payroll():
    data = request.get_json(silent=True) or {}

    required = ("employee_id", "month", "year")
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify(success=False, message=f"Missing required field(s): {', '.join(missing)}"), 400

    try:
        preview = data.get('preview', False)
        payroll = PayrollService.generate_payroll(
            employee_id=int(data['employee_id']),
            month=int(data['month']),
            year=int(data['year']),
            bonus=data.get('bonus', 0),
            overtime_hours=data.get('overtime_hours', 0),
            deduction=data.get('deduction', 0),
            preview=preview
        )
        
        if not preview:
            log_action("payroll.generate", target_type="employee", target_id=data['employee_id'])

        from app.models.employee import Employee
        emp = Employee.query.get(payroll.employee_id)
        emp_name = f"{emp.first_name} {emp.last_name}" if emp else f"Employee #{payroll.employee_id}"

        return jsonify(
            success=True,
            data={
                "payroll_id": payroll.id,
                "employee_name": emp_name,
                "month": payroll.month,
                "year": payroll.year,
                "base_salary": float(payroll.basic_salary),
                "bonus": float(payroll.bonus),
                "overtime": float(payroll.overtime),
                "deduction": float(payroll.deduction),
                "late_fine": float(payroll.late_fine),
                "earned_salary": float(payroll.basic_salary + payroll.bonus + payroll.overtime),
                "total_deductions": float(payroll.deduction + payroll.late_fine),
                "net_salary": float(payroll.net_salary),
                "actual_work_days": 30, # default/estimated
                "late_days": int(payroll.late_fine / 50) if payroll.late_fine else 0 # estimate based on fine
            }
        )
    except ValueError as e:
        # الإصلاح: ValueError هي أخطاء تحقّق متوقّعة صِيغت عمدًا لتكون
        # آمنة للعرض (مثال: "month must be between 1 and 12"). لا تحمل
        # تفاصيل داخلية عن قاعدة البيانات أو الكود.
        return jsonify(success=False, message=str(e)), 400
    except Exception:
        # الإصلاح: كان `except Exception as e: ... str(e)` يُرجع نص أي
        # استثناء خام للعميل (قد يكشف أسماء أعمدة/جداول SQLAlchemy أو
        # مسارات داخلية). الآن يُسجَّل الخطأ الحقيقي في اللوج فقط،
        # ويحصل العميل على رسالة عامة.
        current_app.logger.exception("Unexpected error while generating payroll")
        return jsonify(success=False, message="Could not generate payroll due to an internal error"), 500

@payroll_bp.route("/history/<int:employee_id>", methods=["GET"])
@role_required("admin", "hr", "employee")
def get_history(employee_id):
    # Security check: employees can only see their own history
    from flask_jwt_extended import get_jwt_identity
    from app.models.user import User
    current_user = User.query.get(get_jwt_identity())
    if current_user.role == 'employee' and current_user.employee_id != employee_id:
        return jsonify(success=False, message="Unauthorized"), 403
        
    history = PayrollService.get_payroll_history(employee_id)
    return jsonify(success=True, data=[{
        "month": p.month,
        "year": p.year,
        "basic_salary": float(p.basic_salary),
        "bonus": float(p.bonus),
        "overtime": float(p.overtime),
        "deduction": float(p.deduction),
        "late_fine": float(p.late_fine),
        "net_salary": float(p.net_salary),
        "generated_at": p.generated_at.isoformat()
    } for p in history])
