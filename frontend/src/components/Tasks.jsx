import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, getGroups, getEmployees, createTask, assignTask, updateTaskProgress } from "../services/apiService";

export default function Tasks() {
  const { role } = useAuth();
  const isAdminOrHr = role === "admin" || role === "hr";

  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState("");

  // Progress update state (for employees)
  const [progressVal, setProgressVal] = useState(0);
  const [progressNote, setProgressNote] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const tList = await getTasks();
      setTasks(tList);

      if (isAdminOrHr) {
        const gList = await getGroups();
        const eList = await getEmployees();
        setGroups(gList);
        setEmployees(eList);
      }
    } catch (err) {
      console.error(err);
      setError("فشل تحميل المهام والبيانات المساندة.");
    }
  }, [isAdminOrHr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedGroupId) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await createTask(selectedGroupId, title.trim(), note.trim(), deadline || null);
      setSuccess("تم إنشاء المهمة بنجاح. ✅");
      setShowCreateModal(false);
      setTitle("");
      setNote("");
      setDeadline("");
      setSelectedGroupId("");
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل إنشاء المهمة.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!activeTask || !selectedEmpId) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await assignTask(activeTask.id, selectedEmpId);
      setSuccess("تم إسناد المهمة للموظف بنجاح. 👤");
      setShowAssignModal(false);
      setSelectedEmpId("");
      setActiveTask(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل إسناد المهمة (قد يكون الموظف غير مسجل بالمجموعة أو مسنداً للمهمة بالفعل).");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (e, taskId) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // For employees, backend uses their token info, but requires employee_id to be sent or defaults. 
      // We pass null for employee_id if regular employee, backend handles it.
      await updateTaskProgress(taskId, null, progressVal, progressNote);
      setSuccess("تم تحديث نسبة الإنجاز بنجاح. 📈");
      setUpdatingTaskId(null);
      setProgressNote("");
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "فشل تحديث التقدم.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* شريط التحكم */}
      <div className="controls-bar glass-panel" style={{ padding: "1.5rem", direction: "rtl" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>📋 إدارة المهام وتوزيع المشاريع</h2>
        {isAdminOrHr && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + إنشاء مهمة جديدة
          </button>
        )}
      </div>

      {/* عرض قائمة المهام */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {tasks.map((task) => (
          <div key={task.id} className="employee-card glass-panel" style={{ direction: "rtl", gap: "0.75rem", padding: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>مهمة #{task.id}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>📂 مجموعة #{task.group_id || "-"}</span>
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginTop: "0.5rem" }}>{task.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.4rem", minHeight: "40px" }}>
                {task.note || "لا توجد ملاحظات تفصيلية للمهمة"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-muted)", borderTop: "1px solid var(--glass-border)", paddingTop: "0.5rem" }}>
              <div>📅 الموعد النهائي: {task.deadline ? task.deadline.split("T")[0] : "مفتوح"}</div>
              <div>🕒 تاريخ التكليف: {task.assigned_at ? task.assigned_at.split("T")[0] : "-"}</div>
            </div>

            {/* الإدارة: زر الإسناد لموظف */}
            {isAdminOrHr && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setActiveTask(task); setShowAssignModal(true); }}
                style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
              >
                👤 إسناد لموظف بالقروب
              </button>
            )}

            {/* الموظف العادي: لوحة تحديث التقدم */}
            {!isAdminOrHr && (
              <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
                {updatingTaskId === task.id ? (
                  <form onSubmit={(e) => handleUpdateProgress(e, task.id)} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>نسبة الإنجاز:</span> <strong>{progressVal}%</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        className="form-control"
                        value={progressVal}
                        onChange={(e) => setProgressVal(Number.parseInt(e.target.value))}
                        style={{ padding: 0 }}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="أدخل ملاحظة قصيرة..."
                        className="form-control"
                        value={progressNote}
                        onChange={(e) => setProgressNote(e.target.value)}
                        style={{ height: "35px", fontSize: "0.8rem" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>حفظ</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setUpdatingTaskId(null)} style={{ flex: 1, justifyContent: "center" }}>إلغاء</button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => { setUpdatingTaskId(task.id); setProgressVal(0); setProgressNote(""); }}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    📈 تحديث الإنجاز
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="glass-panel" style={{ gridColumn: "1 / -1", padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
            لا توجد مهام مسندة أو نشطة حالياً.
          </div>
        )}
      </div>

      {/* نافذة إنشاء مهمة جديدة */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>إنشاء مهمة عمل جديدة</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label" htmlFor="task_group_id">مجموعة العمل المسؤولة</label>
                <select id="task_group_id" className="form-control" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required>
                  <option value="">اختر المجموعة...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task_title">عنوان المهمة</label>
                <input
                  id="task_title"
                  type="text"
                  className="form-control"
                  placeholder="مثال: مراجعة الكود البرمجي"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task_note">الوصف / التفاصيل</label>
                <textarea
                  id="task_note"
                  className="form-control"
                  placeholder="اكتب تفاصيل أو خطوات المهمة..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task_deadline">الموعد النهائي لتسليم العمل</label>
                <input id="task_deadline" type="date" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  {loading ? "جاري الحفظ..." : "إنشاء المهمة"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ flex: 1, justifyContent: "center" }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة إسناد مهمة لموظف */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ direction: "rtl" }}>
            <div className="modal-header">
              <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>توزيع المهمة على موظف</h2>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setActiveTask(null); }}>&times;</button>
            </div>

            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>المهمة المختارة:</span>
                <h4 style={{ fontSize: "1.1rem", color: "var(--accent-teal)", marginTop: "0.25rem" }}>{activeTask?.title}</h4>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="assign_emp_id">الموظف المكلف بالعمل</label>
                <select id="assign_emp_id" className="form-control" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} required>
                  <option value="">اختر الموظف...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
                  إسناد المهمة الآن
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAssignModal(false); setActiveTask(null); }} style={{ flex: 1, justifyContent: "center" }}>
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
