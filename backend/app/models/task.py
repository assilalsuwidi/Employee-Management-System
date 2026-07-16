from datetime import datetime
from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    note = db.Column(db.Text)
    deadline = db.Column(db.Date)
    assigned_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)


class TaskAssignment(db.Model):
    __tablename__ = "task_assignments"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)


class TaskProgress(db.Model):
    __tablename__ = "task_progress"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    employee_id = db.Column(
        db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False
    )
    progress = db.Column(db.Integer, default=0)
    note = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)


class TaskFile(db.Model):
    __tablename__ = "task_files"
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
