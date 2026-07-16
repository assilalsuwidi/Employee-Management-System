from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.attendance import Attendance
from app.middleware.rbac import login_required
from app.middleware.audit import log_action

from app.services.attendance_service import record_attendance

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("", methods=["POST"])
@login_required
def check_in():
    employee_id = (request.get_json(silent=True) or {}).get("employee_id") or (int(get_jwt_identity()) if get_jwt_identity() else None)
    
    success, message = record_attendance(employee_id)
    if not success:
        return jsonify(success=False, message=message), 409

    log_action("attendance.check_in", target_type="employee", target_id=employee_id)
    return jsonify(success=True, message=message)

@attendance_bp.route("/reports", methods=["GET"])
@login_required
def get_reports():
    records = Attendance.query.all()
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "date": r.date.isoformat() if r.date else None,
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "is_late": r.is_late,
            "is_weekend": r.is_weekend,
            "is_holiday": r.is_holiday,
            "late_fine": float(r.late_fine) if r.late_fine else 0.0
        })
    return jsonify(success=True, data=result)
