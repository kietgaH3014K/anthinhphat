import { Link, useLocation, useParams } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { ErrorBox, Loading } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import { useSiteConfig } from "../context/SiteConfigContext";
import useFetch from "../hooks/useFetch";
import { getOrder } from "../services/orderService";
import { formatVND } from "../utils/format";
import { ORDER_STATUS, PAYMENT_METHOD } from "../utils/labels";

export default function OrderDetailPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const { state } = useLocation();
  const { bank_info: bankInfo } = useSiteConfig();
  const { data: o, loading, error } = useFetch(() => getOrder(code, user), [code, user.email]);

  if (loading) return <Loading />;
  if (error) return <div className="mx-auto max-w-page px-4 py-16"><ErrorBox message="Không tìm thấy đơn hàng này." /><Link to="/tai-khoan" className="mt-6 inline-block font-bold underline">Về tài khoản</Link></div>;

  const addr = o.shipping_address;
  return (
    <div className="mx-auto max-w-page px-4 py-12">
      {state?.justPlaced && (
        <p role="status" className="mb-6 border-l-4 border-ok bg-[#E3F1E8] p-4 text-sm text-ok">
          Đặt hàng thành công. Chúng tôi sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.
        </p>
      )}
      <h1 className="text-h1">Đơn hàng {o.code}</h1>
      <p className="mt-2 text-sm text-steel-500">Đặt lúc {new Date(o.created_at).toLocaleString("vi-VN")} · Trạng thái: <strong className="text-steel-900">{ORDER_STATUS[o.status] || o.status}</strong></p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="overflow-x-auto border border-steel-200 bg-white">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-steel-100 text-left"><tr><th className="p-3">Sản phẩm</th><th className="p-3 text-right">Đơn giá</th><th className="p-3 text-right">SL</th><th className="p-3 text-right">Thành tiền</th></tr></thead>
              <tbody>
                {o.items.map((it) => (
                  <tr key={it.product_id} className="border-t border-steel-200">
                    <td className="p-3 font-semibold">{it.name}</td>
                    <td className="price p-3 text-right">{formatVND(it.unit_price)}</td>
                    <td className="p-3 text-right">{it.qty} {it.unit}</td>
                    <td className="price p-3 text-right">{formatVND(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="grid gap-6 border border-steel-200 bg-white p-6 text-sm sm:grid-cols-2">
            <div><h2 className="font-bold">Giao đến</h2>
              <p className="mt-2">{addr.full_name} · {addr.phone}</p>
              <p>{addr.address}, {addr.district}, {addr.city}</p>
              {o.note && <p className="mt-2 text-steel-500">Ghi chú: {o.note}</p>}</div>
            <div><h2 className="font-bold">Thanh toán</h2>
              <p className="mt-2">{PAYMENT_METHOD[o.payment_method]}</p>
              {o.payment_method === "bank_transfer" && (bankInfo
                ? <p className="mt-1 whitespace-pre-line text-steel-700">{bankInfo}<br />Nội dung chuyển khoản: {o.code}</p>
                : <p className="mt-1 text-steel-500">Thông tin tài khoản ngân hàng sẽ do cửa hàng gửi khi xác nhận đơn.</p>)}</div>
          </section>
        </div>
        <CartSummary totals={o.totals} couponCode={o.coupon_code} />
      </div>
    </div>
  );
}
