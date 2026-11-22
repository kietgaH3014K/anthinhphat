import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorBox, Loading } from "../components/ui/State";
import useFetch from "../hooks/useFetch";
import { apiErrorMessage } from "../utils/errors";
import { formatVND } from "../utils/format";
import { ORDER_STATUS } from "../utils/labels";
import api from "../services/api";

const Stat = ({ label, value }) => (
  <div className="corner-marks border border-steel-200 bg-white p-5"><p className="text-sm text-steel-500">{label}</p><p className="price mt-1 text-2xl">{value}</p></div>
);

export default function DashboardPage() {
  const { data, loading, error } = useFetch(() => api.get("/manage/dashboard/").then((r) => r.data), []);
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={apiErrorMessage(error)} />;
  const n = (v) => Number(v).toLocaleString("vi-VN");

  return (
    <div className="space-y-10">
      <h1 className="text-h2">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Tổng doanh thu (đơn hoàn thành)" value={formatVND(data.total_revenue)} />
        <Stat label="Tổng đơn hàng" value={n(data.total_orders)} />
        <Stat label="Đơn đang xử lý" value={n(data.open_orders)} />
        <Stat label="Khách hàng" value={n(data.customers)} />
        <Stat label="Sản phẩm" value={n(data.products)} />
        <Stat label="Giá trị tồn kho (theo giá vốn)" value={formatVND(data.inventory_value)} />
      </div>

      <section aria-labelledby="d-rev" className="border border-steel-200 bg-white p-5">
        <h2 id="d-rev" className="text-h3">Doanh thu 30 ngày gần nhất</h2>
        {data.revenue_by_day.length === 0 ? <p className="mt-4 text-sm text-steel-500">Chưa có đơn hoàn thành trong 30 ngày qua.</p> : (
          <div className="mt-4 h-72" role="img" aria-label="Biểu đồ doanh thu theo ngày">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue_by_day}>
                <CartesianGrid stroke="#ECEEF0" />
                <XAxis dataKey="day" tickFormatter={(d) => d.slice(5)} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} width={50} />
                <Tooltip formatter={(v) => formatVND(v)} labelFormatter={(d) => `Ngày ${d}`} />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#E99A24" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Table title="Sản phẩm bán chạy" head={["Sản phẩm", "Đã bán"]} rows={data.best_sellers.map((b) => [b.name, `${b.qty} ${b.unit}`])} empty="Chưa có dữ liệu bán hàng." />
        <Table title="Đơn hàng mới" head={["Mã đơn", "Khách", "Trạng thái", "Tổng"]} rows={data.new_orders.map((o) => [o.code, o.customer, ORDER_STATUS[o.status], formatVND(o.total)])} empty="Chưa có đơn hàng." />
      </div>
      <Table title="Cảnh báo tồn kho" head={["SKU", "Sản phẩm", "Tồn", "Ngưỡng"]} rows={data.low_stock.map((p) => [p.sku, p.name, `${p.stock} ${p.unit}`, p.threshold])} empty="Không có sản phẩm nào sắp hết hàng." />
    </div>
  );
}

function Table({ title, head, rows, empty }) {
  return (
    <section className="border border-steel-200 bg-white p-5">
      <h2 className="text-h3">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-sm text-steel-500">{empty}</p> : (
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-steel-500"><tr>{head.map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-steel-200">{r.map((c, j) => <td key={j} className="py-2 pr-3">{c}</td>)}</tr>)}</tbody>
        </table></div>
      )}
    </section>
  );
}
