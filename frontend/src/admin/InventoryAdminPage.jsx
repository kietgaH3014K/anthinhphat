import { useState } from "react";
import { useForm } from "react-hook-form";
import Field, { inputClass } from "../components/FormField";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { formatVND } from "../utils/format";
import { manage } from "./adminApi";
import { WAREHOUSE_UP, can } from "./roles";

const TABS = [["stock", "Tồn kho"], ["low", "Sắp hết hàng"], ["history", "Lịch sử nhập xuất"], ["action", "Nhập / Xuất / Kiểm kê"]];

export default function InventoryAdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("stock");
  const [reload, setReload] = useState(0);
  const summary = useFetch(() => manage.list("inventory/summary"), [reload]);
  return (
    <div>
      <h1 className="text-h2">Kho và tồn kho</h1>
      {summary.data && <p className="mt-2 text-sm text-steel-500">Tổng {Number(summary.data.total_units).toLocaleString("vi-VN")} đơn vị · giá trị tồn kho {formatVND(summary.data.inventory_value)} (theo giá vốn)</p>}
      <div role="tablist" aria-label="Chức năng kho" className="mt-5 flex flex-wrap gap-2 border-b border-steel-200">
        {TABS.filter(([k]) => k !== "action" || can(user, WAREHOUSE_UP)).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-bold ${tab === k ? "border-b-4 border-brand-500" : "text-steel-500 hover:text-steel-900"}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "stock" && <PagedTable resource="inventory" reload={reload} search columns={[
          ["Sản phẩm", (r) => <>{r.product_name}<br /><span className="text-xs text-steel-500">{r.sku}</span></>], ["Kho", (r) => r.warehouse_name],
          ["Tồn", (r) => <>{r.quantity} {r.unit} {r.low && <Badge tone="danger">Sắp hết</Badge>}</>],
        ]} />}
        {tab === "low" && <LowStock reload={reload} />}
        {tab === "history" && <PagedTable resource="inventory-transactions" reload={reload} search columns={[
          ["Thời gian", (r) => new Date(r.created_at).toLocaleString("vi-VN")], ["Sản phẩm", (r) => r.product_name], ["Kho", (r) => r.warehouse_name],
          ["Loại", (r) => r.kind_label], ["Thay đổi", (r) => <strong className={r.quantity_change < 0 ? "text-danger" : "text-ok"}>{r.quantity_change > 0 ? "+" : ""}{r.quantity_change}</strong>],
          ["Tồn sau", (r) => r.balance_after], ["Chứng từ / ghi chú", (r) => [r.reference, r.note].filter(Boolean).join(" · ")], ["Người thực hiện", (r) => r.created_by_email],
        ]} />}
        {tab === "action" && <StockForm onDone={() => setReload((n) => n + 1)} />}
      </div>
    </div>
  );
}

function PagedTable({ resource, columns, reload, search: searchable }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const list = useFetch(() => manage.list(resource, { page, search: query || undefined }), [resource, page, query, reload]);
  return (
    <div>
      {searchable && (
        <form className="mb-4 flex max-w-md" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label htmlFor={`s-${resource}`} className="sr-only">Tìm kiếm</label>
          <input id={`s-${resource}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, SKU, chứng từ…" className={`${inputClass} border-r-0`} />
          <Button type="submit" variant="dark">Tìm</Button>
        </form>
      )}
      {list.loading ? <Loading /> : list.error ? <ErrorBox message={apiErrorMessage(list.error)} /> : list.data.results.length === 0 ? <Empty title="Chưa có dữ liệu" /> : (
        <div className="overflow-x-auto border border-steel-200 bg-white"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-steel-100 text-left"><tr>{columns.map(([h]) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>{list.data.results.map((r) => <tr key={r.id} className="border-t border-steel-200">{columns.map(([h, f]) => <td key={h} className="p-3">{f(r)}</td>)}</tr>)}</tbody>
        </table></div>
      )}
      {list.data && <Pagination page={page} totalPages={Math.max(1, Math.ceil(list.data.count / 20))} onChange={setPage} />}
    </div>
  );
}

function LowStock({ reload }) {
  const { data, loading, error } = useFetch(() => manage.list("inventory/low-stock"), [reload]);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={apiErrorMessage(error)} />;
  if (!data.length) return <Empty title="Không có sản phẩm nào sắp hết hàng" />;
  return (
    <div className="overflow-x-auto border border-steel-200 bg-white"><table className="w-full text-sm">
      <thead className="bg-steel-100 text-left"><tr><th className="p-3">SKU</th><th className="p-3">Sản phẩm</th><th className="p-3">Tồn</th><th className="p-3">Ngưỡng cảnh báo</th></tr></thead>
      <tbody>{data.map((p) => <tr key={p.id} className="border-t border-steel-200"><td className="p-3">{p.sku}</td><td className="p-3">{p.name}</td><td className="p-3 font-bold text-danger">{p.stock} {p.unit}</td><td className="p-3">{p.threshold}</td></tr>)}</tbody>
    </table></div>
  );
}

function StockForm({ onDone }) {
  const products = useFetch(() => manage.list("products", { page_size: 200 }), []);
  const warehouses = useFetch(() => manage.list("warehouses", { page_size: 200 }), []);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { mode: "receive" } });
  const [result, setResult] = useState({ type: "", text: "" });
  const mode = watch("mode");

  const onSubmit = async (v) => {
    setResult({ type: "", text: "" });
    const body = { product: Number(v.product), warehouse: Number(v.warehouse), quantity: Number(v.quantity), note: v.note || "", reference: v.reference || "" };
    if (mode === "receive" && v.unit_cost !== "") body.unit_cost = Number(v.unit_cost);
    if (mode === "adjust") body.stocktake = Boolean(v.stocktake);
    try {
      await manage.create(`inventory/${mode}`, body);
      setResult({ type: "ok", text: "Đã ghi nhận vào lịch sử kho." });
      reset({ mode, product: v.product, warehouse: v.warehouse });
      onDone();
    } catch (err) { setResult({ type: "error", text: apiErrorMessage(err, "Không thực hiện được.") }); }
  };

  if (products.loading || warehouses.loading) return <Loading />;
  const noWarehouse = (warehouses.data?.results || []).length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid max-w-3xl gap-4 border border-steel-200 bg-white p-6 sm:grid-cols-2">
      <fieldset className="flex flex-wrap gap-6 text-sm font-semibold sm:col-span-2">
        <legend className="sr-only">Loại thao tác</legend>
        <label className="flex items-center gap-2"><input type="radio" value="receive" {...register("mode")} /> Nhập kho</label>
        <label className="flex items-center gap-2"><input type="radio" value="issue" {...register("mode")} /> Xuất kho</label>
        <label className="flex items-center gap-2"><input type="radio" value="adjust" {...register("mode")} /> Điều chỉnh / kiểm kê</label>
      </fieldset>
      {noWarehouse && <p className="border-l-4 border-gold bg-paper p-3 text-sm sm:col-span-2">Chưa có kho nào. Hãy tạo kho trong mục “Danh sách kho” trước.</p>}
      <Field label="Sản phẩm" htmlFor="sf-product" error={errors.product?.message}>
        <select id="sf-product" className={inputClass} {...register("product", { required: "Chọn sản phẩm." })}><option value="">Chọn…</option>{(products.data?.results || []).map((p) => <option key={p.id} value={p.id}>{p.sku} – {p.name}</option>)}</select>
      </Field>
      <Field label="Kho" htmlFor="sf-wh" error={errors.warehouse?.message}>
        <select id="sf-wh" className={inputClass} {...register("warehouse", { required: "Chọn kho." })}><option value="">Chọn…</option>{(warehouses.data?.results || []).filter((w) => w.is_active).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
      </Field>
      <Field label={mode === "adjust" ? "Số lượng THỰC TẾ sau kiểm kê" : "Số lượng"} htmlFor="sf-qty" error={errors.quantity?.message}>
        <input id="sf-qty" type="number" min="0" className={inputClass} {...register("quantity", { required: "Nhập số lượng.", min: { value: mode === "adjust" ? 0 : 1, message: "Số lượng không hợp lệ." } })} />
      </Field>
      {mode === "receive" && <Field label="Giá nhập / đơn vị (VNĐ)" htmlFor="sf-cost" hint="Dùng để cập nhật giá vốn bình quân."><input id="sf-cost" type="number" min="0" className={inputClass} {...register("unit_cost")} /></Field>}
      {mode !== "adjust" && <Field label="Số chứng từ" htmlFor="sf-ref"><input id="sf-ref" className={inputClass} {...register("reference")} /></Field>}
      {mode === "adjust" && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" {...register("stocktake")} /> Đây là kiểm kê định kỳ</label>}
      <div className="sm:col-span-2">
        <Field label={mode === "adjust" ? "Lý do (bắt buộc)" : "Ghi chú"} htmlFor="sf-note" error={errors.note?.message}>
          <input id="sf-note" className={inputClass} {...register("note", { required: mode === "adjust" ? "Nhập lý do điều chỉnh." : false })} />
        </Field>
      </div>
      {result.text && <p role={result.type === "error" ? "alert" : "status"} className={`p-3 text-sm sm:col-span-2 ${result.type === "error" ? "border-l-4 border-danger bg-[#F6E1DE] text-danger" : "border-l-4 border-ok bg-[#E3F1E8] text-ok"}`}>{result.text}</p>}
      <div className="sm:col-span-2"><Button type="submit" disabled={isSubmitting || noWarehouse}>{isSubmitting ? "Đang ghi…" : "Ghi nhận"}</Button></div>
    </form>
  );
}
