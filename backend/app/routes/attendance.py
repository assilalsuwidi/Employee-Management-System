from datetime import date, datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.extensions import db
from app.models.attendance import Attendance
from app.middleware.rbac import login_required
from app.middleware.audit import log_action

from app.services.attendance_service import record_attendance

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("", methods=["POST"])
@login_required
def check_in():
    """الإصلاح (انتحال هوية): كان أي موظف يستطيع تمرير employee_id في
    جسم الطلب ليسجّل حضورًا باسم زميل آخر. الآن: employee_id من جسم
    الطلب يُقبل فقط لدور admin/hr، وأي دور آخر يُقيَّد بهويته في الـ JWT."""
    claims = get_jwt()
    requested_id = (request.get_json(silent=True) or {}).get("employee_id")

    if requested_id and claims.get("role") in ("admin", "hr"):
        employee_id = requested_id
    else:
        employee_id = claims.get("employee_id")

    if not employee_id:
        return jsonify(success=False, message="Employee ID is required for check-in"), 400

    success, message = record_attendance(employee_id)
    if not success:
        return jsonify(success=False, message=message), 409

    log_action("attendance.check_in", target_type="employee", target_id=employee_id)
    return jsonify(success=True, message=message)

@attendance_bp.route("/reports", methods=["GET"])
@login_required
def get_reports():
    """الإصلاح (IDOR): كان أي مستخدم مسجّل دخول يرى سجلات حضور كل
    الموظفين. الآن: admin/hr فقط يريان كل السجلات، وغيرهم يرى سجله فقط."""
    claims = get_jwt()
    if claims.get("role") in ("admin", "hr"):
        records = Attendance.query.all()
    else:
        own_employee_id = claims.get("employee_id")
        records = Attendance.query.filter_by(employee_id=own_employee_id).all() if own_employee_id else []

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
