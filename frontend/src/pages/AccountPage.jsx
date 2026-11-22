import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Empty, ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { listOrders } from "../services/orderService";
import { formatVND } from "../utils/format";
import { ORDER_STATUS, WHOLESALE_STATUS } from "../utils/labels";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const orders = useFetch(() => listOrders(user), [user.email]);
  const name = [user.last_name, user.first_name].filter(Boolean).join(" ") || user.email;
  const status = user.wholesale_status;

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-h1">Tài khoản của tôi</h1>
        <Button variant="outline" onClick={async () => { await logout(); navigate("/"); }}>Đăng xuất</Button>
      </div>

      <section className="mt-8 grid gap-6 border border-steel-200 bg-white p-6 sm:grid-cols-2" aria-label="Thông tin tài khoản">
        <dl className="space-y-2 text-sm">
          <div><dt className="text-steel-500">Họ và tên</dt><dd className="font-bold">{name}</dd></div>
          <div><dt className="text-steel-500">Email</dt><dd>{user.email}</dd></div>
          <div><dt className="text-steel-500">Số điện thoại</dt><dd>{user.phone || "—"}</dd></div>
        </dl>
        <dl className="space-y-2 text-sm">
          <div><dt className="text-steel-500">Loại tài khoản</dt>
            <dd><Badge tone={status === "approved" ? "ok" : status === "pending" ? "sale" : status === "rejected" ? "danger" : "neutral"}>{WHOLESALE_STATUS[status] || "Khách lẻ"}</Badge></dd></div>
          {user.company_name && <div><dt className="text-steel-500">Công ty</dt><dd>{user.company_name}</dd></div>}
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="acc-orders">
        <h2 id="acc-orders" className="text-h2">Lịch sử đơn hàng</h2>
        <div className="mt-5">
          {orders.loading ? <Loading /> : orders.error ? <ErrorBox /> : orders.data.length === 0 ? (
            <Empty title="Bạn chưa có đơn hàng nào"><Link className="font-bold underline" to="/san-pham">Xem sản phẩm</Link></Empty>
          ) : (
            <div className="overflow-x-auto border border-steel-200 bg-white">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-steel-100 text-left"><tr><th className="p-3">Mã đơn</th><th className="p-3">Ngày đặt</th><th className="p-3">Trạng thái</th><th className="p-3 text-right">Tổng tiền</th></tr></thead>
                <tbody>
                  {orders.data.map((o) => (
                    <tr key={o.code} className="border-t border-steel-200">
                      <td className="p-3"><Link className="font-bold underline" to={`/don-hang/${o.code}`}>{o.code}</Link></td>
                      <td className="p-3">{new Date(o.created_at).toLocaleDateString("vi-VN")}</td>
                      <td className="p-3">{ORDER_STATUS[o.status] || o.status}</td>
                      <td className="price p-3 text-right">{formatVND(o.totals.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
