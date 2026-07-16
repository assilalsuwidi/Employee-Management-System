from datetime import datetime
from app.extensions import db


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employees = db.relationship("Employee", back_populates="department")


class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True)
    phone = db.Column(db.String(20))
    image = db.Column(db.String(250))
    join_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum("active", "inactive", name="employee_status"), default="active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    address = db.Column(db.Text)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    emergency_name = db.Column(db.String(100))
    emergency_phone = db.Column(db.String(20))
    emergency_relation = db.Column(db.String(50))

    department = db.relationship("Department", back_populates="employees")
    user = db.relationship("User", back_populates="employee", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "department_id": self.department_id,
            "department": self.department.name if self.department else None,
            "status": self.status,
            "image": self.image,
        }
