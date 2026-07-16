from datetime import datetime
from app.extensions import db


class LoginRule(db.Model):
    __tablename__ = "login_rules"
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    login_time = db.Column(db.Time, nullable=False)
    grace_period_minutes = db.Column(db.Integer, default=2)
    fine_per_day = db.Column(db.Numeric(10, 2))


class LateFine(db.Model):
    __tablename__ = "late_fines"
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"))
    attendance_id = db.Column(db.Integer, db.ForeignKey("attendance.id", ondelete="CASCADE"))
    date = db.Column(db.Date)
    fine_amount = db.Column(db.Numeric(10, 2))
    reason = db.Column(db.String(255), default="Late Attendance")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class SalaryStructure(db.Model):
    __tablename__ = "salary_structure"
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )
    basic_salary = db.Column(db.Numeric(10, 2), nullable=False)
    overtime_rate = db.Column(db.Numeric(10, 2), default=0)
    bonus_allowed = db.Column(db.Boolean, default=False)
    effective_from = db.Column(db.Date, nullable=False)


class Payroll(db.Model):
    __tablename__ = "payroll"
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    month = db.Column(db.SmallInteger, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Numeric(10, 2), nullable=False)
    bonus = db.Column(db.Numeric(10, 2), default=0)
    overtime = db.Column(db.Numeric(10, 2), default=0)
    deduction = db.Column(db.Numeric(10, 2), default=0)
    late_fine = db.Column(db.Numeric(10, 2), default=0)
    net_salary = db.Column(db.Numeric(10, 2))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("employee_id", "month", "year"),)
