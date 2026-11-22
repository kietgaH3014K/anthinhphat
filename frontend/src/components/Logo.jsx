/** Logo: chữ A là mặt đứng của một công trình (hai cột nghiêng + dầm ngang) đặt trên khối móng. */
export function LogoMark({ size = 40, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Biểu tượng AN THỊNH PHÁT" className={className}>
      <rect x="1" y="1" width="46" height="46" rx="2" fill="#25282C" />
      <path d="M10 38 L22 9 H26 L38 38 H32 L24 18 L16 38 Z" fill="#E99A24" />
      <rect x="15" y="27" width="18" height="4" fill="#D5A64A" />
      <rect x="8" y="40" width="32" height="2.5" fill="#D5A64A" />
    </svg>
  );
}

export default function Logo({ inverted = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark />
      <span className="leading-none">
        <span className={`block text-xl font-extrabold tracking-tight ${inverted ? "text-white" : "text-steel-900"}`}>
          AN THỊNH PHÁT
        </span>
        <span className={`mt-1 block text-xs font-medium ${inverted ? "text-steel-300" : "text-steel-500"}`}>
          Vật liệu xây dựng TP.HCM
        </span>
      </span>
    </span>
  );
}
