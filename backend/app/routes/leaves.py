from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from datetime import datetime
from app.extensions import db
from app.models.leave import LeaveRequest
from app.models.user import User
from app.middleware.rbac import login_required, role_required
from app.middleware.audit import log_action

leaves_bp = Blueprint("leaves", __name__)

@leaves_bp.route("", methods=["POST"])
@login_required
def request_leave():
    claims = get_jwt()
    employee_id = claims.get("employee_id")
    
    # If it's an admin without an employee_id, we can either block them or allow them if they pass an employee_id
    if not employee_id:
        employee_id = request.get_json().get("employee_id")
        if not employee_id:
            return jsonify(success=False, message="Employee ID is required"), 400

    data = request.get_json()
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    leave_type = data.get("leave_type", "annual")
    reason = data.get("reason", "")

    if not start_date_str or not end_date_str:
        return jsonify(success=False, message="Start and End dates are required"), 400

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify(success=False, message="Invalid date format. Use YYYY-MM-DD"), 400

    leave_req = LeaveRequest(
        employee_id=employee_id,
        start_date=start_date,
        end_date=end_date,
        leave_type=leave_type,
        reason=reason,
        status="pending"
    )
    db.session.add(leave_req)
    db.session.commit()
    
    log_action("leave.request", target_type="leave", target_id=leave_req.id)
    return jsonify(success=True, message="Leave request submitted", data=leave_req.to_dict()), 201


@leaves_bp.route("", methods=["GET"])
@login_required
def get_leaves():
    claims = get_jwt()
    if claims.get("role") in ("admin", "hr"):
        leaves = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    else:
        employee_id = claims.get("employee_id")
        leaves = LeaveRequest.query.filter_by(employee_id=employee_id).order_by(LeaveRequest.created_at.desc()).all()

    return jsonify(success=True, data=[l.to_dict() for l in leaves])


@leaves_bp.route("/<int:leave_id>/status", methods=["PUT"])
@role_required("admin", "hr")
def update_leave_status(leave_id):
    leave = LeaveRequest.query.get_or_404(leave_id)
    data = request.get_json()
    
    status = data.get("status")
    if status not in ["approved", "rejected"]:
        return jsonify(success=False, message="Invalid status"), 400

    leave.status = status
    leave.reviewer_id = get_jwt_identity()
    db.session.commit()

    log_action("leave.update_status", target_type="leave", target_id=leave.id)
    return jsonify(success=True, message=f"Leave {status}", data=leave.to_dict())
