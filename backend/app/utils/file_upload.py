import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


def save_uploaded_file(file_storage, subfolder, allowed_extensions):
    """رفع ملفات آمن بمبدأ القائمة البيضاء (whitelist).
    هذا هو الإصلاح المباشر لثغرة رفع الملفات غير المقيّد الموجودة في
    reg_employee.php و update.php القديمين، واللذين كانا يقبلان أي ملف
    يُرسَل باسم 'image' دون فحص امتداده أو نوعه أو حجمه."""
    if not file_storage or file_storage.filename == "":
        return None, "No file provided"

    filename = secure_filename(file_storage.filename)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in allowed_extensions:
        return None, f"File type .{ext} is not allowed"

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(target_dir, exist_ok=True)

    file_storage.save(os.path.join(target_dir, unique_name))
    return f"{subfolder}/{unique_name}", None
