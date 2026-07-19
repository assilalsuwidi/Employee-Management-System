from app import create_app
import os
from sqlalchemy.exc import SQLAlchemyError

app = create_app(os.getenv("FLASK_CONFIG", "default"))

with app.app_context():
    try:
        from app.models.user import User
        from app.services.auth_service import AuthService
        # Check if we can query the database.
        # Sometimes MySQL takes a few seconds to initialize during the first run.
        admin_user = os.getenv("INITIAL_ADMIN_USER", "admin")
        admin_pass = os.getenv("INITIAL_ADMIN_PASS")
        if admin_pass and not User.query.filter_by(username=admin_user).first():
            # الإصلاح: التحقق من قوة كلمة المرور (12 حرفًا + حرف كبير +
            # صغير + رقم + رمز) أصبح الآن جزءًا من AuthService.register_user
            # نفسها (مصدر الحقيقة الوحيد)، فترفع ValueError إن كانت
            # ضعيفة -- بدل تكرار الفحص هنا بمعزل عن الدالة الفعلية.
            try:
                AuthService.register_user(admin_user, "admin@example.com", admin_pass, "admin")
                app.logger.info("Initial admin user '%s' created from environment variables.", admin_user)
            except ValueError as e:
                app.logger.warning("Refusing to create initial admin user: weak INITIAL_ADMIN_PASS (%s)", e)
    except SQLAlchemyError:
        # الإصلاح: كان `except Exception as e: print(..., e)` واسعًا جدًا
        # ويطبع نص الاستثناء الخام مباشرة -- وهذا قد يحتوي أحيانًا على
        # جزء من سلسلة الاتصال بقاعدة البيانات (connection string) ضمن
        # لوجات الإقلاع. الآن نضيّق نوع الاستثناء إلى أخطاء قاعدة
        # البيانات فقط (السبب الوحيد المتوقع هنا: القاعدة لم تجهز بعد)،
        # ونسجّله عبر logger.exception (تفاصيل كاملة في اللوج الداخلي
        # فقط) بدل طباعته مباشرة على stdout.
        app.logger.exception("Database not ready yet; skipping initial admin user check")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
