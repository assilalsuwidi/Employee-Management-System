"""اختبارات أمنية على التحكم بالوصول (RBAC).
هذا الملف اختبار انحدار (regression test) مباشر للثغرة الحقيقية التي
كانت موجودة في employees/update.php بالنسخة القديمة: أي شخص، حتى بلا
تسجيل دخول، كان يستطيع تعديل بيانات أي موظف. الهدف أن هذا الاختبار
يفشل فوراً لو رجعت هذه الثغرة يوماً بالخطأ."""

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


def _login(client, username, password):
    resp = client.post("/api/auth/login", json={"username": username, "password": password})
    return resp.get_json()["access_token"]


def test_employee_cannot_update_other_employee(client):
    AuthService.register_user("emp1", "emp1@test.com", "Str0ng!Passw0rd", "employee")
    token = _login(client, "emp1", "Str0ng!Passw0rd")

    resp = client.put(
        "/api/employees/1",
        data={"first_name": "Hacked"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403


def test_hr_can_update_employee(client):
    AuthService.register_user("hr1", "hr1@test.com", "Str0ng!Passw0rd", "hr")
    token = _login(client, "hr1", "Str0ng!Passw0rd")

    resp = client.put(
        "/api/employees/1",
        data={"first_name": "Updated"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code != 403


def test_unauthenticated_request_is_rejected(client):
    resp = client.put("/api/employees/1", data={"first_name": "NoAuth"})
    assert resp.status_code in (401, 422)  # Flask-JWT-Extended يرجع 401/422 بدون رمز


def test_login_rate_limited_after_repeated_failures(client):
    for _ in range(5):
        client.post("/api/auth/login", json={"username": "nobody", "password": "wrong"})
    resp = client.post("/api/auth/login", json={"username": "nobody", "password": "wrong"})
    assert resp.status_code == 429
