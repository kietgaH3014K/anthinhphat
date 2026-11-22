import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSiteConfig } from "../context/SiteConfigContext";
import { createOrder } from "../services/orderService";
import { apiErrorMessage } from "../utils/errors";
import { formatVND } from "../utils/format";
import { PAYMENT_METHOD } from "../utils/labels";
import { canSeeWholesale } from "../utils/permissions";
import { calcTotals, unitPrice } from "../utils/pricing";

const PHONE = /^(0|\+84)\d{9}$/;

export default function CheckoutPage() {
  const { user } = useAuth();
  const { selectedItems, removeSelected, coupon, setCoupon } = useCart();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const ws = canSeeWholesale(user);
  const { shippingRule } = useSiteConfig();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { full_name: [user?.last_name, user?.first_name].filter(Boolean).join(" "), phone: user?.phone || "", payment_method: "cod", city: "TP. Hồ Chí Minh" },
  });

  if (selectedItems.length === 0) return <Navigate to="/gio-hang" replace />;
  const totals = calcTotals(selectedItems, ws, coupon?.percent || 0, shippingRule);

  const onSubmit = async (values) => {
    setSubmitError("");
    // Với API thật, backend chỉ dùng product_id, qty, coupon_code và tự tính lại giá, tồn kho. Phần còn lại là ảnh chụp để hiển thị.
    const payload = {
      items: selectedItems.map((it) => ({
        product_id: it.id, qty: it.qty, name: it.name, unit: it.unit, unit_price: unitPrice(it, ws), line_total: unitPrice(it, ws) * it.qty,
      })),
      coupon_code: coupon?.code || null,
      totals,
      shipping_address: { full_name: values.full_name, phone: values.phone, address: values.address, district: values.district, city: values.city },
      note: values.note || "",
      payment_method: values.payment_method,
    };
    try {
      const order = await createOrder(payload, user);
      removeSelected();
      setCoupon(null);
      navigate(`/don-hang/${order.code}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "Không đặt được hàng. Vui lòng thử lại."));
    }
  };

  return (
    <div className="mx-auto max-w-page px-4 py-12">
      <h1 className="text-h1">Thanh toán</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <fieldset className="space-y-4 border border-steel-200 bg-white p-6">
            <legend className="px-2 text-h3">Thông tin nhận hàng</legend>
            <Field label="Họ và tên" htmlFor="full_name" error={errors.full_name?.message}>
              <input id="full_name" className={inputClass} aria-invalid={!!errors.full_name} {...register("full_name", { required: "Nhập họ và tên người nhận." })} />
            </Field>
            <Field label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
              <input id="phone" inputMode="tel" className={inputClass} aria-invalid={!!errors.phone} {...register("phone", { required: "Nhập số điện thoại.", pattern: { value: PHONE, message: "Số điện thoại không hợp lệ (ví dụ 0901234567)." } })} />
            </Field>
            <Field label="Địa chỉ giao hàng" htmlFor="address" error={errors.address?.message}>
              <input id="address" className={inputClass} aria-invalid={!!errors.address} {...register("address", { required: "Nhập số nhà, tên đường." })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quận / Huyện" htmlFor="district" error={errors.district?.message}>
                <input id="district" className={inputClass} aria-invalid={!!errors.district} {...register("district", { required: "Nhập quận / huyện." })} />
              </Field>
              <Field label="Tỉnh / Thành phố" htmlFor="city"><input id="city" className={inputClass} {...register("city")} /></Field>
            </div>
            <Field label="Ghi chú (không bắt buộc)" htmlFor="note" hint="Ví dụ: giờ nhận hàng, xe tải được vào hẻm hay không.">
              <textarea id="note" rows="3" className={inputClass} {...register("note")} />
            </Field>
          </fieldset>

          <fieldset className="border border-steel-200 bg-white p-6">
            <legend className="px-2 text-h3">Phương thức thanh toán</legend>
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-3"><input type="radio" value="cod" className="mt-1" {...register("payment_method")} /> {PAYMENT_METHOD.cod}</label>
              <label className="flex items-start gap-3"><input type="radio" value="bank_transfer" className="mt-1" {...register("payment_method")} /> {PAYMENT_METHOD.bank_transfer}
                <span className="block text-xs text-steel-500">Thông tin tài khoản hiển thị sau khi đặt hàng.</span></label>
              <label className="flex items-start gap-3 text-steel-500"><input type="radio" disabled className="mt-1" /> {PAYMENT_METHOD.online} (chưa được cấu hình)</label>
            </div>
          </fieldset>
        </div>

        <div>
          <CartSummary totals={totals} couponCode={coupon?.code}>
            <ul className="mt-4 space-y-1 border-t border-steel-200 pt-3 text-xs text-steel-500">
              {selectedItems.map((it) => <li key={it.id} className="flex justify-between gap-2"><span>{it.name} × {it.qty}</span><span>{formatVND(unitPrice(it, ws) * it.qty)}</span></li>)}
            </ul>
            {submitError && <p role="alert" className="mt-4 border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger">{submitError}</p>}
            <Button type="submit" className="mt-5 w-full" disabled={isSubmitting}>{isSubmitting ? "Đang đặt hàng…" : "Xác nhận đặt hàng"}</Button>
          </CartSummary>
        </div>
      </form>
    </div>
  );
}
