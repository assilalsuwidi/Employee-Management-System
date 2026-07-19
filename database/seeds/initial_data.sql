-- بيانات أولية تجريبية مع مستخدمين يغطون جميع الأدوار الثلاثة

INSERT INTO departments (name) VALUES ('Human Resources'), ('Engineering'), ('Finance');

INSERT INTO weekends (day_of_week) VALUES ('Friday'), ('Saturday');

-- =============================================
-- الموظفون (3 موظفين في 3 أقسام مختلفة)
-- =============================================
INSERT INTO employees (first_name, last_name, email, phone, join_date, department_id, status) VALUES 
('Ahmed', 'Ali', 'ahmed@example.com', '0500000001', '2023-01-01', 2, 'active'),
('Sara', 'Khalid', 'sara@example.com', '0500000002', '2023-02-15', 1, 'active'),
('Omar', 'Hassan', 'omar@example.com', '0500000003', '2023-06-01', 3, 'active');

-- =============================================
-- المستخدمون (3 حسابات تغطي كل الأدوار)
-- =============================================

-- 1) حساب مدير النظام (Admin) - مرتبط بالموظف الأول (Ahmed)
--    اسم المستخدم: admin
--    كلمة المرور: Admin@123456789
INSERT INTO users (username, email, password, role, employee_id, status) VALUES 
('admin', 'admin@example.com', '$2b$12$MWGzntg96G23nQFJPQ.yQeVHAleC7A5jfMqGMMkaOSs68Msj15pgS', 'admin', 1, 'active');

-- 2) حساب موارد بشرية (HR) - مرتبط بالموظفة سارة
--    كلمة المرور: HrUser@123456789
INSERT INTO users (username, email, password, role, employee_id, status) VALUES 
('sara', 'sara@example.com', '$2b$12$BPTJ9UGus2uZ9Fs4WzXRGOf9T/IXJ9WcvQnOtA.A7bOqZIYyiDw9u', 'hr', 2, 'active');

-- 3) حساب موظف عادي (Employee) - مرتبط بالموظف عمر حسن
--    اسم المستخدم: ahmed
--    كلمة المرور: Ahmed@123456789
INSERT INTO users (username, email, password, role, employee_id, status) VALUES 
('ahmed', 'ahmed@example.com', '$2b$12$W9t70ZgZ.iTfD7r9F2O8f.dK6fJzV7kF8T.M0GjY7E8P.yQeVHAle', 'employee', 3, 'active');

-- =============================================
-- ملاحظات إضافية عن المستخدمين الذين تم إضافتهم لاحقاً:
-- =============================================
-- 4) حساب الموظفة لينا (HR): 
--    اسم المستخدم: lina.h 
--    كلمة المرور: HrUser@123456789 (أو ما شابه حسب الإعداد)
--
-- 5) حساب سارة المساعدة (HR): 
--    اسم المستخدم: hr.sara 
--    كلمة المرور: HrUser@123456789
--
-- 6) حساب الموظف عمر كمال:
--    اسم المستخدم: omar.k
--    كلمة المرور: Emp@123456789
