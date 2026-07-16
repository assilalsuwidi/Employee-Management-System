from flask import Blueprint, request, jsonify
from app.middleware.rbac import role_required
from app.middleware.audit import log_action

payroll_bp = Blueprint("payroll", __name__)


@payroll_bp.route("/generate", methods=["POST"])
@role_required("admin", "hr")
def generate_payroll():
    data = request.get_json(silent=True) or {}
    # TODO: انقل منطق Admin::generatePayroll() القديم (راتب أساسي + بدل
    # ساعات إضافية + مكافأة - خصم - غرامات تأخير) إلى
    # app/services/payroll_service.py مع تسجيله في AuditLog
    log_action("payroll.generate", target_type="employee", target_id=data.get("employee_id"))
    return jsonify(success=False, message="Not implemented yet -- see docs/architecture.md"), 501
