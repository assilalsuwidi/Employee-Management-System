// authService.js -- نسخة مُحدَّثة تتحدث مع Flask (JWT) بدل PHP (session)
import axiosClient from "./axiosClient";

export async function login(username, password) {
  const { data } = await axiosClient.post("/auth/login", { username, password });

  // ملاحظة أمنية: sessionStorage أفضل من localStorage لأنه يُمسح عند
  // إغلاق التبويب (يقلّل نافذة خطر XSS)، لكنه ليس الأكثر أمانًا بشكل
  // مطلق. إن أردت أعلى حماية لاحقًا: ضع access token في الذاكرة فقط
  // (React state) واستخدم refresh token عبر httpOnly cookie.
  sessionStorage.setItem("access_token", data.access_token);
  sessionStorage.setItem("role", data.role);

  return data;
}

export function logout() {
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("role");
}

export function getRole() {
  return sessionStorage.getItem("role");
}

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem("access_token"));
}
