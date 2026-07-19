"""اختبارات لتخزين التوكن الجديد: refresh_token يجب ألا يظهر إطلاقًا في
جسم استجابة JSON بعد /auth/login، ويجب أن يصل فقط عبر كوكي httpOnly،
ويجب أن يرفض /auth/refresh الطلب بلا رأس CSRF صحيح، ويجب أن يُبطَل رمز
الـ refresh فور استخدامه مرة واحدة (Rotation)."""

import pytest
from app import create_app
from app.extensions import db
from app.services.auth_service import AuthService
from app.models.audit import AuditLog


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _register_and_login(client):
    AuthService.register_user("emp1", "emp1@test.com", "Str0ng!Passw0rd", "employee")
    return client.post("/api/auth/login", json={"username": "emp1", "password": "Str0ng!Passw0rd"})


def _extract_cookie_value(resp, name):
    for c in resp.headers.get_all("Set-Cookie"):
        if c.startswith(f"{name}="):
            return c.split(";")[0].split("=", 1)[1]
    return None


def test_refresh_token_not_in_json_body(client):
    resp = _register_and_login(client)
    body = resp.get_json()
    assert "access_token" in body
    assert "refresh_token" not in body  # لم يعد يُرجَع في الجسم أبدًا


def test_refresh_token_set_as_httponly_cookie(client):
    resp = _register_and_login(client)
    cookie_headers = resp.headers.get_all("Set-Cookie")
    refresh_cookie = next((c for c in cookie_headers if c.startswith("refresh_token_cookie=")), None)
    assert refresh_cookie is not None
    assert "HttpOnly" in refresh_cookie


def test_refresh_without_csrf_header_is_rejected(client):
    _register_and_login(client)
    # لا رأس X-CSRF-TOKEN هنا -- المتصفح يرسل الكوكي تلقائيًا لكن رأس
    # CSRF يجب أن يُرفَق يدويًا من كود الواجهة؛ بدونه يجب أن يُرفَض الطلب.
    resp = client.post("/api/auth/refresh")
    assert resp.status_code in (401, 422)


def test_logout_revokes_cookie_refresh_token(client):
    login_resp = _register_and_login(client)
    access_token = login_resp.get_json()["access_token"]

    resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert resp.status_code == 200

    # الكوكي يجب أن يُمسَح من المتصفح بعد تسجيل الخروج
    cookie_headers = resp.headers.get_all("Set-Cookie")
    cleared = next((c for c in cookie_headers if c.startswith("refresh_token_cookie=")), None)
    assert cleared is not None
    assert cleared.startswith("refresh_token_cookie=;") or "Max-Age=0" in cleared or "expires=Thu, 01-Jan-1970" in cleared


def test_refresh_token_rotation_allows_first_use(client):
    login_resp = _register_and_login(client)
    csrf = _extract_cookie_value(login_resp, "csrf_refresh_token")

    resp = client.post("/api/auth/refresh", headers={"X-CSRF-TOKEN": csrf})
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()

    # يجب أن يصدر التدوير رمز refresh جديدًا (كوكي جديد) وليس نفس القديم
    new_refresh = _extract_cookie_value(resp, "refresh_token_cookie")
    old_refresh = _extract_cookie_value(login_resp, "refresh_token_cookie")
    assert new_refresh is not None
    assert new_refresh != old_refresh


def test_replaying_rotated_out_refresh_token_is_rejected_and_logged(app, client):
    """محاكاة سرقة الرمز: بعد استخدام رمز الـ refresh مرة (تدوير شرعي)،
    محاولة إعادة استخدام نفس الرمز القديم (كأن مهاجمًا نسخه) يجب أن
    تُرفض، ويجب أن يُسجَّل ذلك في audit_logs."""
    login_resp = _register_and_login(client)
    old_refresh = _extract_cookie_value(login_resp, "refresh_token_cookie")
    old_csrf = _extract_cookie_value(login_resp, "csrf_refresh_token")

    # الاستخدام الشرعي الأول -- ينجح ويُبطل old_refresh
    first = client.post("/api/auth/refresh", headers={"X-CSRF-TOKEN": old_csrf})
    assert first.status_code == 200

    # محاكاة مهاجم يملك نسخة من الكوكي القديم: عميل مستقل تمامًا (بدون
    # أي جلسة/كوكيز محفوظة) يرسل الكوكي القديم صراحة برأسه الخام.
    attacker_client = app.test_client()
    replay = attacker_client.post(
        "/api/auth/refresh",
        headers={
            "Cookie": f"refresh_token_cookie={old_refresh}",
            "X-CSRF-TOKEN": old_csrf,
        },
    )
    assert replay.status_code == 401

    with app.app_context():
        entry = AuditLog.query.filter_by(action="auth.revoked_refresh_token_reused").first()
        assert entry is not None
