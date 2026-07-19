import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

# الإصلاح (تحقق من محتوى الملف الفعلي): التحقق من الامتداد وحده (كما
# كان سابقًا) لا يمنع رفع ملف اسمه "x.png" لكن محتواه ليس صورة فعلاً
# (polyglot / محتوى تعسفي). نتحقق الآن من أن البايتات الفعلية تُفتَح
# كصورة صالحة عبر Pillow قبل القبول -- إن لم تكن كذلك يُرفض الملف بصرف
# النظر عن امتداده المُعلَن.
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}


def _looks_like_real_image(file_storage):
    """يفتح الملف فعليًا بمكتبة Pillow للتأكد أنه صورة صالحة، لا مجرد
    بايتات عشوائية بامتداد صورة. يُعيد المؤشر لبداية الملف بعد الفحص
    حتى يمكن حفظه لاحقًا بالكامل."""
    try:
        from PIL import Image
    except ImportError:
        # Pillow غير مثبّتة لأي سبب -- نفشل بأمان (نرفض) بدل تجاهل الفحص.
        current_app.logger.warning("Pillow not installed; cannot verify image content")
        return False

    try:
        file_storage.stream.seek(0)
        with Image.open(file_storage.stream) as img:
            img.verify()  # يتحقق من سلامة بنية الصورة دون تحميلها كاملة
        return True
    except Exception:
        return False
    finally:
        file_storage.stream.seek(0)


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

    # فحص المحتوى الفعلي لأي امتداد يُفترض أنه صورة، بصرف النظر عن اسم
    # الملف المُعلَن -- يمنع رفع ملف غير صورة متنكّر بامتداد صورة.
    if ext in IMAGE_EXTENSIONS and not _looks_like_real_image(file_storage):
        return None, "File content does not match a valid image"

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    target_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(target_dir, exist_ok=True)

    file_storage.save(os.path.join(target_dir, unique_name))
    return f"{subfolder}/{unique_name}", None
