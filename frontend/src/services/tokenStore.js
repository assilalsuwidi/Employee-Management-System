// tokenStore.js
// الإصلاح (تخزين التوكن): access_token كان يُحفَظ في sessionStorage --
// أي كود JavaScript يعمل على الصفحة (بما فيه أي هجوم XSS مستقبلي) يقدر
// يقرأه. الآن يعيش فقط كمتغيّر داخل ذاكرة هذا الموديول، يُفقد تلقائيًا
// عند إغلاق التبويب أو إعادة تحميل الصفحة، ويُستعاد صامتًا عبر
// /auth/refresh (الذي يعتمد بدوره على كوكي httpOnly منفصل، غير مرئي
// لأي JavaScript إطلاقًا). لا يوجد أي `localStorage`/`sessionStorage`
// هنا عمدًا.

let accessToken = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}
