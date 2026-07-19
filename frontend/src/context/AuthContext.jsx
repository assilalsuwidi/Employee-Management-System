// AuthContext.jsx -- نسخة مُحدَّثة تعتمد على JWT بدل تخزين كائن
// المستخدم كاملاً في localStorage كما في النسخة القديمة.
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // الإصلاح (تخزين التوكن): access_token لم يعد يُخزَّن على القرص، فهو
  // غير موجود في الذاكرة عند أول تحميل للصفحة حتى لو كان المستخدم فعليًا
  // ما زال مسجّل دخوله. `restoring` يمنع وميض شاشة تسجيل الدخول قبل أن
  // تُتاح فرصة استعادة الجلسة صامتًا من كوكي الـ refresh الـ httpOnly.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    authService.restoreSession().then((data) => {
      if (data) {
        setRole(data.role);
        setIsAuthenticated(true);
      }
      setRestoring(false);
    });
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setRole(data.role);
    setIsAuthenticated(true);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setRole(null);
    setIsAuthenticated(false);
  };

  const contextValue = useMemo(
    () => ({ role, isAuthenticated, restoring, login, logout }),
    [role, isAuthenticated, restoring]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
