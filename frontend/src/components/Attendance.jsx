import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { checkInAttendance, getAttendanceReports, getEmployees } from "../services/apiService";

export default function Attendance() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [reports, setReports] = useState([]);
  const [filterEmp, setFilterEmp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getAttendanceReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isAdminOrHr) {
      getEmployees()
        .then(setEmployees)
        .catch(console.error);
    }
    fetchReports();
  }, [isAdminOrHr]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const empId = isAdminOrHr && selectedEmp ? selectedEmp : null;
      await checkInAttendance(empId);
      setSuccess("تم تسجيل الحضور اليومي بنجاح. ✅");
      fetchReports();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل تسجيل الحضور (قد تكون مسجلاً بالفعل اليوم).");
    } finally {
      setLoading(false);
    }
  };

  // تصفية السجلات حسب الموظف المختار
  const filteredReports = filterEmp
    ? reports.filter((r) => String(r.employee_id) === String(filterEmp))
    : reports;

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.first_name} ${emp.last_name}` : `موظف #${id}`;
  };

  const renderTableBody = () => {
    if (loadingReports) {
      return (
        <tr>
          <td colSpan={isAdminOrHr ? 7 : 6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            جاري تحميل السجلات...
          </td>
        </tr>
      );
    }
    if (filteredReports.length === 0) {
      return (
        <tr>
          <td colSpan={isAdminOrHr ? 7 : 6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
            لا توجد سجلات حضور بعد.
          </td>
        </tr>
      );
    }
    return filteredReports.map((record, idx) => (
      <tr key={record.id}>
        <td>{idx + 1}</td>
        {isAdminOrHr && <td>{getEmployeeName(record.employee_id)}</td>}
        <td>{record.date}</td>
        <td>{record.check_in ? record.check_in.slice(0, 5) : "-"}</td>
        <td>
          {record.is_late ? (
            <span className="badge badge-danger" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", padding: "2px 8px", borderRadius: "6px" }}>متأخر</span>
          ) : (
            <span className="badge badge-teal" style={{ padding: "2px 8px", borderRadius: "6px" }}>في الوقت</span>
          )}
        </td>
        <td>{record.late_fine > 0 ? `${record.late_fine} ر.س` : "-"}</td>
        <td>
          {record.is_weekend || record.is_holiday ? (
            <span style={{ color: "var(--accent-purple)" }}>✓</span>
          ) : "-"}
        </td>
      </tr>
    ));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* نموذج تسجيل الحضور */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem", textAlign: "right" }}>
          🕒 تسجيل الحضور اليومي
        </h2>
        <form onSubmit={handleCheckIn} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isAdminOrHr && (
            <div className="form-group" style={{ textAlign: "right" }}>
              <label className="form-label" htmlFor="selected-emp">اختر موظفاً (تسجيل بالنيابة عنه - اختياري)</label>
              <select
                id="selected-emp"
                className="form-control"
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                <option value="">تسجيل حضور لنفسي</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5", textAlign: "right" }}>
            سيتم تسجيل حضورك اليومي في قاعدة البيانات مع التاريخ ووقت الدخول آلياً.
          </p>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: "48px", fontSize: "1rem", justifyContent: "center" }}
            disabled={loading}
          >
            {loading ? "جاري تسجيل الحضور..." : "تسجيل الحضور الآن 🕒"}
          </button>
        </form>
      </div>

      {/* جدول سجلات الحضور */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>📋 سجلات الحضور</h2>
          {isAdminOrHr && employees.length > 0 && (
            <select
              className="form-control"
              value={filterEmp}
              onChange={(e) => setFilterEmp(e.target.value)}
              style={{ maxWidth: "220px" }}
            >
              <option value="">جميع الموظفين</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="table-container">
          <table className="custom-table" style={{ width: "100%", direction: "rtl", textAlign: "right" }}>
            <thead>
              <tr>
                <th>#</th>
                {isAdminOrHr && <th>الموظف</th>}
                <th>التاريخ</th>
                <th>وقت الحضور</th>
                <th>حالة التأخير</th>
                <th>غرامة التأخير</th>
                <th>عطلة</th>
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}
