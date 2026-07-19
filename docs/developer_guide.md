## دليل المطور (Developer Guide) - نظام إدارة الموظفين

يهدف هذا الدليل إلى مساعدة المطورين الجدد على فهم هيكلية مشروع نظام إدارة الموظفين، إعداد بيئة التطوير، والمساهمة في تطوير المشروع بفعالية.

### 1. نظرة عامة على المشروع

نظام إدارة الموظفين هو تطبيق ويب متكامل لإدارة بيانات الموظفين، الحضور، المهام، والرواتب. يتكون المشروع من واجهة خلفية (Backend) مبنية باستخدام Flask وواجهة أمامية (Frontend) مبنية باستخدام React.js.

#### المكدس التقني (Tech Stack)

*   **الواجهة الخلفية (Backend):**
    *   Python 3.11+
    *   Flask
    *   SQLAlchemy (ORM)
    *   Flask-JWT-Extended (للمصادقة)
    *   Flask-Migrate (لإدارة ترحيلات قاعدة البيانات)
    *   Flask-Talisman (لرؤوس أمان HTTP)
    *   Bcrypt (لتشفير كلمات المرور)
*   **الواجهة الأمامية (Frontend):**
    *   React.js
    *   Node.js 18+
    *   Vite (أداة بناء)
    *   Axios (لطلبات HTTP)
    *   Tailwind CSS (للتصميم)
*   **قاعدة البيانات:** MySQL
*   **البيئة:** Docker & Docker Compose
*   **إدارة الإصدارات:** Git & GitHub
*   **التكامل المستمر/النشر المستمر (CI/CD):** GitHub Actions
*   **الاختبار:** Pytest

### 2. إعداد بيئة التطوير

لإعداد بيئة التطوير المحلية، اتبع الخطوات التالية:

1.  **استنساخ المستودع (Clone the Repository):**
    ```bash
    git clone <URL_المستودع>
    cd employee-management-system
    ```

2.  **إعداد ملفات البيئة (Environment Files):**
    *   انسخ `backend/.env.example` إلى `backend/.env`.
    *   انسخ `frontend/.env.example` إلى `frontend/.env` (إذا كان موجودًا).
    *   قم بتعديل ملف `backend/.env` لتعيين المتغيرات التالية:
        *   `SECRET_KEY`: مفتاح سري عشوائي لتطبيق Flask.
        *   `JWT_SECRET_KEY`: مفتاح سري عشوائي لـ JWT.
        *   `DATABASE_URL`: رابط اتصال قاعدة البيانات (مثال: `mysql+pymysql://user:password@db/ems_db`).
        *   `INITIAL_ADMIN_USER`: اسم المستخدم للمسؤول الأولي (للتشغيل الأول فقط).
        *   `INITIAL_ADMIN_PASS`: كلمة المرور للمسؤول الأولي (للتشغيل الأول فقط).

3.  **تشغيل Docker Compose:**
    ```bash
    docker-compose up --build -d
    ```
    سيقوم هذا الأمر ببناء وتشغيل حاويات الواجهة الخلفية، الواجهة الأمامية، وقاعدة البيانات.

4.  **إعداد قاعدة البيانات (Database Setup):**
    *   قم بتشغيل ترحيلات قاعدة البيانات (Migrations) من داخل حاوية الواجهة الخلفية:
        ```bash
        docker-compose exec backend flask db upgrade
        ```
    *   (اختياري) قم بتشغيل السكربت الخاص بإنشاء المستخدم المسؤول الأولي (إذا لم يتم إنشاؤه تلقائياً عند التشغيل الأول):
        ```bash
        docker-compose exec backend python -c "from app import create_app, db; from app.models.user import User; app = create_app(); app.app_context().push(); User.create_initial_admin()"
        ```

### 3. هيكلية المشروع

#### الواجهة الخلفية (Backend - Flask)

*   **`backend/app/__init__.py`**: إعداد التطبيق، قاعدة البيانات، JWT، CORS، و Flask-Talisman.
*   **`backend/app/extensions.py`**: تهيئة الإضافات مثل `db` و `jwt`.
*   **`backend/app/models/`**: تعريف نماذج قاعدة البيانات (مثل `User`, `Employee`, `Task`, `Payroll`, `TokenBlocklist`).
*   **`backend/app/routes/`**: مسارات الـ API (Controllers) لكل وحدة (مثل `auth.py`, `employees.py`, `tasks.py`, `payroll.py`).
*   **`backend/app/services/`**: منطق الأعمال المعقد (مثل `auth_service.py`, `task_service.py`, `payroll_service.py`).
*   **`backend/app/middleware/`**: وسيطات أمنية مثل RBAC و Audit Logging.
*   **`backend/app/utils/`**: دوال مساعدة.

#### الواجهة الأمامية (Frontend - React)

*   **`frontend/src/App.jsx`**: المكون الرئيسي وتعريف المسارات.
*   **`frontend/src/components/`**: مكونات الواجهة (مثل `Login`, `Dashboard`, `Employees`, `Tasks`, `Payroll`).
*   **`frontend/src/services/apiService.js`**: خدمة التواصل مع الواجهة الخلفية وإدارة JWT.
*   **`frontend/src/index.css`**: الأنماط العامة.

### 4. إرشادات المساهمة

*   **معايير الكود:** اتبع معايير PEP 8 للغة Python و Airbnb Style Guide لـ JavaScript/React.
*   **الالتزام بـ S-SDLC:** تأكد من أن أي ميزة جديدة أو تعديل يتبع مبادئ دورة حياة تطوير البرمجيات الآمنة:
    *   **نمذجة التهديدات:** قم بإجراء نمذجة تهديدات لأي ميزة جديدة أو تغيير جوهري.
    *   **مراجعة الكود:** اطلب مراجعة الكود من زميل قبل الدمج.
    *   **الاختبار:** اكتب اختبارات الوحدة (Unit Tests) واختبارات التكامل (Integration Tests) لكل كود جديد.
    *   **التوثيق:** قم بتحديث الوثائق ذات الصلة (مثل `architecture.md`, `user_manual.md`, `security_plan.md`) لتعكس التغييرات.
*   **الالتزام بـ Git Flow:** استخدم فروع الميزات (Feature Branches) وطلبات السحب (Pull Requests) لجميع التغييرات.

### 5. الاختبار

*   **اختبارات الوحدة (Unit Tests):** موجودة في مجلد `tests/`.
    *   لتشغيل اختبارات الواجهة الخلفية:
        ```bash
        docker-compose exec backend pytest
        ```
*   **اختبارات الأمان (Security Tests):** يتم تشغيلها تلقائياً عبر GitHub Actions (Bandit, Safety).

### 6. التوثيق

*   **`docs/architecture.md`**: يصف هيكلية النظام والمكونات الرئيسية.
*   **`docs/security_plan.md`**: يوضح خطة الأمان، نمذجة التهديدات، والمتطلبات الأمنية.
*   **`docs/dast_report.md`**: تقرير فحص الضعف الديناميكي (DAST).
*   **`docs/threat_modeling_tasks_payroll.md`**: نمذجة تهديدات محددة لوحدتي المهام والرواتب.
*   **`docs/DFDs/system_flow.md`**: مخططات تدفق البيانات.
*   **`docs/user_manual.md`**: دليل المستخدم النهائي.

نأمل أن يساعدك هذا الدليل في البدء والمساهمة بفعالية في مشروع نظام إدارة الموظفين.
