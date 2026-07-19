-- =========================================================
-- مخطط قاعدة البيانات - نظام إدارة الموظفين (بعد التحويل)
-- نفس المخطط الأصلي للمشروع + إضافة audit_logs (لم تكن موجودة سابقاً)
-- =========================================================

CREATE TABLE employees (
			id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
			email VARCHAR(100) COLLATE utf8mb4_general_ci UNIQUE,
			phone VARCHAR(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
			image VARCHAR(250) COLLATE utf8mb4_general_ci DEFAULT NULL,
			join_date DATE NOT NULL,
			status ENUM('active', 'inactive') COLLATE utf8mb4_general_ci DEFAULT 'active',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			first_name VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
			last_name VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
			address TEXT DEFAULT NULL,
			department_id INT(11) DEFAULT NULL,
			emergency_name VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
			emergency_phone VARCHAR(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
			emergency_relation VARCHAR(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
			INDEX fk_department (department_id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE users (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		username VARCHAR(100) UNIQUE NOT NULL,
			email VARCHAR(100) DEFAULT NULL,
    		password VARCHAR(255) NOT NULL,
    		role ENUM('admin','hr','employee') NOT NULL DEFAULT 'employee',
    		employee_id INT DEFAULT NULL,
    		status ENUM ('active','inactive') DEFAULT 'active',
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
		);

CREATE TABLE attendance (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		employee_id INT NOT NULL,
			date DATE NOT NULL,
    		check_in TIME,
    		is_late BOOLEAN DEFAULT 0,
    		is_weekend BOOLEAN DEFAULT 0,
    		is_holiday BOOLEAN DEFAULT 0,
    		late_fine DECIMAL(10,2) DEFAULT 0,
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		UNIQUE KEY (employee_id, date),
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
		);

CREATE TABLE payroll (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		employee_id INT NOT NULL,
			month TINYINT UNSIGNED NOT NULL,
    		year YEAR(4) NOT NULL,
    		basic_salary DECIMAL(10,2) NOT NULL,
    		bonus DECIMAL(10,2) DEFAULT 0,
    		overtime DECIMAL(10,2) DEFAULT 0,
    		deduction DECIMAL(10,2) DEFAULT 0,
    		late_fine DECIMAL(10,2) DEFAULT 0,
    		net_salary DECIMAL (10,2),
    		generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		UNIQUE KEY uk_emp_month_year(employee_id, month, year),
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    		CONSTRAINT chk_month CHECK (month BETWEEN 1 AND 12)
		);

CREATE TABLE salary_structure (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		employee_id INT UNIQUE NOT NULL,
			basic_salary DECIMAL(10,2) NOT NULL,
		    overtime_rate DECIMAL(10,2) DEFAULT 0,
    		bonus_allowed BOOLEAN DEFAULT 0,
    		effective_from DATE NOT NULL,
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
		);

CREATE TABLE login_rules (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		employee_id INT UNIQUE NOT NULL,
			login_time TIME NOT NULL,
    		grace_period_minutes INT DEFAULT 2,
    		fine_per_day DECIMAL(10,2),
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
		);

CREATE TABLE late_fines (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		employee_id INT,
			attendance_id INT,
    		date DATE,
    		fine_amount DECIMAL(10,2),
    		reason VARCHAR(255) DEFAULT 'Late Attendance',
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    		FOREIGN KEY (attendance_id) REFERENCES attendance(id) ON DELETE CASCADE
		);

CREATE TABLE documents (
			id INT AUTO_INCREMENT PRIMARY KEY,
			employee_id INT NOT NULL,
			doc_type ENUM('certificate', 'experience', 'other') NOT NULL,
			file_path VARCHAR(255) NOT NULL,
			FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
			UNIQUE KEY uk_emp_doctype (employee_id, doc_type)
		);

CREATE TABLE holidays (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(100),
    		holiday_date DATE UNIQUE NOT NULL,
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

CREATE TABLE weekends (
			id INT AUTO_INCREMENT PRIMARY KEY,
			day_of_week ENUM('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday') UNIQUE
		);

CREATE TABLE departments (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

CREATE TABLE `groups` (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		group_name VARCHAR (100) NOT NULL,
			description TEXT,
		    created_by INT,
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
		);

CREATE TABLE group_members (
			id INT AUTO_INCREMENT PRIMARY KEY,
    		group_id INT NOT NULL,
			employee_id INT NOT NULL,
    		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    		FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
		);

CREATE TABLE tasks (
    		id INT AUTO_INCREMENT PRIMARY KEY,
    		group_id INT NOT NULL,
			title VARCHAR(255) NOT NULL,
    		note TEXT,
    		deadline DATE,
    		assigned_by INT DEFAULT NULL,
    		assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    		FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    		FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
		);

CREATE TABLE task_files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
		);

CREATE TABLE task_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            employee_id INT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
		);

CREATE TABLE task_progress(
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            employee_id INT NOT NULL,
            progress INT DEFAULT 0,
			note TEXT DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
   		);

-- =========================================================
-- جديد: جدول التدقيق (Audit Log) — العمود الفقري لمرحلة "الصيانة
-- والعمليات" في S-SDLC ولبند OWASP A09 (Logging & Monitoring Failures)
-- =========================================================
CREATE TABLE audit_logs (
			id INT AUTO_INCREMENT PRIMARY KEY,
			actor_user_id INT DEFAULT NULL,
			actor_role VARCHAR(20),
			action VARCHAR(100) NOT NULL,
			target_type VARCHAR(50),
			target_id INT,
			ip_address VARCHAR(45),
			metadata_json TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			INDEX idx_created_at (created_at),
			FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
		);

-- =========================================================
-- جديد: جدول حظر الرموز (Token Blocklist)
-- لمنع استخدام الرموز بعد تسجيل الخروج (S-SDLC)
-- =========================================================
CREATE TABLE token_blocklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jti VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_jti (jti)
);

-- =========================================================
-- جدول طلبات الإجازات (Leave Requests)
-- =========================================================
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type ENUM('annual', 'sick', 'unpaid', 'emergency') DEFAULT 'annual',
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewer_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);
