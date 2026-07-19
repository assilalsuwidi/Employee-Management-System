from app.extensions import db
from app.models.task import Task, TaskAssignment, TaskProgress
from app.models.group import Group, GroupMember
from app.models.employee import Employee
from datetime import datetime, timezone

class TaskService:
    @staticmethod
    def create_task(group_id, title, note, deadline, assigned_by):
        # الإصلاح (تكامل البيانات): لم يكن هناك أي تحقق أن group_id
        # يشير فعلاً إلى مجموعة موجودة -- كان يمكن إنشاء مهمة يتيمة
        # (orphan) مرتبطة بمجموعة غير موجودة.
        if not Group.query.get(group_id):
            raise ValueError("Group does not exist")
        if not title or not str(title).strip():
            raise ValueError("Task title is required")

        task = Task(
            group_id=group_id,
            title=title,
            note=note,
            deadline=datetime.strptime(deadline, '%Y-%m-%d').date() if deadline else None,
            assigned_by=assigned_by
        )
        db.session.add(task)
        db.session.commit()
        return task

    @staticmethod
    def assign_task(task_id, employee_id):
        # الإصلاح (تكامل البيانات): لم يكن هناك أي تحقق أن task_id/
        # employee_id موجودان فعلاً، ولا أن الموظف عضو أصلاً في المجموعة
        # (group) التي تتبعها هذه المهمة -- كان يمكن إسناد مهمة لموظف من
        # مجموعة مختلفة تمامًا عبر مجرد تمرير أي رقم.
        task = Task.query.get(task_id)
        if not task:
            raise ValueError("Task does not exist")
        if not Employee.query.get(employee_id):
            raise ValueError("Employee does not exist")

        is_group_member = GroupMember.query.filter_by(
            group_id=task.group_id, employee_id=employee_id
        ).first() is not None
        if not is_group_member:
            raise ValueError("Employee is not a member of this task's group")

        already_assigned = TaskAssignment.query.filter_by(
            task_id=task_id, employee_id=employee_id
        ).first() is not None
        if already_assigned:
            raise ValueError("Employee is already assigned to this task")

        assignment = TaskAssignment(task_id=task_id, employee_id=employee_id)
        db.session.add(assignment)
        # Initialize progress for the assigned employee
        progress = TaskProgress(task_id=task_id, employee_id=employee_id, progress=0)
        db.session.add(progress)
        db.session.commit()
        return assignment

    @staticmethod
    def update_progress(task_id, employee_id, progress_val, note=None):
        """الإصلاح (IDOR): كان أي موظف يستطيع تمرير أي task_id (حتى غير
        مُسند له) وسيُنشأ له سجل تقدّم عليها بلا أي تحقق من
        TaskAssignment. الآن يُرفض الطلب صراحة إن لم يكن هذا الموظف
        مُسندًا فعليًا لهذه المهمة.

        الإصلاح الثاني: progress_val لم يكن له أي مدى مسموح (كان يمكن
        إرسال -50 أو 9999)."""
        is_assigned = TaskAssignment.query.filter_by(
            task_id=task_id, employee_id=employee_id
        ).first() is not None
        if not is_assigned:
            raise ValueError("This employee is not assigned to this task")

        try:
            progress_val = int(progress_val)
        except (TypeError, ValueError):
            raise ValueError("progress must be an integer")
        if not (0 <= progress_val <= 100):
            raise ValueError("progress must be between 0 and 100")

        progress = TaskProgress.query.filter_by(task_id=task_id, employee_id=employee_id).first()
        if not progress:
            progress = TaskProgress(task_id=task_id, employee_id=employee_id)
            db.session.add(progress)
        
        progress.progress = progress_val
        progress.note = note
        progress.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return progress

    @staticmethod
    def get_tasks_for_employee(employee_id):
        return Task.query.join(TaskAssignment).filter(TaskAssignment.employee_id == employee_id).all()

    @staticmethod
    def get_all_tasks():
        return Task.query.all()
