import { useState } from "react";
import { inputClass } from "../components/FormField";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { formatVND } from "../utils/format";
import { ORDER_STATUS, PAYMENT_METHOD } from "../utils/labels";
import { manage } from "./adminApi";
import { SALES_UP, can } from "./roles";

// Phản chiếu các bước hợp lệ của backend (backend vẫn kiểm tra lại).
const NEXT = { pending: ["confirmed", "cancelled"], confirmed: ["shipping", "cancelled"], shipping: ["completed"], completed: [], cancelled: [] };
const STEP_LABEL = { confirmed: "Xác nhận đơn", shipping: "Bắt đầu giao", completed: "Hoàn thành", cancelled: "Hủy đơn" };

export default function OrdersAdminPage() {
  const { user } = useAuth();
  const canWrite = can(user, SALES_UP);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const list = useFetch(() => manage.list("orders", { page, status: status || undefined, search: query || undefined }), [page, status, query, reload]);

  const run = async (fn) => {
    setMessage("");
    try { const o = await fn(); setSelected(o); setReload((n) => n + 1); }
    catch (err) { setMessage(apiErrorMessage(err)); }
  };

  return (
    <div>
      <h1 className="text-h2">Đơn hàng</h1>
      <div className="mt-5 flex flex-wrap gap-3">
        <form className="flex" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label htmlFor="o-search" className="sr-only">Tìm đơn hàng</label>
          <input id="o-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã đơn, email, số điện thoại…" className={`${inputClass} w-64 border-r-0`} />
          <Button type="submit" variant="dark">Tìm</Button>
        </form>
        <label className="flex items-center gap-2 text-sm font-semibold">Trạng thái
          <select className={`${inputClass} !w-auto`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">Tất cả</option>{Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {message && <p role="alert" className="mt-4 border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger">{message}</p>}

      <div className="mt-5 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div>
          {list.loading ? <Loading /> : list.error ? <ErrorBox message={apiErrorMessage(list.error)} /> : list.data.results.length === 0 ? <Empty title="Không có đơn hàng" /> : (
            <div className="overflow-x-auto border border-steel-200 bg-white">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-steel-100 text-left"><tr><th className="p-3">Mã đơn</th><th className="p-3">Khách</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Tổng</th></tr></thead>
                <tbody>
                  {list.data.results.map((o) => (
                    <tr key={o.code} className={`cursor-pointer border-t border-steel-200 hover:bg-brand-50 ${selected?.code === o.code ? "bg-brand-50" : ""}`} onClick={() => setSelected(o)}>
                      <td className="p-3"><button className="font-bold underline" onClick={() => setSelected(o)}>{o.code}</button></td>
                      <td className="p-3">{o.customer_email}{o.is_wholesale && <span className="ml-2"><Badge tone="sale">Sỉ</Badge></span>}</td>
                      <td className="p-3">{ORDER_STATUS[o.status]}</td>
                      <td className="price p-3 text-right">{formatVND(o.totals.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {list.data && <Pagination page={page} totalPages={Math.max(1, Math.ceil(list.data.count / 20))} onChange={setPage} />}
        </div>

        {selected && (
          <aside className="h-fit border border-steel-200 bg-white p-5 text-sm" aria-label="Chi tiết đơn hàng">
            <h2 className="text-h3">{selected.code}</h2>
            <p className="mt-1 text-steel-500">{new Date(selected.created_at).toLocaleString("vi-VN")} · {ORDER_STATUS[selected.status]}</p>
            <p className="mt-3"><strong>{selected.shipping_address.full_name}</strong> · {selected.shipping_address.phone}</p>
            <p>{selected.shipping_address.address}, {selected.shipping_address.district}, {selected.shipping_address.city}</p>
            {selected.note && <p className="mt-1 text-steel-500">Ghi chú: {selected.note}</p>}
            <ul className="mt-4 divide-y divide-steel-200 border-y border-steel-200">
              {selected.items.map((i) => <li key={i.product_id} className="flex justify-between gap-3 py-2"><span>{i.name} × {i.qty} {i.unit}</span><span className="price">{formatVND(i.line_total)}</span></li>)}
            </ul>
            <dl className="mt-3 space-y-1">
              <div className="flex justify-between"><dt>Phí vận chuyển</dt><dd>{formatVND(selected.totals.shipping)}</dd></div>
              {Number(selected.totals.discount) > 0 && <div className="flex justify-between"><dt>Giảm giá {selected.coupon_code}</dt><dd>−{formatVND(selected.totals.discount)}</dd></div>}
              <div className="flex justify-between text-base font-bold"><dt>Tổng</dt><dd className="price">{formatVND(selected.totals.total)}</dd></div>
            </dl>
            <p className="mt-3">Thanh toán: {PAYMENT_METHOD[selected.payment_method]} · <strong>{selected.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}</strong></p>
            {canWrite && (
              <div className="mt-4 flex flex-wrap gap-2">
                {NEXT[selected.status].map((s) => (
                  <Button key={s} variant={s === "cancelled" ? "outline" : "primary"} onClick={() => {
                    if (s === "cancelled" && !window.confirm("Hủy đơn này và hoàn lại tồn kho?")) return;
                    run(() => manage.action("orders", selected.code, "set-status", { status: s }));
                  }}>{STEP_LABEL[s]}</Button>
                ))}
                {selected.payment_status !== "paid" && selected.status !== "cancelled" && (
                  <Button variant="dark" onClick={() => run(() => manage.action("orders", selected.code, "mark-paid"))}>Đã nhận tiền</Button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
