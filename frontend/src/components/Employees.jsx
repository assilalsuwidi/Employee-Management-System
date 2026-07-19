import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getEmployees,
  getDepartments,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSalary,
  updateEmployeeSalary,
  getEmployeeRules,
  updateEmployeeRules,
} from "../services/apiService";

export default function Employees() {
  const { role } = useAuth();
  // الإصلاح: هذا كان المكوّن الوحيد بلا تحكم أدوار في الواجهة (كل مكوّن
  // آخر -- Departments/Groups/Attendance/AuditLogs -- يستخدم useAuth
  // لإخفاء أزرار الإدارة). والآن بعد أن أصبح الباك إند يُرجع للموظف
  // العادي سجله الشخصي فقط (إصلاح IDOR سابق)، عرض جدول إدارة كامل
  // بأزرار "إضافة/تعديل/حذف" لموظف عادي كان سيبدو كخلل: قائمة من شخص
  // واحد مع أزرار ستفشل بـ 403 عند الضغط عليها.
  const isAdminOrHr = role === "admin" || role === "hr";

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [salaryForm, setSalaryForm] = useState({
    basic_salary: 0,
    overtime_rate: 0,
    bonus_allowed: true,
  });

  const [rulesForm, setRulesForm] = useState({
    login_time: "09:00",
    grace_period_minutes: 15,
    fine_per_day: 50,
  });
  
  // Form state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    join_date: "",
    username: "",
    password: "",
    image: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const emps = await getEmployees();
      const depts = await getDepartments();
      setEmployees(emps);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
      setError("فشل تحميل البيانات من السيرفر.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleOpenAdd = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department_id: "",
      join_date: new Date().toISOString().split("T")[0],
      username: "",
      password: "",
      image: null,
    });
    setEditMode(false);
    setError("");
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setForm({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department_id: emp.department_id || "",
      join_date: emp.join_date ? emp.join_date.split("T")[0] : "",
      username: "",
      password: "",
      image: null,
    });
    setCurrentId(emp.id);
    setEditMode(true);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("department_id", form.department_id);
    formData.append("join_date", form.join_date);
    if (!editMode) {
      formData.append("username", form.username);
      formData.append("password", form.password);
    }
    if (form.image) {
      formData.append("image", form.image);
    }

    try {
      if (editMode) {
        await updateEmployee(currentId, formData);
        setSuccess("تم تحديث بيانات الموظف بنجاح.");
      } else {
        await createEmployee(formData);
        setSuccess("تم إضافة الموظف بنجاح.");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل حفظ البيانات. يرجى التحقق.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الموظف؟")) return;
    setError("");
    setSuccess("");
    try {
      await deleteEmployee(id);
      setSuccess("تم حذف الموظف بنجاح.");
      fetchItems();
    } catch (err) {
      console.error(err);
      setError("فشل حذف الموظف.");
    }
  };

  const handleOpenSalary = async (emp) => {
    setCurrentId(emp.id);
    setError("");
    setSuccess("");
    try {
      const data = await getEmployeeSalary(emp.id);
      setSalaryForm({
        basic_salary: data.basic_salary,
        overtime_rate: data.overtime_rate,
        bonus_allowed: data.bonus_allowed,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setSalaryForm({ basic_salary: 0, overtime_rate: 0, bonus_allowed: true });
      } else {
        setError("فشل جلب بيانات الراتب.");
      }
    }
    setShowSalaryModal(true);
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateEmployeeSalary(currentId, {
        ...salaryForm,
        basic_salary: Number(salaryForm.basic_salary),
        overtime_rate: Number(salaryForm.overtime_rate)
      });
      setSuccess("تم حفظ هيكل الراتب بنجاح.");
      setShowSalaryModal(false);
    } catch (err) {
      console.error("Error saving salary:", err);
      setError(err.response?.data?.message || "فشل حفظ الراتب.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRules = async (emp) => {
    setCurrentId(emp.id);
    setError("");
    setSuccess("");
    try {
      const data = await getEmployeeRules(emp.id);
      setRulesForm({
        login_time: data.login_time,
        grace_period_minutes: data.grace_period_minutes,
        fine_per_day: data.fine_per_day,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setRulesForm({ login_time: "09:00", grace_period_minutes: 15, fine_per_day: 50 });
      } else {
        setError("فشل جلب قواعد الدوام.");
      }
    }
    setShowRulesModal(true);
  };

  const handleSaveRules = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateEmployeeRules(currentId, {
        ...rulesForm,
        grace_period_minutes: Number(rulesForm.grace_period_minutes),
        fine_per_day: Number(rulesForm.fine_per_day)
      });
      setSuccess("تم حفظ قواعد الدوام بنجاح.");
      setShowRulesModal(false);
    } catch (err) {
      console.error("Error saving rules:", err);
      setError(err.response?.data?.message || "فشل حفظ قواعد الدوام.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      (emp.email?.toLowerCase().includes(search.toLowerCase())) ||
      (emp.phone?.includes(search));
      
    const matchesDept = deptFilter ? String(emp.department_id) === String(deptFilter) : true;
    
    return matchesSearch && matchesDept;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Action Controls -- admin/hr فقط؛ موظف عادي يرى سجله الشخصي بلا أدوات إدارة */}
      {isAdminOrHr ? (
        <div className="controls-bar glass-panel" style={{ padding: "1rem 1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flex: 1, alignItems: "center" }}>
            <div className="search-box">
              <svg
                className="search-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
                />
              </svg>
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingRight: "1rem", paddingLeft: "2.5rem", textAlign: "right" }}
              />
            </div>

            <select
              className="form-control"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ minWidth: "150px", height: "42px" }}
            >
              <option value="">جميع الأقسام</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: "16px", height: "16px" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            إضافة موظف
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "1rem 1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>بياناتي</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            هذه بيانات ملفك الشخصي فقط. لتعديلها تواصل مع الموارد البشرية.
          </p>
        </div>
      )}

      {/* Grid of Cards */}
      <div className="employee-grid">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="employee-card glass-panel">
            <div className="employee-card-header">
              {emp.image ? (
                <img
                  src={`http://localhost:5000/api/uploads/${emp.image}`}
                  alt={`${emp.first_name}`}
                  className="emp-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                    e.target.className = "emp-avatar-placeholder";
                  }}
                />
              ) : (
                <div className="emp-avatar-placeholder">
                  {emp.first_name[0].toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  {emp.first_name} {emp.last_name}
                </h3>
                <span className="badge badge-teal" style={{ fontSize: "0.7rem", marginTop: "0.25rem", display: "inline-block" }}>
                  {departments.find((d) => d.id === emp.department_id)?.name || "قسم غير محدد"}
                </span>
              </div>
            </div>

            <div className="employee-card-details">
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <strong>البريد:</strong>
                <span>{emp.email}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <strong>الهاتف:</strong>
                <span>{emp.phone || "لا يوجد"}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <strong>تاريخ الانضمام:</strong>
                <span>{emp.join_date ? emp.join_date.split("T")[0] : "-"}</span>
              </div>
            </div>

            {isAdminOrHr && (
              <div className="employee-card-actions" style={{ flexWrap: "wrap", rowGap: "0.5rem" }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenSalary(emp)}
                  style={{ flex: "1 1 40%", justifyContent: "center", background: "var(--accent-teal)", borderColor: "var(--accent-teal)" }}
                >
                  الراتب
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenRules(emp)}
                  style={{ flex: "1 1 40%", justifyContent: "center", background: "var(--accent-purple)", borderColor: "var(--accent-purple)" }}
                >
                  الدوام
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(emp)}
                  style={{ flex: "1 1 40%", justifyContent: "center" }}
                >
                  تعديل
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(emp.id)}
                  style={{ flex: "1 1 40%", justifyContent: "center" }}
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            لم يتم العثور على أي موظفين مطبقين للبحث.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                {editMode ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="first_name">الاسم الأول</label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    className="form-control"
                    value={form.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="last_name">اللقب</label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    className="form-control"
                    value={form.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">البريد الإلكتروني</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!editMode && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">اسم المستخدم (للدخول)</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      className="form-control"
                      value={form.username}
                      onChange={handleInputChange}
                      required
                      placeholder="مثال: ahmed123"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="password">كلمة المرور</label>
                    <input
                      id="password"
                      type="text"
                      name="password"
                      className="form-control"
                      value={form.password}
                      onChange={handleInputChange}
                      required
                      placeholder="مثال: Emp@123456"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="phone">رقم الهاتف</label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  className="form-control"
                  value={form.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department_id">القسم</label>
                <select
                  id="department_id"
                  name="department_id"
                  className="form-control"
                  value={form.department_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">اختر القسم</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="join_date">تاريخ الانضمام</label>
                <input
                  id="join_date"
                  type="date"
                  name="join_date"
                  className="form-control"
                  value={form.join_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="image_input">الصورة الشخصية</label>
                <div className="file-upload-wrapper">
                  <svg
                    className="file-upload-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                    />
                  </svg>
                  <p className="file-upload-text">
                    {form.image ? form.image.name : "اسحب الصورة هنا أو اضغط للاختيار"}
                  </p>
                  <input
                    id="image_input"
                    type="file"
                    className="file-upload-input"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={loading}
                >
                  {loading ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>إعداد الهيكل المالي</h2>
              <button type="button" className="modal-close" onClick={() => setShowSalaryModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveSalary}>
              <div className="form-group">
                <label className="form-label" htmlFor="basic_salary">الراتب الأساسي</label>
                <input id="basic_salary" type="number" className="form-control" value={salaryForm.basic_salary} onChange={(e) => setSalaryForm({...salaryForm, basic_salary: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="overtime_rate">سعر ساعة الإضافي</label>
                <input id="overtime_rate" type="number" className="form-control" value={salaryForm.overtime_rate} onChange={(e) => setSalaryForm({...salaryForm, overtime_rate: e.target.value})} required />
              </div>
              <div className="form-group" style={{ flexDirection: "row", alignItems: "center" }}>
                <input id="bonus_allowed" type="checkbox" checked={salaryForm.bonus_allowed} onChange={(e) => setSalaryForm({...salaryForm, bonus_allowed: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                <label className="form-label" htmlFor="bonus_allowed" style={{ marginRight: "0.5rem" }}>يستحق المكافآت؟</label>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ"}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalaryModal(false)} style={{ flex: 1, justifyContent: "center" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>إعداد قواعد الدوام</h2>
              <button type="button" className="modal-close" onClick={() => setShowRulesModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveRules}>
              <div className="form-group">
                <label className="form-label" htmlFor="login_time">موعد الدخول (مثال: 09:00)</label>
                <input id="login_time" type="time" className="form-control" value={rulesForm.login_time} onChange={(e) => setRulesForm({...rulesForm, login_time: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="grace_period_minutes">فترة السماح (بالدقائق)</label>
                <input id="grace_period_minutes" type="number" className="form-control" value={rulesForm.grace_period_minutes} onChange={(e) => setRulesForm({...rulesForm, grace_period_minutes: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fine_per_day">غرامة التأخير (لليوم)</label>
                <input id="fine_per_day" type="number" className="form-control" value={rulesForm.fine_per_day} onChange={(e) => setRulesForm({...rulesForm, fine_per_day: e.target.value})} required />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ"}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRulesModal(false)} style={{ flex: 1, justifyContent: "center" }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
