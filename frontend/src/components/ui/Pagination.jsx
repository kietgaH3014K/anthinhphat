export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const btn = "min-w-10 border border-steel-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-steel-100 disabled:opacity-40";
  return (
    <nav aria-label="Phân trang" className="mt-10 flex flex-wrap justify-center gap-2">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</button>
      {pages.map((n) => (
        <button
          key={n} onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined}
          className={`${btn} ${n === page ? "!border-steel-900 !bg-steel-900 text-white hover:!bg-steel-900" : ""}`}
        >{n}</button>
      ))}
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sau</button>
    </nav>
  );
}
