from flask import Blueprint, jsonify
from app.middleware.rbac import login_required

tasks_bp = Blueprint("tasks", __name__)


from flask import request
from app.services.task_service import TaskService
from flask_jwt_extended import get_jwt_identity
from app.models.user import User

@tasks_bp.route("", methods=["GET"])
@login_required
def list_tasks():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if user.role in ['admin', 'hr']:
        tasks = TaskService.get_all_tasks()
    else:
        tasks = TaskService.get_tasks_for_employee(user.employee_id)
        
    return jsonify(success=True, data=[{
        "id": t.id,
        "title": t.title,
        "note": t.note,
        "deadline": t.deadline.isoformat() if t.deadline else None,
        "assigned_at": t.assigned_at.isoformat()
    } for t in tasks])

@tasks_bp.route("", methods=["POST"])
@login_required
def create_task():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['admin', 'hr']:
        return jsonify(success=False, message="Unauthorized"), 403
        
    data = request.get_json(silent=True) or {}
    if 'group_id' not in data or 'title' not in data:
        return jsonify(success=False, message="group_id and title are required"), 400

    try:
        task = TaskService.create_task(
            group_id=data['group_id'],
            title=data['title'],
            note=data.get('note'),
            deadline=data.get('deadline'),
            assigned_by=user_id
        )
    except ValueError as e:
        # الإصلاح: create_task أصبحت ترفع ValueError إن كانت group_id
        # لا تشير إلى مجموعة موجودة فعلاً -- يجب أن يصل هذا كخطأ 400
        # واضح للعميل بدل تسريبه كخطأ 500 (IntegrityError من قاعدة
        # البيانات على مفتاح أجنبي غير موجود).
        return jsonify(success=False, message=str(e)), 400

    return jsonify(success=True, task_id=task.id)

@tasks_bp.route("/<int:task_id>/assign", methods=["POST"])
@login_required
def assign_task(task_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.role not in ['admin', 'hr']:
        return jsonify(success=False, message="Unauthorized"), 403
        
    data = request.get_json(silent=True) or {}
    if 'employee_id' not in data:
        return jsonify(success=False, message="employee_id is required"), 400

    try:
        TaskService.assign_task(task_id, data['employee_id'])
    except ValueError as e:
        # الإصلاح: assign_task أصبحت ترفع ValueError إن كانت المهمة/
        # الموظف غير موجودين، أو إن لم يكن الموظف عضوًا في مجموعة هذه
        # المهمة أصلاً، أو إن كان مُسندًا لها مسبقًا.
        return jsonify(success=False, message=str(e)), 400

    return jsonify(success=True, message="Task assigned successfully")

@tasks_bp.route("/<int:task_id>/progress", methods=["POST"])
@login_required
def update_progress(task_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json(silent=True) or {}

    # Employees can only update their own tasks
    employee_id = user.employee_id if user.role == 'employee' else data.get('employee_id')

    if not employee_id:
        return jsonify(success=False, message="employee_id is required"), 400

    if 'progress' not in data:
        return jsonify(success=False, message="progress is required"), 400

    try:
        TaskService.update_progress(
            task_id=task_id,
            employee_id=employee_id,
            progress_val=data['progress'],
            note=data.get('note')
        )
    except ValueError as e:
        # الإصلاح: update_progress أصبحت ترفع ValueError إن لم يكن
        # الموظف مُسندًا فعليًا لهذه المهمة، أو إن كانت قيمة progress
        # خارج المدى المسموح -- يجب أن يصل هذا كخطأ 400 واضح للعميل
        # بدل تسريبه كخطأ 500 غير معالج.
        return jsonify(success=False, message=str(e)), 400

    return jsonify(success=True, message="Progress updated")
