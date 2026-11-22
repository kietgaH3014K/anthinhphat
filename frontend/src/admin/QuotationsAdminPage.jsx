import { useEffect, useState } from "react";
import { inputClass } from "../components/FormField";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { formatVND } from "../utils/format";
import { downloadFile, manage } from "./adminApi";
import { SALES_UP, can } from "./roles";

const STATUS = { received: "Đã nhận", quoting: "Đang báo giá", sent: "Đã gửi báo giá", accepted: "Khách chấp nhận", rejected: "Khách từ chối" };
const num = (v) => (v === "" || v == null ? 0 : Number(v));

export default function QuotationsAdminPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(null);
  const list = useFetch(() => manage.list("quotations", { page, status: status || undefined }), [page, status, reload]);

  return (
    <div>
      <h1 className="text-h2">Yêu cầu báo giá</h1>
      <label className="mt-5 flex items-center gap-2 text-sm font-semibold">Trạng thái
        <select className={`${inputClass} !w-auto`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">Tất cả</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <div>
          {list.loading ? <Loading /> : list.error ? <ErrorBox message={apiErrorMessage(list.error)} /> : list.data.results.length === 0 ? <Empty title="Chưa có yêu cầu báo giá" /> : (
            <ul className="divide-y divide-steel-200 border border-steel-200 bg-white">
              {list.data.results.map((q) => (
                <li key={q.code}>
                  <button className={`w-full p-4 text-left hover:bg-brand-50 ${open === q.code ? "bg-brand-50" : ""}`} onClick={() => setOpen(q.code)}>
                    <span className="flex justify-between gap-2"><strong>{q.code}</strong><Badge tone={q.status === "sent" ? "ok" : q.status === "received" ? "sale" : "neutral"}>{STATUS[q.status]}</Badge></span>
                    <span className="mt-1 block text-sm">{q.contact_name}{q.company ? ` – ${q.company}` : ""}</span>
                    <span className="block text-xs text-steel-500">{q.items.length} hạng mục · giao {q.desired_date}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {list.data && <Pagination page={page} totalPages={Math.max(1, Math.ceil(list.data.count / 20))} onChange={setPage} />}
        </div>
        {open && <QuoteEditor key={open} code={open} onChanged={() => setReload((n) => n + 1)} />}
      </div>
    </div>
  );
}

function QuoteEditor({ code, onChanged }) {
  const { user } = useAuth();
  const canWrite = can(user, SALES_UP);
  const [version, setVersion] = useState(0);
  const { data: q, loading, error } = useFetch(() => manage.list(`quotations/${code}`), [code, version]);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q) setForm({ discount_percent: q.discount_percent, shipping_fee: q.shipping_fee, valid_until: q.valid_until || "", staff_note: q.staff_note || "", prices: Object.fromEntries(q.items.map((i) => [i.id, i.unit_price ?? ""])) });
  }, [q]);

  if (loading || !form) return <Loading />;
  if (error) return <ErrorBox message={apiErrorMessage(error)} />;

  const subtotal = q.items.reduce((s, i) => s + num(form.prices[i.id]) * Number(i.quantity), 0);
  const discount = Math.round((subtotal * num(form.discount_percent)) / 100);
  const total = subtotal - discount + num(form.shipping_fee);

  const save = async () => {
    const body = {
      discount_percent: num(form.discount_percent), shipping_fee: num(form.shipping_fee), valid_until: form.valid_until || null, staff_note: form.staff_note,
      items: q.items.map((i) => ({ id: i.id, unit_price: form.prices[i.id] === "" ? null : num(form.prices[i.id]) })),
    };
    await manage.update("quotations", code, body);
  };
  const run = async (fn, okText) => {
    setBusy(true); setMsg({ type: "", text: "" });
    try { await fn(); setMsg({ type: "ok", text: okText }); setVersion((n) => n + 1); onChanged(); }
    catch (err) { setMsg({ type: "error", text: apiErrorMessage(err) }); }
    finally { setBusy(false); }
  };
  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <section className="border border-steel-200 bg-white p-5 text-sm" aria-label={`Báo giá ${code}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-h3">{q.code}</h2><p className="text-steel-500">{STATUS[q.status]} · nhận {new Date(q.created_at).toLocaleString("vi-VN")}</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => run(() => downloadFile(`/manage/quotations/${code}/pdf/`, `${code}.pdf`), "Đã tải PDF.")}>Xuất PDF</Button>
          {q.has_attachment && <Button variant="outline" onClick={() => run(() => downloadFile(`/manage/quotations/${code}/attachment/`, q.attachment_name || "dinh-kem"), "Đã tải file đính kèm.")}>File khách gửi</Button>}
        </div>
      </div>
      <p className="mt-4"><strong>{q.contact_name}</strong> · {q.phone} · {q.email}{q.company && ` · ${q.company}`}</p>
      <p>Công trình: {q.site_address}</p><p>Ngày giao mong muốn: {q.desired_date}</p>
      {q.note && <p className="mt-1 text-steel-500">Ghi chú của khách: {q.note}</p>}

      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[520px]">
        <thead className="bg-steel-100 text-left"><tr><th className="p-2">Vật liệu</th><th className="p-2">SL</th><th className="p-2">Đơn giá (VNĐ)</th><th className="p-2 text-right">Thành tiền</th></tr></thead>
        <tbody>{q.items.map((i) => (
          <tr key={i.id} className="border-t border-steel-200">
            <td className="p-2">{i.product_name}</td><td className="p-2">{Number(i.quantity)} {i.unit}</td>
            <td className="p-2"><input aria-label={`Đơn giá ${i.product_name}`} type="number" min="0" disabled={!canWrite} className={`${inputClass} w-36`} value={form.prices[i.id]} onChange={(e) => set("prices", { ...form.prices, [i.id]: e.target.value })} /></td>
            <td className="price p-2 text-right">{form.prices[i.id] === "" ? "—" : formatVND(num(form.prices[i.id]) * Number(i.quantity))}</td>
          </tr>))}</tbody>
      </table></div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block"><span className="font-semibold">Chiết khấu (%)</span><input type="number" min="0" max="100" disabled={!canWrite} className={inputClass} value={form.discount_percent} onChange={(e) => set("discount_percent", e.target.value)} /></label>
        <label className="block"><span className="font-semibold">Phí vận chuyển (VNĐ)</span><input type="number" min="0" disabled={!canWrite} className={inputClass} value={form.shipping_fee} onChange={(e) => set("shipping_fee", e.target.value)} /></label>
        <label className="block"><span className="font-semibold">Hiệu lực đến</span><input type="date" disabled={!canWrite} className={inputClass} value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} /></label>
      </div>
      <label className="mt-3 block"><span className="font-semibold">Ghi chú trên báo giá</span><textarea rows="2" disabled={!canWrite} className={inputClass} value={form.staff_note} onChange={(e) => set("staff_note", e.target.value)} /></label>

      <dl className="mt-4 space-y-1 text-right">
        <div><dt className="inline text-steel-500">Tạm tính </dt><dd className="price inline">{formatVND(subtotal)}</dd></div>
        <div><dt className="inline text-steel-500">Chiết khấu </dt><dd className="price inline">−{formatVND(discount)}</dd></div>
        <div className="text-base"><dt className="inline font-bold">Tổng cộng </dt><dd className="price inline text-lg">{formatVND(total)}</dd></div>
      </dl>
      {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`mt-3 p-3 ${msg.type === "error" ? "border-l-4 border-danger bg-[#F6E1DE] text-danger" : "border-l-4 border-ok bg-[#E3F1E8] text-ok"}`}>{msg.text}</p>}
      {canWrite && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={busy} onClick={() => run(save, "Đã lưu báo giá.")}>Lưu</Button>
          <Button variant="dark" disabled={busy || q.status === "sent"} onClick={() => run(async () => { await save(); await manage.action("quotations", code, "send"); }, "Đã đánh dấu gửi báo giá.")}>Lưu và gửi báo giá</Button>
        </div>
      )}
    </section>
  );
}
