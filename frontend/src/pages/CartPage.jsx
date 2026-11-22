import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import QtyInput from "../components/ui/QtyInput";
import { Empty } from "../components/ui/State";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSiteConfig } from "../context/SiteConfigContext";
import { validateCoupon } from "../services/orderService";
import { formatVND } from "../utils/format";
import { canSeeWholesale } from "../utils/permissions";
import { calcTotals, unitPrice } from "../utils/pricing";

export default function CartPage() {
  const { items, selectedItems, setQty, toggle, toggleAll, remove, coupon, setCoupon } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ws = canSeeWholesale(user);
  const { shippingRule } = useSiteConfig();
  const [code, setCode] = useState("");
  const [couponError, setCouponError] = useState("");

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-16">
        <h1 className="text-h1">Giỏ hàng</h1>
        <div className="mt-8"><Empty title="Giỏ hàng đang trống"><Link className="font-bold underline" to="/san-pham">Xem sản phẩm</Link></Empty></div>
      </div>
    );
  }

  const totals = calcTotals(selectedItems, ws, coupon?.percent || 0, shippingRule);
  const allSelected = selectedItems.length === items.length;

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    try { setCoupon(await validateCoupon(code)); setCode(""); }
    catch (err) { setCouponError(err.response?.data?.detail || err.message); }
  };

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <h1 className="text-h1">Giỏ hàng</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-label="Sản phẩm trong giỏ">
          <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /> Chọn tất cả ({items.length})
          </label>
          <ul className="divide-y divide-steel-200 border border-steel-200 bg-white">
            {items.map((it) => {
              const price = unitPrice(it, ws);
              return (
                <li key={it.id} className="grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <input type="checkbox" aria-label={`Chọn ${it.name}`} checked={it.selected} onChange={() => toggle(it.id)} />
                  <div>
                    <Link to={`/san-pham/${it.slug}`} className="font-bold hover:text-brand-600">{it.name}</Link>
                    <p className="text-xs text-steel-500">{it.spec}</p>
                    <p className="mt-1 text-sm">
                      <span className="price">{formatVND(price)}</span>/{it.unit}
                      {ws && price !== Number(it.retail_price) && <span className="ml-2 text-xs font-semibold text-ok">đã áp dụng giá sỉ</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <QtyInput value={it.qty} onChange={(q) => setQty(it.id, q)} max={it.stock} label={`Số lượng ${it.name}`} />
                    <p className="price w-28 text-right">{formatVND(price * it.qty)}</p>
                    <button className="text-xs font-semibold text-danger underline" onClick={() => remove(it.id)}>Xóa</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <CartSummary totals={totals} couponCode={coupon?.code}>
          <form onSubmit={applyCoupon} className="mt-5">
            <label htmlFor="coupon" className="mb-1.5 block text-sm font-semibold">Mã giảm giá</label>
            <div className="flex gap-2">
              <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="Nhập mã" />
              <Button type="submit" variant="dark" disabled={!code.trim()}>Áp dụng</Button>
            </div>
            {couponError && <p role="alert" className="mt-1 text-xs text-danger">{couponError}</p>}
            {coupon && (
              <p className="mt-2 text-xs text-ok">Đang dùng mã {coupon.code} (−{coupon.percent}%).{" "}
                <button type="button" className="underline" onClick={() => setCoupon(null)}>Bỏ mã</button></p>
            )}
          </form>
          <Button className="mt-5 w-full" disabled={selectedItems.length === 0} onClick={() => navigate("/thanh-toan")}>
            Tiến hành đặt hàng ({selectedItems.length})
          </Button>
          {selectedItems.length === 0 && <p className="mt-2 text-xs text-steel-500">Chọn ít nhất một sản phẩm để đặt hàng.</p>}
        </CartSummary>
      </div>
    </div>
  );
}
