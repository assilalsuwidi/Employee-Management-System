import re

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def is_valid_email(email: str) -> bool:
    return bool(email) and bool(EMAIL_RE.match(email))


def validate_password_strength(password: str):
    """يعيد قائمة بالمشاكل؛ قائمة فارغة تعني أن كلمة المرور قوية بما
    يكفي. يطبّق نفس سياسة محاضرة S-SDLC: 12 حرفًا على الأقل + حرف كبير +
    حرف صغير + رقم + رمز."""
    problems = []
    if len(password) < 12:
        problems.append("Password must be at least 12 characters long")
    if not re.search(r"[A-Z]", password):
        problems.append("Password must contain an uppercase letter")
    if not re.search(r"[a-z]", password):
        problems.append("Password must contain a lowercase letter")
    if not re.search(r"\d", password):
        problems.append("Password must contain a digit")
    if not re.search(r"[^A-Za-z0-9]", password):
        problems.append("Password must contain a symbol")
    return problems
