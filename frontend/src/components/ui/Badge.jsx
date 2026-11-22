const tones = {
  neutral: "bg-steel-100 text-steel-700",
  sale: "bg-brand-100 text-brand-700",
  ok: "bg-[#E3F1E8] text-ok",
  danger: "bg-[#F6E1DE] text-danger",
};

export default function Badge({ tone = "neutral", children }) {
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
