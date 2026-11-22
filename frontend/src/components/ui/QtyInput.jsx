export default function QtyInput({ value, onChange, max, label = "Số lượng" }) {
  const set = (v) => onChange(Math.max(1, Math.min(Number(v) || 1, max ?? Infinity)));
  return (
    <div className="inline-flex border border-steel-300 bg-white" role="group" aria-label={label}>
      <button type="button" aria-label="Giảm" className="px-3 font-bold hover:bg-steel-100" onClick={() => set(value - 1)}>−</button>
      <input
        type="number" min="1" max={max} value={value} aria-label={label}
        onChange={(e) => set(e.target.value)}
        className="w-16 border-x border-steel-300 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" aria-label="Tăng" className="px-3 font-bold hover:bg-steel-100" onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
