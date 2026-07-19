import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getEmployees, generatePayroll, getPayrollHistory } from "../services/apiService";

export default function Payroll() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [bonus, setBonus] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [deduction, setDeduction] = useState(0);

  const [payrollResult, setPayrollResult] = useState(null);
  const [history, setHistory] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const months = [
    { value: 1, label: "يناير" }, { value: 2, label: "فبراير" },
    { value: 3, label: "مارس" }, { value: 4, label: "أبريل" },
    { value: 5, label: "مايو" }, { value: 6, label: "يونيو" },
    { value: 7, label: "يوليو" }, { value: 8, label: "أغسطس" },
    { value: 9, label: "سبتمبر" }, { value: 10, label: "أكتوبر" },
    { value: 11, label: "نوفمبر" }, { value: 12, label: "ديسمبر" },
  ];

  useEffect(() => {
    if (isAdminOrHr) {
      getEmployees()
        .then(setEmployees)
        .catch(console.error);
    }
  }, [isAdminOrHr]);

  const fetchHistory = async (empId) => {
    if (!empId) return;
    setLoadingHistory(true);
    try {
      const data = await getPayrollHistory(empId);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEmpChange = (e) => {
    const val = e.target.value;
    setSelectedEmp(val);
    setPayrollResult(null);
    setHistory([]);
    if (val) {
      fetchHistory(val);
    }
  };

  const handleCalculate = async (isPreview) => {
    if (!selectedEmp) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await generatePayroll(
        selectedEmp,
        Number.parseInt(month),
        Number.parseInt(year),
        Number.parseFloat(bonus || 0),
        Number.parseFloat(overtimeHours || 0),
        Number.parseFloat(deduction || 0),
        isPreview
      );

      setPayrollResult(res.data);
      if (!isPreview) {
        setSuccess("تم توليد قسيمة الراتب بنجاح وحفظها في الأرشيف. ✅");
        fetchHistory(selectedEmp);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "حدث خطأ أثناء احتساب الراتب. تأكد من تحديد هيكل الراتب للموظف أولاً.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrHr) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--danger)", fontSize: "1.5rem" }}>🚫 وصول غير مصرح به</h2>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          هذا القسم مخصص للمسؤولين وموظفي الموارد البشرية فقط.
        </p>
      </div>
    );
  }

  const handlePrint = (h) => {
    const empName = employees.find(e => e.id === Number(selectedEmp))?.first_name || "موظف";
    const lastName = employees.find(e => e.id === Number(selectedEmp))?.last_name || "";
    const fullName = `${empName} ${lastName}`;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>قسيمة راتب - ${fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
            body { font-family: 'Cairo', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #0f766e; }
            .details { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 1.1em; }
            .details th, .details td { padding: 15px; border: 1px solid #ddd; text-align: right; }
            .details th { background-color: #f8fafc; width: 40%; color: #475569; }
            .footer { text-align: center; margin-top: 50px; font-size: 0.9em; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            .total { font-size: 1.5em; font-weight: bold; color: #8b5cf6; }
            .success { color: #10b981; }
            .danger { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>قسيمة راتب موظف (Pay Stub)</h1>
            <p>لشهر: ${h.month} / ${h.year}</p>
          </div>
          <table class="details">
            <tr><th>اسم الموظف</th><td><strong>${fullName}</strong></td></tr>
            <tr><th>تاريخ الإصدار</th><td>${h.generated_at.split("T")[0]}</td></tr>
            <tr><th>الراتب الأساسي</th><td>${(h.basic_salary || 0).toLocaleString()} ر.س</td></tr>
            <tr><th>المكافآت الإضافية</th><td class="success">+ ${(h.bonus || 0).toLocaleString()} ر.س</td></tr>
            <tr><th>بدل العمل الإضافي</th><td class="success">+ ${(h.overtime || 0).toLocaleString()} ر.س</td></tr>
            <tr><th>خصم الغيابات والتأخير</th><td class="danger">- ${(h.late_fine || 0).toLocaleString()} ر.س</td></tr>
            <tr><th>خصومات أخرى</th><td class="danger">- ${(h.deduction || 0).toLocaleString()} ر.س</td></tr>
            <tr><th>صافي الراتب المستحق</th><td class="total">${h.net_salary.toLocaleString()} ر.س</td></tr>
          </table>
          <div class="footer">
            هذه وثيقة رسمية معتمدة من نظام إدارة الموارد البشرية.
            <br />
            تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const renderHistoryTableBody = () => {
    if (loadingHistory) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>جاري تحميل الأرشيف...</td>
        </tr>
      );
    }
    if (history.length === 0) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>لا توجد رواتب مؤرشفة لهذا الموظف سابقاً.</td>
        </tr>
      );
    }
    return history.map((h) => (
      <tr key={`${h.year}-${h.month}`}>
        <td>{months.find(m => m.value === h.month)?.label || h.month}</td>
        <td>{h.year}</td>
        <td style={{ color: "var(--accent-teal)", fontWeight: "700" }}>{h.net_salary.toLocaleString()} ر.س</td>
        <td>{h.generated_at.split("T")[0]} {h.generated_at.split("T")[1].slice(0, 5)}</td>
        <td>
          <button 
            className="btn btn-sm" 
            onClick={() => handlePrint(h)} 
            style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--accent-purple)", border: "1px solid var(--accent-purple)" }}
          >
            🖨️ طباعة القسيمة
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "1.5rem" }}>
        {/* نموذج الإدخال */}
        <div className="glass-panel" style={{ padding: "2rem", direction: "rtl" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem" }}>💸 توليد واحتساب الراتب</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="employee-select">الموظف</label>
              <select id="employee-select" className="form-control" value={selectedEmp} onChange={handleEmpChange} required>
                <option value="">اختر موظفاً...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <div>
                <label className="form-label" htmlFor="month-select">الشهر</label>
                <select id="month-select" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)}>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="year-input">السنة</label>
                <input id="year-input" type="number" className="form-control" value={year} onChange={(e) => setYear(e.target.value)} min="2020" max="2030" />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="bonus-input">مكافآت (ر.س)</label>
              <input id="bonus-input" type="number" className="form-control" value={bonus} onChange={(e) => setBonus(e.target.value)} min="0" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="overtime-input">ساعات إضافي</label>
              <input id="overtime-input" type="number" className="form-control" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} min="0" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deduction-input">خصومات أخرى (ر.س)</label>
              <input id="deduction-input" type="number" className="form-control" value={deduction} onChange={(e) => setDeduction(e.target.value)} min="0" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCalculate(true)}
              disabled={loading || !selectedEmp}
              style={{ flex: 1, justifyContent: "center" }}
            >
              🔍 معاينة الراتب
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleCalculate(false)}
              disabled={loading || !selectedEmp}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {loading ? "جاري التوليد..." : "💸 اعتماد وتوليد الفاتورة"}
            </button>
          </div>
        </div>

        {/* عرض تفاصيل المعاينة المباشرة */}
        <div className="glass-panel" style={{ padding: "2rem", direction: "rtl", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-teal)" }}>📄 قسيمة الراتب الحالية</h2>

          {payrollResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--glass-border)", paddingBottom: "0.5rem" }}>
                <span>الموظف:</span> <strong style={{ color: "#fff" }}>{payrollResult.employee_name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>الراتب الأساسي:</span> <span>{payrollResult.base_salary.toLocaleString()} ر.س</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>المكافآت المضافة:</span> <span style={{ color: "var(--success)" }}>+ {payrollResult.bonus.toLocaleString()} ر.س</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>العمل الإضافي:</span> <span style={{ color: "var(--success)" }}>+ {payrollResult.overtime.toLocaleString()} ر.س</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>خصم الغيابات/التأخير:</span> <span style={{ color: "var(--danger)" }}>- {payrollResult.late_fine.toLocaleString()} ر.س</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>خصومات أخرى:</span> <span style={{ color: "var(--danger)" }}>- {payrollResult.deduction.toLocaleString()} ر.س</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <span style={{ fontWeight: "700" }}>صافي الراتب المستحق:</span>
                <strong style={{ fontSize: "1.4rem", color: "var(--accent-purple)" }}>{payrollResult.net_salary.toLocaleString()} ر.س</strong>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              اختر موظفاً ثم اضغط "معاينة الراتب" لعرض الحسابات التفصيلية هنا.
            </div>
          )}
        </div>
      </div>

      {/* سجل أرشيف الرواتب التاريخي للموظف */}
      {selectedEmp && (
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "1rem", direction: "rtl", textAlign: "right" }}>📋 أرشيف الرواتب للموظف المختار</h2>
          <div className="table-container">
            <table className="custom-table" style={{ width: "100%", direction: "rtl", textAlign: "right" }}>
              <thead>
                <tr>
                  <th>الشهر</th>
                  <th>السنة</th>
                  <th>صافي الراتب المستحق</th>
                  <th>تاريخ التوليد</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {renderHistoryTableBody()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
