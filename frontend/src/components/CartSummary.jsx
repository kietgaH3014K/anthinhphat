import { formatVND } from "../utils/format";

export default function CartSummary({ totals, couponCode, children }) {
  const row = "flex justify-between py-1.5 text-sm";
  return (
    <aside className="corner-marks h-fit border border-steel-200 bg-white p-5" aria-label="Tóm tắt đơn hàng">
      <h2 className="text-h3">Tóm tắt đơn hàng</h2>
      <dl className="mt-4">
        <div className={row}><dt>Tạm tính</dt><dd className="price">{formatVND(totals.subtotal)}</dd></div>
        {totals.discount > 0 && (
          <div className={row}><dt>Mã giảm giá {couponCode}</dt><dd className="price text-ok">−{formatVND(totals.discount)}</dd></div>
        )}
        <div className={row}><dt>Phí vận chuyển (tạm tính)</dt><dd className="price">{totals.shipping ? formatVND(totals.shipping) : "Miễn phí"}</dd></div>
        <div className="mt-2 flex justify-between border-t border-steel-200 pt-3">
          <dt className="font-bold">Tổng cộng</dt><dd className="price text-xl">{formatVND(totals.total)}</dd>
        </div>
      </dl>
      {children}
    </aside>
  );
}
