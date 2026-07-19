import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getGroups, createGroup, updateGroup, deleteGroup, getEmployees } from "../services/apiService";

export default function Groups() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const gList = await getGroups();
      const eList = await getEmployees();
      setGroups(gList);
      setEmployees(eList);
    } catch (err) {
      console.error(err);
      setError("فشل تحميل مجموعات العمل أو الموظفين.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setGroupName("");
    setDescription("");
    setSelectedEmployees([]);
    setEditMode(false);
    setCurrentGroupId(null);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleOpenEdit = (group) => {
    setGroupName(group.name);
    setDescription(group.description || "");
    setSelectedEmployees(group.member_ids || []);
    setEditMode(true);
    setCurrentGroupId(group.id);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (editMode) {
        await updateGroup(currentGroupId, groupName.trim(), description.trim(), selectedEmployees);
        setSuccess("تم تحديث المجموعة بنجاح.");
      } else {
        await createGroup(groupName.trim(), description.trim(), selectedEmployees);
        setSuccess("تم إنشاء المجموعة بنجاح.");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل حفظ المجموعة.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه المجموعة؟ لا يمكن التراجع.")) return;
    setError("");
    try {
      await deleteGroup(id);
      setSuccess("تم حذف المجموعة بنجاح.");
      fetchItems();
    } catch (err) {
      console.error(err);
      setError("فشل حذف المجموعة.");
    }
  };

  const getSubmitButtonText = () => {
    if (loading) return "جاري الحفظ...";
    if (editMode) return "حفظ التعديلات";
    return "إنشاء";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* شريط التحكم */}
      <div className="controls-bar glass-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>🔗 مجموعات الموظفين</h2>
        {isAdminOrHr && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            + إنشاء مجموعة جديدة
          </button>
        )}
      </div>

      {/* شبكة المجموعات */}
      <div className="employee-grid">
        {groups.map((g) => (
          <div key={g.id} className="employee-card glass-panel" style={{ gap: "0.75rem" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--accent-teal)" }}>
                {g.name}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.4rem", minHeight: "36px" }}>
                {g.description || "لا يوجد وصف لهذه المجموعة"}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>معرّف: #{g.id}</span>
              <span className="badge badge-purple" style={{ fontSize: "0.72rem" }}>
                👥 {g.member_count || 0} عضو
              </span>
            </div>

            {/* أزرار التعديل والحذف لـ Admin/HR فقط */}
            {isAdminOrHr && (
              <div className="employee-card-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(g)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  تعديل
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(g.id)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
            لا توجد مجموعات مسجلة حالياً.
          </div>
        )}
      </div>

      {/* نافذة الإضافة / التعديل */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                {editMode ? "تعديل المجموعة" : "إنشاء مجموعة جديدة"}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="groupName" className="form-label">اسم المجموعة</label>
                <input
                  id="groupName"
                  type="text"
                  className="form-control"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="مثال: فريق الدعم الأمني"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">الوصف</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="أدخل وصفاً للمجموعة..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <div className="form-label">إسناد الموظفين للمجموعة</div>
                <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid var(--glass-border)", borderRadius: "10px", padding: "0.5rem" }}>
                  {employees.map((emp) => (
                    <div key={emp.id} style={{ display: "flex", gap: "0.5rem", padding: "0.3rem 0", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        id={`emp-chk-${emp.id}`}
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => handleToggleEmployee(emp.id)}
                      />
                      <label htmlFor={`emp-chk-${emp.id}`} style={{ fontSize: "0.85rem", cursor: "pointer" }}>
                        {emp.first_name} {emp.last_name}
                      </label>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>لا يوجد موظفون مسجلون.</p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  {getSubmitButtonText()}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
