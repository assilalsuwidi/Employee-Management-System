import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from app.utils.validators import is_valid_email, validate_password_strength


def test_valid_email_accepted():
    assert is_valid_email("hr@company.com") is True


def test_invalid_email_rejected():
    assert is_valid_email("not-an-email") is False


def test_weak_password_rejected():
    problems = validate_password_strength("12345678")
    assert len(problems) > 0


def test_strong_password_accepted():
    problems = validate_password_strength("Str0ng!Passw0rd")
    assert problems == []
