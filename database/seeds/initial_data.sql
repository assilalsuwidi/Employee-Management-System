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

-- 1) حساب مدير النظام (Admin) - صلاحيات كاملة
--    كلمة المرور: Admin@123456789
INSERT INTO users (username, email, password, role, status) VALUES 
('admin', 'admin@example.com', '$2b$12$MWGzntg96G23nQFJPQ.yQeVHAleC7A5jfMqGMMkaOSs68Msj15pgS', 'admin', 'active');

-- 2) حساب موارد بشرية (HR) - مرتبط بالموظفة سارة
--    كلمة المرور: HrUser@123456789
INSERT INTO users (username, email, password, role, employee_id, status) VALUES 
('sara', 'sara@example.com', '$2b$12$BPTJ9UGus2uZ9Fs4WzXRGOf9T/IXJ9WcvQnOtA.A7bOqZIYyiDw9u', 'hr', 2, 'active');

-- 3) حساب موظف عادي (Employee) - مرتبط بالموظف أحمد
--    كلمة المرور: Admin@123456789
INSERT INTO users (username, email, password, role, employee_id, status) VALUES 
('ahmed', 'ahmed@example.com', '$2b$12$MWGzntg96G23nQFJPQ.yQeVHAleC7A5jfMqGMMkaOSs68Msj15pgS', 'employee', 1, 'active');
