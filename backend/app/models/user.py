from datetime import datetime
from app.extensions import db


class User(db.Model):
    """حساب الدخول (تسجيل الدخول). منفصل عن Employee لأن ليس كل مستخدم
    (مثل admin) هو بالضرورة موظف مرتبط بسجل employees."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100))
    password_hash = db.Column("password", db.String(255), nullable=False)
    role = db.Column(
        db.Enum("admin", "hr", "employee", name="user_role"),
        nullable=False, default="employee",
    )
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="SET NULL")
    )
    status = db.Column(db.Enum("active", "inactive", name="user_status"), default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship("Employee", back_populates="user", uselist=False)
