from datetime import datetime
from app.extensions import db


class Holiday(db.Model):
    __tablename__ = "holidays"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    holiday_date = db.Column(db.Date, unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Weekend(db.Model):
    __tablename__ = "weekends"
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(
        db.Enum("Saturday", "Sunday", "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", name="day_of_week"),
        unique=True,
    )


class Attendance(db.Model):
    __tablename__ = "attendance"
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.Time)
    is_late = db.Column(db.Boolean, default=False)
    is_weekend = db.Column(db.Boolean, default=False)
    is_holiday = db.Column(db.Boolean, default=False)
    late_fine = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("employee_id", "date"),)
