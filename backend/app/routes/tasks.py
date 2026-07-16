from flask import Blueprint, jsonify
from app.middleware.rbac import login_required

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("", methods=["GET"])
@login_required
def list_tasks():
    # TODO: رحّل tasks/admin/list.php و tasks/employee/show_task.php
    # و update_progress.php بنفس النمط
    return jsonify(success=True, data=[])
