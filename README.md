# Employee Management System — v2 (Secure-SDLC)

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

نظام إدارة موظفين احترافي وآمن، مبني من الصفر استناداً إلى منهجية **تطوير البرمجيات الآمنة (Secure-SDLC)**. يركز المشروع على الأمان في جميع المراحل: التخطيط، التصميم، التطوير، والاختبار، مع تطبيق أدوات فحص الأمان (SAST/DAST) والـ CI/CD.

---

## 🔒 منهجية S-SDLC المتبعة
تم بناء هذا المشروع بمرور كامل على مراحل الـ S-SDLC:
1. **المتطلبات الأمنية:** تحديد متطلبات الأمان (السرية، السلامة، التوافر).
2. **التصميم الآمن:** استخدام نمذجة التهديدات (STRIDE/DREAD) وتوثيق الهيكلية الآمنة (راجع مجلد `docs/`).
3. **التطوير الآمن:** تطبيق مبادئ أمان الكود، التحقق من المدخلات (Input Validation)، وإدارة الصلاحيات (RBAC).
4. **الاختبار المستمر:** دمج أدوات SAST (مثل Bandit) و DAST للتحقق من خلو النظام من الثغرات الشائعة (OWASP Top 10).
5. **النشر الآمن:** النشر كحاويات Docker معزولة.

## 🛠 المكدس التقني (Tech Stack)

- **Backend:** Python (Flask) + SQLAlchemy + JWT + MySQL
- **Frontend:** React (Vite)
- **Database:** MySQL 8
- **Auth:** JWT (Flask-JWT-Extended) + Role-Based Access Control (RBAC) + bcrypt
- **DevOps & Security:** Docker, Docker Compose, Bandit (SAST), OWASP ZAP (DAST)

## 📂 الهيكلية (Architecture)

```text
employee-management-system/
├── .github/workflows/     # CI/CD & Automated Testing
├── backend/               # تطبيق Flask (app factory + blueprints + services)
├── database/              # schema.sql + seeds
├── docker/                # Dockerfile للباك إند والفرونت إند
├── docs/                  # DFDs + architecture + security_plan + SAST/DAST Reports
├── frontend/              # واجهة React
├── tests/                 # unit / integration / security
└── docker-compose.yml     # إعدادات بيئة التشغيل
```

## 🚀 البدء السريع والتثبيت (Quick Start)

### التشغيل عبر Docker (موصى به)
الطريقة الأسهل والأكثر أماناً لتشغيل المشروع هي عبر Docker:

```bash
# 1. نسخ ملف الإعدادات
cp backend/.env.example backend/.env

# 2. بناء وتشغيل الحاويات في الخلفية
docker-compose up -d --build
```
بمجرد الانتهاء:
- **الواجهة الأمامية:** `http://localhost`
- **الواجهة الخلفية:** `http://localhost:5000/api`
- **قاعدة البيانات:** `localhost:3306`

### التشغيل المحلي (سيرفر محلي / Local Server)
يمكنك تشغيله محلياً (مثل Apache/Nginx أو خوادم التطوير):
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt --break-system-packages
python run.py
```

## 🛡 الأمان والفحوصات (Security Tests)
لضمان خلو المشروع من الثغرات، تم تطبيق الفحوصات التالية (تجد التقارير المبدئية في مجلد `docs/`):
- **SAST:** فحص الكود المصدري للواجهة الخلفية باستخدام `Bandit` وللواجهة الأمامية باستخدام `npm audit`.
- **DAST:** محاكاة هجمات حية ضد التطبيق باستخدام أدوات مثل OWASP ZAP لضمان الحماية ضد (SQL Injection, XSS, CSRF).

## 📄 التوثيق (Documentation)
يحتوي مجلد `docs/` على الوثائق التالية:
- `user_manual.md`: دليل الاستخدام الشامل.
- `security_plan.md`: خطة الأمان ونمذجة التهديدات.
- `architecture.md`: الهيكلية المعمارية.
- `sast_report.md` / `dast_report.md`: تقارير فحص الثغرات المبدئية.
- `DFDs/`: مخططات تدفق البيانات.
