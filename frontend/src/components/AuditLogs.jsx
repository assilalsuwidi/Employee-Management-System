import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuditLogs } from "../services/apiService";

export default function AuditLogs() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) return;
    setError("");
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError("فشل تحميل سجلات التدقيق الأمني.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--danger)" }}>
        <h2>🚫 وصول غير مصرح به</h2>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          هذا القسم مخصص لمدير النظام (Admin) فقط لأغراض الحماية والتدقيق الأمني (S-SDLC Security Auditing).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="controls-bar glass-panel" style={{ padding: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>سجل التدقيق الأمني (Audit Log)</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            بند OWASP A09: مراقبة وتدقيق كافة العمليات الحساسة في النظام لحمايته من التهديدات الداخلية.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
          {loading ? "جاري التحديث..." : "تحديث السجلات 🔄"}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem 0" }}>
        <div className="table-container">
          <table className="custom-table" style={{ width: "100%", direction: "rtl", textAlign: "right" }}>
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "right" }}>رقم</th>
                <th style={{ width: "100px", textAlign: "right" }}>المستخدم</th>
                <th style={{ width: "100px", textAlign: "right" }}>الصلاحية</th>
                <th style={{ textAlign: "right" }}>العملية</th>
                <th style={{ width: "120px", textAlign: "right" }}>الهدف</th>
                <th style={{ width: "130px", textAlign: "right" }}>عنوان IP</th>
                <th style={{ width: "180px", textAlign: "right" }}>الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>#{log.id}</td>
                  <td>ID: {log.actor_user_id || "غير معروف"}</td>
                  <td>
                    <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>
                      {log.actor_role || "system"}
                    </span>
                  </td>
                  <td style={{ fontFamily: "monospace", color: "var(--accent-teal)" }}>
                    {log.action}
                  </td>
                  <td>
                    {log.target_type && `${log.target_type} (${log.target_id})`}
                  </td>
                  <td>{log.ip_address || "127.0.0.1"}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                    لا توجد سجلات تدقيق متوفرة حالياً.
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
