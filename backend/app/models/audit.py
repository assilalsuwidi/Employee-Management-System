from datetime import datetime
from app.extensions import db


class AuditLog(db.Model):
    """سجل تدقيق لا يُحذف منه شيء (append-only) لكل عملية حساسة في
    النظام. هذا الجدول هو الفرق بين 'نعتقد أن لا أحد لمس الرواتب' وبين
    'هذا بالضبط من غيّر ماذا ومتى'. غير موجود إطلاقًا في النسخة القديمة
    من المشروع، وهو أحد أهم إضافات هذا التحويل (يغطي بند Logging &
    Monitoring من OWASP Top 10 A09، ومرحلة الصيانة والعمليات من S-SDLC)."""

    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    actor_role = db.Column(db.String(20))
    action = db.Column(db.String(100), nullable=False)      # مثال: "employee.update"
    target_type = db.Column(db.String(50))                   # مثال: "employee"
    target_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    metadata_json = db.Column(db.Text)                       # سياق إضافي اختياري
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
