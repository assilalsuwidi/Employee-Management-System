import { AuthProvider, useAuth } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Payroll from "./components/Payroll";
import Tasks from "./components/Tasks";
import AuditLogs from "./components/AuditLogs";
import Leaves from "./components/Leaves";


function AppContent() {
  const { isAuthenticated, restoring } = useAuth();

  if (restoring) return null;

  if (!isAuthenticated) return <Login />;

  return (
    <div className="layout">
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/leaves" element={<Leaves />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
