from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(*allowed_roles):
    """ديكوريتور لأي route: يتحقق من وجود JWT صالح، ثم يتأكد أن دور
    صاحبه ضمن allowed_roles. لا يثق أبداً بأي شيء يرسله العميل عن دوره
    الخاص -- الدور يُقرأ فقط من داخل الـ JWT الموقّع وقت تسجيل الدخول.

    هذا هو الإصلاح المباشر لثغرة employees/update.php في النسخة القديمة
    التي لم تتحقق من أي صلاحية إطلاقاً:

        @employees_bp.route("/<int:employee_id>", methods=["PUT"])
        @role_required("admin", "hr")
        def update_employee(employee_id):
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in allowed_roles:
                return jsonify(success=False, message="Unauthorized"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def login_required(fn):
    """يتطلب فقط مستخدمًا مسجّل دخول (أي دور)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper
