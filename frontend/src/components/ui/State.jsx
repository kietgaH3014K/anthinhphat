export function Loading({ label = "Đang tải…" }) {
  return <p role="status" className="py-16 text-center text-steel-500">{label}</p>;
}

export function ErrorBox({ message = "Không tải được dữ liệu. Hãy thử tải lại trang." }) {
  return <p role="alert" className="border-l-4 border-danger bg-[#F6E1DE] p-4 text-sm text-danger">{message}</p>;
}

export function Empty({ title, children }) {
  return (
    <div className="border border-dashed border-steel-300 bg-white p-10 text-center">
      <p className="font-bold">{title}</p>
      {children && <div className="mt-3 text-sm text-steel-500">{children}</div>}
    </div>
  );
}
