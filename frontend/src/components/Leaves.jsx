import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getLeaves, requestLeave, updateLeaveStatus } from "../services/apiService";

export default function Leaves() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "annual",
    reason: "",
  });

  const fetchLeaves = async () => {
    try {
      const data = await getLeaves();
      setLeaves(data);
    } catch (err) {
      console.error(err);
      setError("فشل تحميل بيانات الإجازات.");
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await requestLeave(form);
      setSuccess("تم تقديم طلب الإجازة بنجاح.");
      setShowModal(false);
      setForm({ start_date: "", end_date: "", leave_type: "annual", reason: "" });
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "فشل تقديم الطلب.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`هل أنت متأكد من تغيير الحالة إلى: ${status}؟`)) return;
    setError("");
    setSuccess("");
    try {
      await updateLeaveStatus(id, status);
      setSuccess("تم تحديث حالة الطلب بنجاح.");
      fetchLeaves();
    } catch (err) {
      setError("فشل تحديث حالة الطلب.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="badge badge-teal">مقبول</span>;
      case "rejected": return <span className="badge badge-danger" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>مرفوض</span>;
      default: return <span className="badge badge-warning" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>قيد الانتظار</span>;
    }
  };

  const getLeaveTypeName = (type) => {
    switch (type) {
      case "annual": return "سنوية";
      case "sick": return "مرضية";
      case "emergency": return "طارئة";
      case "unpaid": return "بدون راتب";
      default: return type;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="header">
        <h1 className="page-title">إدارة الإجازات</h1>
        {!isAdminOrHr && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            تقديم طلب إجازة
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="glass-panel table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>الموظف</th>
              <th>النوع</th>
              <th>من تاريخ</th>
              <th>إلى تاريخ</th>
              <th>السبب</th>
              <th>تاريخ التقديم</th>
              <th>الحالة</th>
              {isAdminOrHr && <th>إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{getLeaveTypeName(leave.leave_type)}</td>
                  <td>{leave.start_date}</td>
                  <td>{leave.end_date}</td>
                  <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leave.reason || "-"}</td>
                  <td>{leave.created_at ? leave.created_at.split("T")[0] : "-"}</td>
                  <td>{getStatusBadge(leave.status)}</td>
                  {isAdminOrHr && (
                    <td>
                      {leave.status === "pending" ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(leave.id, "approved")} style={{ background: "var(--accent-teal)", border: "none" }}>قبول</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(leave.id, "rejected")} style={{ border: "none" }}>رفض</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>تمت المراجعة</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdminOrHr ? "8" : "7"} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
                  لا توجد طلبات إجازة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>تقديم طلب إجازة</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">نوع الإجازة</label>
                <select className="form-control" value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} required>
                  <option value="annual">سنوية</option>
                  <option value="sick">مرضية</option>
                  <option value="emergency">طارئة</option>
                  <option value="unpaid">بدون راتب</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">من تاريخ</label>
                  <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">إلى تاريخ</label>
                  <input type="date" className="form-control" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">السبب (اختياري)</label>
                <textarea className="form-control" rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  {loading ? "جاري الإرسال..." : "إرسال الطلب"}
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
