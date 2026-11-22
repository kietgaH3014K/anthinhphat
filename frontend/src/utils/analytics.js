/** Google Analytics 4: chỉ bật khi có VITE_GA_ID. */
export function initAnalytics() {
  const id = import.meta.env.VITE_GA_ID;
  if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id);
}
