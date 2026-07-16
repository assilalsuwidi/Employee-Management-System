import bcrypt
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models.user import User
from app.middleware.audit import log_action


class AuthService:
    @staticmethod
    def register_user(username, email, password, role, employee_id=None):
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        user = User(
            username=username, email=email, password_hash=password_hash,
            role=role, employee_id=employee_id, status="active",
        )
        db.session.add(user)
        db.session.commit()
        return user

    @staticmethod
    def login_user(username, password):
        user = User.query.filter_by(username=username, status="active").first()

        if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            log_action("auth.login_failed", target_type="user", metadata={"username": username})
            return None, "Invalid login credentials"

        token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role, "employee_id": user.employee_id},
        )
        log_action("auth.login_success", target_type="user", target_id=user.id)
        return token, user
