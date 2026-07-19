import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from app.extensions import db
from app.models.user import User
from app.middleware.audit import log_action
from app.utils.validators import validate_password_strength


class AuthService:
    @staticmethod
    def register_user(username, email, password, role, employee_id=None):
        # الإصلاح: كان فحص قوة كلمة المرور (validate_password_strength)
        # يُستدعى فقط من run.py قبل استدعاء register_user لحساب الأدمن
        # الأول -- أي أنه غير مُطبَّق عند نقطة الإنشاء الفعلية نفسها. أي
        # مسار مستقبلي يستدعي register_user مباشرة (مثال: شاشة "إنشاء
        # مستخدم" لو أُضيفت لاحقًا) كان سيتجاوز الفحص بالكامل بالخطأ. الآن
        # الفحص جزء لا يتجزأ من الدالة نفسها (مصدر الحقيقة الوحيد)، وليس
        # مسؤولية كل مستدعٍ أن يتذكر تطبيقه بمعزل عنها.
        problems = validate_password_strength(password)
        if problems:
            raise ValueError("; ".join(problems))

        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user = User(**{  # type: ignore
            "username": username, "email": email, "password_hash": password_hash,
            "role": role, "employee_id": employee_id, "status": "active",
        })
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login_user(username, password):
        user = User.query.filter_by(username=username, status="active").first()

        if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            log_action("auth.login_failed", target_type="user", metadata={"username": username})
            return None, "Invalid login credentials", None

        claims = {"role": user.role, "employee_id": user.employee_id}
        access_token = create_access_token(identity=str(user.id), additional_claims=claims)
        # الإصلاح: JWT_REFRESH_TOKEN_EXPIRES كان معرّفًا في config.py بلا أي
        # استخدام فعلي. الآن يُصدر refresh token حقيقي عند تسجيل الدخول.
        refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
        log_action("auth.login_success", target_type="user", target_id=user.id)
        return access_token, refresh_token, user

    @staticmethod
    def issue_access_token(user):
        claims = {"role": user.role, "employee_id": user.employee_id}
        return create_access_token(identity=str(user.id), additional_claims=claims)

    @staticmethod
    def issue_tokens(user):
        """يصدر زوج access+refresh جديد بالكامل معًا. يُستخدم في تدوير
        الـ refresh token (Refresh Token Rotation): كل استخدام لرمز
        refresh صالح يُبطله فورًا (blocklist) ويصدر رمزًا جديدًا مكانه.
        الفائدة: لو سُرقت نسخة من الرمز واستُخدمت مرة، فإن استخدام
        المالك الشرعي له لاحقًا (أو العكس) سيصطدم برمز مُبطَل بالفعل،
        فيُكتشف الاختراق فورًا بدل أن يبقى الرمز المسروق صالحًا لبقية
        مدته (حتى 7 أيام حاليًا). هذا امتداد يتجاوز ما ورد بالمحاضرة."""
        claims = {"role": user.role, "employee_id": user.employee_id}
        access_token = create_access_token(identity=str(user.id), additional_claims=claims)
        refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)
        return access_token, refresh_token
