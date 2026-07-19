// axiosClient.js
// عميل Axios مركزي: يُرفق تلقائيًا رمز JWT مع كل طلب. عند انتهاء صلاحية
// الـ access token (401)، يحاول تجديده مرة واحدة عبر /auth/refresh قبل
// إعادة توجيه المستخدم لتسجيل دخول جديد -- بدل تسجيل خروج فوري مزعج كل
// 30 دقيقة (سلوك النسخة السابقة قبل تفعيل /auth/refresh في الباك إند).
//
// الإصلاح (تخزين التوكن): access_token لم يعد يُقرأ من sessionStorage --
// يبقى فقط في ذاكرة هذا الموديول (tokenStore) ويُفقد عند إغلاق التبويب
// أو إعادة تحميل الصفحة، فيُستعاد صامتًا عبر /auth/refresh الذي يعتمد
// على كوكي refresh token الـ httpOnly (لا يقدر أي JavaScript قراءته).
// withCredentials:true ضروري حتى يرسل المتصفح هذا الكوكي مع كل طلب.

import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosClient = axios.create({ baseURL: BASE_URL, withCredentials: true });

function readCookie(name) {
  const match = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : null;
}

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function goToLogin() {
  clearAccessToken();
  window.location.href = "/login";
}

// طابور الطلبات التي فشلت بـ 401 أثناء تجديد الرمز يكون قيد التنفيذ،
// لتفادي إرسال عدة طلبات /auth/refresh متوازية لنفس المستخدم.
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    // عميل axios منفصل بلا interceptor الـ Authorization الخاص بالـ
    // access token -- هذا الطلب يعتمد فقط على كوكي refresh token
    // (يُرسَل تلقائيًا عبر withCredentials) + رأس CSRF المطلوب من
    // Flask-JWT-Extended لحماية الكوكي من هجمات CSRF (نمط double-submit:
    // القيمة تُقرأ من كوكي غير httpOnly منفصل وتُرسَل كرأس صريح).
    refreshPromise = axios
      .post(
        `${BASE_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "X-CSRF-TOKEN": readCookie("csrf_refresh_token") },
        }
      )
      .then(({ data }) => {
        setAccessToken(data.access_token);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        const { access_token } = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access_token}`;
        return axiosClient(original);
      } catch {
        goToLogin();
        throw error;
      }
    }

    if (error.response?.status === 401 && !isAuthRoute) {
      goToLogin();
    }
    throw error;
  }
);

export { readCookie };
export default axiosClient;
