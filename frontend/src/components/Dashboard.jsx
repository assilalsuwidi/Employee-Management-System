import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Employees from "./Employees";
import Departments from "./Departments";
import Groups from "./Groups";
import Attendance from "./Attendance";
import Payroll from "./Payroll";
import AuditLogs from "./AuditLogs";
import { getEmployees, getDepartments } from "../services/apiService";

export default function Dashboard() {
  const { logout, role } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ employeesCount: 0, deptsCount: 0 });
  const isAdmin = role === "admin";
  const isAdminOrHr = role === "admin" || role === "hr";

  const fetchStats = async () => {
    try {
      const emps = await getEmployees();
      const depts = await getDepartments();
      setStats({
        employeesCount: emps.length,
        deptsCount: depts.length,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab]);

  return (
    <div className="app-container" style={{ direction: "rtl", width: "100%" }}>
      <div className="glow-orb glow-orb-1"></div>
      <div className="glow-orb glow-orb-2"></div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: "20px", height: "20px", color: "#fff" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
          </div>
          <span className="logo-text">نظام الإدارة EMS</span>
        </div>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
            >
              📊 لوحة التحكم
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === "employees" ? "active" : ""}`}
              onClick={() => setActiveTab("employees")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
            >
              👥 الموظفون
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === "departments" ? "active" : ""}`}
              onClick={() => setActiveTab("departments")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
            >
              🏢 الأقسام
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === "groups" ? "active" : ""}`}
              onClick={() => setActiveTab("groups")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
            >
              🔗 المجموعات
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === "attendance" ? "active" : ""}`}
              onClick={() => setActiveTab("attendance")}
              style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
            >
              🕒 الحضور والغياب
            </button>
          </li>
          {isAdminOrHr && (
            <li>
              <button
                className={`nav-link ${activeTab === "payroll" ? "active" : ""}`}
                onClick={() => setActiveTab("payroll")}
                style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
              >
                💸 الرواتب
              </button>
            </li>
          )}
          {isAdmin && (
            <li>
              <button
                className={`nav-link ${activeTab === "audit" ? "active" : ""}`}
                onClick={() => setActiveTab("audit")}
                style={{ background: "none", border: "none", width: "100%", textAlign: "right" }}
              >
                🛡️ سجل الأمان (Audit)
              </button>
            </li>
          )}
        </ul>

        {/* Sidebar Footer with static System Status */}
        <div className="sidebar-footer">
          <div className="glass-panel" style={{ padding: "0.75rem", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.75rem", textAlign: "right" }}>
            <h4 style={{ color: "var(--accent-teal)", marginBottom: "0.25rem" }}>حالة النظام (Live)</h4>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span>قاعدة البيانات:</span> <span style={{ color: "var(--success)" }}>متصلة ●</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
              <span>الواجهة الخلفية:</span> <span style={{ color: "var(--success)" }}>نشطة ●</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>نمط الأمان:</span> <span style={{ color: "var(--accent-purple)", fontWeight: "700" }}>S-SDLC</span>
            </div>
          </div>

          <div className="user-profile">
            <div className="avatar">{role ? role[0].toUpperCase() : "U"}</div>
            <div className="user-info">
              <span className="user-name">مستخدم النظام</span>
              <span className="user-role badge badge-purple">{role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-danger"
            style={{ width: "100%", marginTop: "1rem", justifyContent: "center" }}
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <header className="header">
          <h1 className="page-title">
            {activeTab === "overview" && "لوحة معلومات النظام"}
            {activeTab === "employees" && "إدارة الموظفين"}
            {activeTab === "departments" && "إدارة الأقسام"}
            {activeTab === "groups" && "مجموعات العمل"}
            {activeTab === "attendance" && "تسجيل الحضور اليومي"}
            {activeTab === "payroll" && "إدارة شؤون الرواتب"}
            {activeTab === "audit" && "سجل التدقيق والمتابعة الأمنية"}
          </h1>
        </header>

        {activeTab === "overview" && (
          <div className="tab-content" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Overview Banner */}
            <div className="glass-panel" style={{ padding: "2.5rem", borderRadius: "20px" }}>
              <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
                مرحباً بك في نظام إدارة الموظفين الآمن
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                هذه الواجهة تم ربطها بالكامل مع بيئة الـ Flask Backend الآمنة وقاعدة البيانات المشفرة. 
                استخدم القائمة الجانبية لإدارة الموظفين والأقسام وإسناد البيانات بشكل ديناميكي.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <span className="stat-label">إجمالي الموظفين</span>
                  <span className="stat-value">{stats.employeesCount}</span>
                </div>
                <div className="stat-icon-wrapper stat-icon-purple">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    style={{ width: "24px", height: "24px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              </div>

              <div className="stat-card glass-panel">
                <div className="stat-info">
                  <span className="stat-label">عدد الأقسام</span>
                  <span className="stat-value">{stats.deptsCount}</span>
                </div>
                <div className="stat-icon-wrapper stat-icon-teal">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    style={{ width: "24px", height: "24px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18v3H3V3Z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="tab-content">
            <Employees />
          </div>
        )}

        {activeTab === "departments" && (
          <div className="tab-content">
            <Departments />
          </div>
        )}

        {activeTab === "groups" && (
          <div className="tab-content">
            <Groups />
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="tab-content">
            <Attendance />
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="tab-content">
            <Payroll />
          </div>
        )}

        {activeTab === "audit" && (
          <div className="tab-content">
            <AuditLogs />
          </div>
        )}
      </main>
    </div>
  );
}
