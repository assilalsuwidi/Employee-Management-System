// axiosClient.js
// عميل Axios مركزي: يُرفق تلقائيًا رمز JWT مع كل طلب، ويتعامل مع
// انتهاء صلاحيته (401) بإعادة توجيه المستخدم لتسجيل الدخول من جديد.
// هذا يستبدل نمط "credentials: 'include'" المعتمد على session cookie
// في PHP القديم، لأن الباك إند الجديد stateless عبر Bearer tokens.

import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
