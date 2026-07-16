from app import create_app
import os

app = create_app(os.getenv("FLASK_CONFIG", "default"))

with app.app_context():
    try:
        from app.models.user import User
        from app.services.auth_service import AuthService
        # Check if we can query the database.
        # Sometimes MySQL takes a few seconds to initialize during the first run.
        if not User.query.filter_by(username="admin").first():
            AuthService.register_user("admin", "admin@example.com", "admin123", "admin")
            print("Default admin user created: admin / admin123")
    except Exception as e:
        print("Database not ready yet or admin user check skipped:", e)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
