import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../services/apiService";

export default function Departments() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [departments, setDepartments] = useState([]);
  const [nameInput, setNameInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      setError("فشل تحميل الأقسام.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createDepartment(nameInput.trim());
      setSuccess("تم إضافة القسم بنجاح.");
      setNameInput("");
      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل إضافة القسم.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (dept) => {
    setEditId(dept.id);
    setEditName(dept.name);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await updateDepartment(id, editName.trim());
      setSuccess("تم تحديث اسم القسم بنجاح.");
      setEditId(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل تعديل القسم.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا القسم؟ قد يؤدي هذا إلى التأثير على الموظفين المسجلين فيه.")) return;
    setError("");
    setSuccess("");
    try {
      await deleteDepartment(id);
      setSuccess("تم حذف القسم بنجاح.");
      fetchItems();
    } catch (err) {
      console.error(err);
      setError("فشل حذف القسم. قد يكون هناك موظفون مرتبطون به.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Inline Form (Only for Admins) */}
      {isAdmin ? (
        <form onSubmit={handleAdd} className="controls-bar glass-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", flex: 1 }}>
            <input
              type="text"
              placeholder="اسم القسم الجديد (مثال: المالية)..."
              className="form-control"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ flex: 1, textAlign: "right" }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              إضافة قسم
            </button>
          </div>
        </form>
      ) : (
        <div className="glass-panel" style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          * صلاحية تعديل الأقسام أو إضافتها مخصصة لمدير النظام (Admin) فقط.
        </div>
      )}

      {/* Departments Table */}
      <div className="glass-panel" style={{ padding: "1.5rem 0" }}>
        <div className="table-container">
          <table className="custom-table" style={{ width: "100%", direction: "rtl", textAlign: "right" }}>
            <thead>
              <tr>
                <th style={{ width: "100px", textAlign: "right" }}>الرقم</th>
                <th style={{ textAlign: "right" }}>اسم القسم</th>
                {isAdmin && <th style={{ width: "200px", textAlign: "right" }}>الخيارات</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td>#{dept.id}</td>
                  <td>
                    {editId === dept.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ maxWidth: "250px", textAlign: "right" }}
                      />
                    ) : (
                      dept.name
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      {editId === dept.id ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdate(dept.id)}
                            disabled={loading}
                          >
                            حفظ
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditId(null)}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStartEdit(dept)}
                          >
                            تعديل
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(dept.id)}
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {departments.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 3 : 2} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    لا توجد أقسام مسجلة حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
