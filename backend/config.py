import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """الإعدادات الأساسية المشتركة. لا يوجد هنا أي سر — كل قيمة حساسة
    تُقرأ من متغيرات البيئة حتى لا تُرفع بالخطأ إلى Git (كما حدث في
    النسخة القديمة من المشروع مع بيانات قاعدة البيانات وكلمة مرور Gmail)."""

    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MIN", 30))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 7))
    )

    # الإصلاح (تخزين التوكن): access token لم يعد يُرجَع للواجهة عبر
    # sessionStorage فقط -- refresh token أصبح الآن يُسلَّم عبر كوكي
    # httpOnly (لا يقدر أي كود JavaScript، بما فيه هجوم XSS مستقبلي، على
    # قراءته) بدل إرجاعه في جسم استجابة JSON وتخزينه بيد الواجهة.
    # access token يبقى في ذاكرة الواجهة فقط (React state)، لا يُكتب على
    # القرص إطلاقًا، ويُجدَّد صامتًا عبر هذا الكوكي عند تحميل الصفحة.
    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_REFRESH_COOKIE_NAME = "refresh_token_cookie"
    JWT_REFRESH_COOKIE_PATH = "/api/auth"
    # الكوكي لا يُرسَل إلا عبر HTTPS في الإنتاج (يُضبط False فقط أثناء
    # التطوير المحلي بدون TLS عبر متغير البيئة).
    JWT_COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "true").lower() == "true"
    JWT_COOKIE_SAMESITE = "Lax"
    # حماية CSRF لازمة هنا تحديدًا لأن الكوكي يُرسَل تلقائيًا من المتصفح؛
    # Flask-JWT-Extended يطبّق نمط double-submit: يضع قيمة CSRF في كوكي
    # منفصل غير httpOnly تقرأه الواجهة وترسلها كـ header صريح.
    JWT_COOKIE_CSRF_PROTECT = True
    JWT_CSRF_IN_COOKIES = True

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    ADMIN_ALERT_EMAIL = os.getenv("ADMIN_ALERT_EMAIL")

    UPLOAD_FOLDER = os.path.join(basedir, "instance", "uploads")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # حد أقصى 5MB للملف المرفوع
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx"}

    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")

    # افتراضي عام: عدم الإجبار على HTTPS (يُفعَّل صراحة في ProductionConfig).
    # موجود هنا كي لا يفشل app.config["FORCE_HTTPS"] في أي بيئة أخرى.
    FORCE_HTTPS = os.getenv("FORCE_HTTPS", "false").lower() == "true"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv("TEST_DATABASE_URL", "sqlite:///:memory:")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    RATELIMIT_ENABLED = True


class ProductionConfig(Config):
    DEBUG = False
    # الإصلاح: Talisman كان يُستدعى دائمًا بـ force_https=False بصرف النظر
    # عن بيئة التشغيل (حتى في الإنتاج)، فلا يُجبر أي طلب HTTP على التحويل
    # إلى HTTPS من طبقة التطبيق نفسها. الآن القيمة تُقرأ من app.config
    # وتُفعَّل افتراضيًا في الإنتاج (قابلة للتعطيل صراحة عبر متغير بيئة
    # فقط لو كان إنهاء TLS يتم بالكامل من طبقة أخرى تُعيد كتابة الترويسات
    # بشكل صحيح -- الافتراضي الآمن هنا هو "مفعّل").
    FORCE_HTTPS = os.getenv("FORCE_HTTPS", "true").lower() == "true"


config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
