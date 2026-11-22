import { useEffect } from "react";

const BASE = "AN THỊNH PHÁT";
const DEFAULT_DESC = "AN THỊNH PHÁT cung cấp vật liệu xây dựng chất lượng, giá cạnh tranh tại TP.HCM. Bán lẻ, bán sỉ và báo giá công trình.";

/** Đặt title, meta description và (tùy chọn) dữ liệu có cấu trúc JSON-LD cho từng trang. */
export default function usePageMeta({ title, description, jsonLd } = {}) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    document.title = title ? `${title} | ${BASE}` : `${BASE} – Vật liệu xây dựng TP.HCM`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = (description || DEFAULT_DESC).slice(0, 300);
    let script = document.getElementById("ld-json");
    if (ld) {
      if (!script) { script = document.createElement("script"); script.id = "ld-json"; script.type = "application/ld+json"; document.head.appendChild(script); }
      script.textContent = ld;
    }
    return () => { document.getElementById("ld-json")?.remove(); };
  }, [title, description, ld]);
}
