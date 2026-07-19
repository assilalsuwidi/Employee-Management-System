// authService.js -- نسخة مُحدَّثة تتحدث مع Flask (JWT) بدل PHP (session)
import axiosClient, { refreshAccessToken } from "./axiosClient";
import * as tokenStore from "./tokenStore";

// الإصلاح (تخزين التوكن): لم يعد يوجد أي تخزين لـ access_token أو
// refresh_token في sessionStorage. access_token يعيش فقط في ذاكرة
// tokenStore (يُفقد عند إعادة تحميل الصفحة)، وrefresh_token لم تعد
// الواجهة تراه إطلاقًا -- الباك إند يضعه في كوكي httpOnly مباشرة.
// "role" وحده يُحفَظ في sessionStorage لأنه معلومة عرض واجهة فقط (تحديد
// أي قوائم تظهر)، وليس سرًا حساسًا: كل تفويض فعلي يُفرَض من جديد على
// السيرفر بقراءة الدور من داخل الـ JWT الموقَّع، بصرف النظر عمّا يقوله
// الفرونت إند عن نفسه.

export async function login(username, password) {
  const { data } = await axiosClient.post("/auth/login", { username, password });

  tokenStore.setAccessToken(data.access_token);
  sessionStorage.setItem("role", data.role);

  return data;
}

export async function logout() {
  // الإصلاح: كانت هذه الدالة تمسح التخزين المحلي فقط، دون إخطار الباك
  // إند إطلاقًا -- فكان مسار /auth/logout وآلية TokenBlocklist بأكملها
  // ميتة الاستخدام من زاوية الواجهة. الآن يُستدعى المسار فعليًا؛
  // refresh_token يصل تلقائيًا عبر الكوكي (withCredentials) بلا حاجة
  // لتمريره يدويًا من الواجهة.
  try {
    await axiosClient.post("/auth/logout");
  } catch {
    // حتى لو فشل الطلب (مثلاً لا يوجد اتصال، أو الرمز منتهٍ أصلاً)،
    // يجب أن يُنظَّف التخزين المحلي دائمًا حتى لا يبقى المستخدم "مسجّل
    // دخوله" في واجهة المتصفح بينما فشل الإبلاغ عن ذلك للسيرفر.
  } finally {
    tokenStore.clearAccessToken();
    sessionStorage.removeItem("role");
  }
}

/**
 * استعادة الجلسة صامتًا عند تحميل الصفحة (أو إعادة تحميلها). لا يوجد
 * access_token في الذاكرة عند هذه اللحظة لأنه لم يُخزَّن على القرص
 * أبدًا، لكن كوكي الـ refresh (httpOnly) قد يكون ما زال صالحًا؛ لو نجح
 * الطلب نحصل على access_token جديد بلا حاجة لإعادة إدخال كلمة المرور.
 */
export async function restoreSession() {
  try {
    const data = await refreshAccessToken();
    sessionStorage.setItem("role", data.role);
    return data;
  } catch {
    tokenStore.clearAccessToken();
    sessionStorage.removeItem("role");
    return null;
  }
}

export function getRole() {
  return sessionStorage.getItem("role");
}

export function isAuthenticated() {
  return Boolean(tokenStore.getAccessToken());
}
