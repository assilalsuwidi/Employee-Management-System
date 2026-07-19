from datetime import datetime
from app.extensions import db

class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    leave_type = db.Column(db.Enum("annual", "sick", "unpaid", "emergency", name="leave_type_enum"), default="annual")
    reason = db.Column(db.Text)
    status = db.Column(db.Enum("pending", "approved", "rejected", name="leave_status_enum"), default="pending")
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship("Employee", foreign_keys=[employee_id])
    reviewer = db.relationship("User", foreign_keys=[reviewer_id])

    def to_dict(self):
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "employee_name": f"{self.employee.first_name} {self.employee.last_name}" if self.employee else "Unknown",
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "leave_type": self.leave_type,
            "reason": self.reason,
            "status": self.status,
            "reviewer_id": self.reviewer_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
