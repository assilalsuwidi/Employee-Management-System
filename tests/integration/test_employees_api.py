import pytest
from app import create_app
from app.extensions import db
from app.services.auth_service import AuthService


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()


def test_list_employees_requires_login(client):
    resp = client.get("/api/employees")
    assert resp.status_code in (401, 422)


def test_admin_can_create_employee(client):
    AuthService.register_user("admin1", "admin1@test.com", "Str0ng!Passw0rd", "admin")
    login = client.post("/api/auth/login", json={"username": "admin1", "password": "Str0ng!Passw0rd"})
    token = login.get_json()["access_token"]

    resp = client.post(
        "/api/employees",
        data={
            "first_name": "Sara", "last_name": "Ahmad",
            "email": "sara@test.com", "phone": "0790000000",
            "join_date": "2026-01-01",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["success"] is True
