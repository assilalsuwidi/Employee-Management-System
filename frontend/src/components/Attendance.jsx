import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { checkInAttendance, getEmployees } from "../services/apiService";

export default function Attendance() {
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

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Send employee_id if Admin/HR selected someone, else backend will default to current JWT user
      const empId = isAdminOrHr && selectedEmp ? selectedEmp : null;
      await checkInAttendance(empId);
      setSuccess("تم تسجيل الحضور اليومي بنجاح.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "فشل تسجيل الحضور (قد تكون مسجلاً بالفعل اليوم)."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "600px", margin: "0 auto" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-danger" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.2)", color: "#a7f3d0" }}>{success}</div>}

      <div className="glass-panel" style={{ padding: "2.5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: "1.5rem", fontWeight: "700" }}>تسجيل الحضور اليومي</h2>
        
        <form onSubmit={handleCheckIn} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {isAdminOrHr && (
            <div className="form-group" style={{ textAlign: "right" }}>
              <label className="form-label">اختر موظفاً (تسجيل بالنيابة عنه - اختياري)</label>
              <select
                className="form-control"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                <option value="">تسجيل حضور لنفسي</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} (ID: {emp.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
            بالنقر على الزر أدناه، سيتم تسجيل حضورك اليومي في قاعدة البيانات مع تسجيل التاريخ ووقت الدخول والـ IP آلياً لأغراض التدقيق والمتابعة الأمنية.
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", height: "50px", fontSize: "1rem", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "جاري تسجيل الحضور..." : "تسجيل حضور اليوم 🕒"}
          </button>
        </form>
      </div>
    </div>
  );
}
