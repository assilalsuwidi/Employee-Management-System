# دليل المستخدم - نظام إدارة الموظفين

## الأدوار

| الدور | الصلاحيات |
|---|---|
| **Admin** | كل شيء: إدارة المستخدمين والأقسام والموظفين، عرض سجل التدقيق |
| **HR** | إدارة الموظفين، تسجيل الحضور، توليد الرواتب، إدارة المجموعات والمهام |
| **Employee** | عرض بياناته الخاصة، تسجيل حضوره، متابعة مهامه، عرض قسائم راتبه |

## تسجيل الدخول

`POST /api/auth/login` مع `username` و `password` — يُعيد `access_token`
يجب إرساله في كل طلب لاحق ضمن ترويسة:

```
Authorization: Bearer <access_token>
```

## التشغيل محليًا (بدون Docker)

```bash
cd backend
cp .env.example .env      # ثم عدّل القيم داخل .env
pip install -r requirements.txt --break-system-packages
python run.py
```

## التشغيل عبر Docker (موصى به)

```bash
cp backend/.env.example backend/.env   # ثم عدّل القيم
docker compose up --build
```

- الواجهة الأمامية: http://localhost
- الواجهة الخلفية (API): http://localhost:5000/api
- قاعدة البيانات: localhost:3306

## تشغيل الاختبارات

```bash
cd backend
FLASK_CONFIG=testing pytest ../tests -v
```
