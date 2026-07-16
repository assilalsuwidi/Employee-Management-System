import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getEmployees, generatePayroll } from "../services/apiService";

export default function Payroll() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminOrHr) {
      getEmployees()
        .then(setEmployees)
        .catch(console.error);
    }
  }, [isAdminOrHr]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await generatePayroll(selectedEmp);
      setSuccess("تم توليد الراتب بنجاح.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "حدث خطأ غير متوقع أثناء توليد الراتب."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrHr) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--danger)" }}>
        <h2>🚫 وصول غير مصرح به</h2>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          هذا القسم مخصص للمسؤولين وموظفي الموارد البشرية (Admin / HR) فقط لإدارة شؤون الرواتب.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "600px", margin: "0 auto" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-danger" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" }}>{success}</div>}

      <div className="glass-panel" style={{ padding: "2.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "1.5rem", fontWeight: "700", textAlign: "center" }}>توليد قسيمة الراتب (Payroll)</h2>
        
        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="form-group" style={{ textAlign: "right" }}>
            <label className="form-label">اختر الموظف لتوليد الراتب له</label>
            <select
              className="form-control"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              required
            >
              <option value="">اختر موظفاً...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} (ID: {emp.id})
                </option>
              ))}
            </select>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5", textAlign: "right" }}>
            * ملاحظة: عملية توليد الرواتب تستدعي منطق حساب ساعات العمل الإضافي، المكافآت، والخصومات. يتم تسجيل هذه العملية حالياً في سجل التدقيق الأمني للـ S-SDLC.
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", height: "50px", fontSize: "1rem", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "جاري المعالجة..." : "توليد قسيمة الراتب 💸"}
          </button>
        </form>
      </div>
    </div>
  );
}
