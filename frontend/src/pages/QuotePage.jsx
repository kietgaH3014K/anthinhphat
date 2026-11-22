import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import usePageMeta from "../hooks/usePageMeta";
import { listProductOptions } from "../services/catalogService";
import { submitQuote } from "../services/orderService";
import { apiErrorMessage } from "../utils/errors";

const PHONE = /^(0|\+84)\d{9}$/;
const ALLOWED_EXT = [".xlsx", ".xls", ".pdf"];
const MAX_BYTES = 10 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);

export default function QuotePage() {
  usePageMeta({ title: "Yêu cầu báo giá công trình", description: "Gửi danh sách vật liệu xây dựng, nhận báo giá riêng cho công trình tại TP.HCM." });
  const { user } = useAuth();
  const [params] = useSearchParams();
  const options = useFetch(listProductOptions, []);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(null);

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      items: [{ product_name: "", qty: 1, unit: "" }],
      contact_name: [user?.last_name, user?.first_name].filter(Boolean).join(" "),
      phone: user?.phone || "", email: user?.email || "", company: user?.company_name || "",
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Điền sẵn sản phẩm khi đi từ trang chi tiết (?sp=slug)
  useEffect(() => {
    const slug = params.get("sp");
    const found = slug && options.data?.find((o) => o.slug === slug);
    if (found) { setValue("items.0.product_name", found.name); setValue("items.0.unit", found.unit); }
  }, [options.data, params, setValue]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    setFileError("");
    if (!f) { setFile(null); return; }
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) { setFileError("Chỉ nhận file Excel (.xlsx, .xls) hoặc PDF."); e.target.value = ""; setFile(null); return; }
    if (f.size > MAX_BYTES) { setFileError("File quá lớn, tối đa 10 MB."); e.target.value = ""; setFile(null); return; }
    setFile(f);
  };

  const onSubmit = async (values) => {
    setSubmitError("");
    try { setDone(await submitQuote({ ...values, user_id: user?.id ?? null }, file)); }
    catch (err) { setSubmitError(apiErrorMessage(err, "Không gửi được yêu cầu. Vui lòng thử lại.")); }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="text-h1">Đã nhận yêu cầu báo giá</h1>
        <p className="mt-4">Mã yêu cầu của bạn: <strong className="price">{done.code}</strong></p>
        <p className="mt-2 text-steel-500">Chúng tôi sẽ liên hệ qua số điện thoại hoặc email bạn đã nhập.</p>
        <div className="mt-8 flex gap-4"><Button to="/san-pham">Tiếp tục xem sản phẩm</Button><Button to="/" variant="outline">Về trang chủ</Button></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-h1">Yêu cầu báo giá công trình</h1>
      <p className="mt-3 max-w-2xl text-steel-500">Liệt kê vật liệu cần mua, địa chỉ công trình và ngày cần giao. Có sẵn bảng khối lượng thì đính kèm Excel hoặc PDF.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 space-y-8">
        <fieldset className="border border-steel-200 bg-white p-6">
          <legend className="px-2 text-h3">Vật liệu cần báo giá</legend>
          <datalist id="product-options">{(options.data || []).map((o) => <option key={o.slug} value={o.name} />)}</datalist>
          <ul className="space-y-4">
            {fields.map((f, i) => (
              <li key={f.id} className="grid gap-3 sm:grid-cols-[1fr_110px_110px_auto] sm:items-start">
                <Field label={i === 0 ? "Tên vật liệu" : ""} htmlFor={`item-name-${i}`} error={errors.items?.[i]?.product_name?.message}>
                  <input id={`item-name-${i}`} list="product-options" aria-label={`Tên vật liệu dòng ${i + 1}`} className={inputClass} aria-invalid={!!errors.items?.[i]?.product_name}
                    {...register(`items.${i}.product_name`, { required: "Nhập tên vật liệu." })} />
                </Field>
                <Field label={i === 0 ? "Số lượng" : ""} htmlFor={`item-qty-${i}`} error={errors.items?.[i]?.qty?.message}>
                  <input id={`item-qty-${i}`} type="number" min="1" step="any" aria-label={`Số lượng dòng ${i + 1}`} className={inputClass}
                    {...register(`items.${i}.qty`, { valueAsNumber: true, required: "Nhập số lượng.", min: { value: 0.01, message: "Phải lớn hơn 0." } })} />
                </Field>
                <Field label={i === 0 ? "Đơn vị tính" : ""} htmlFor={`item-unit-${i}`} error={errors.items?.[i]?.unit?.message}>
                  <input id={`item-unit-${i}`} placeholder="bao, kg, m³…" aria-label={`Đơn vị dòng ${i + 1}`} className={inputClass}
                    {...register(`items.${i}.unit`, { required: "Nhập đơn vị." })} />
                </Field>
                <button type="button" className={`text-sm font-semibold text-danger underline disabled:opacity-30 ${i === 0 ? "sm:mt-8" : "sm:mt-3"}`}
                  disabled={fields.length === 1} onClick={() => remove(i)}>Xóa</button>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-5" onClick={() => append({ product_name: "", qty: 1, unit: "" })}>Thêm vật liệu</Button>
        </fieldset>

        <fieldset className="grid gap-4 border border-steel-200 bg-white p-6 sm:grid-cols-2">
          <legend className="px-2 text-h3">Công trình và giao hàng</legend>
          <div className="sm:col-span-2">
            <Field label="Địa chỉ công trình" htmlFor="site_address" error={errors.site_address?.message}>
              <input id="site_address" className={inputClass} aria-invalid={!!errors.site_address} {...register("site_address", { required: "Nhập địa chỉ công trình." })} />
            </Field>
          </div>
          <Field label="Ngày muốn nhận hàng" htmlFor="desired_date" error={errors.desired_date?.message}>
            <input id="desired_date" type="date" min={today()} className={inputClass} aria-invalid={!!errors.desired_date}
              {...register("desired_date", { required: "Chọn ngày giao mong muốn.", validate: (v) => v >= today() || "Ngày giao không thể ở quá khứ." })} />
          </Field>
          <Field label="File đính kèm (Excel hoặc PDF)" htmlFor="attachment" error={fileError} hint={file ? `Đã chọn: ${file.name}` : "Tối đa 10 MB."}>
            <input id="attachment" type="file" accept=".xlsx,.xls,.pdf" onChange={onFile} className="block w-full text-sm" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Ghi chú" htmlFor="note"><textarea id="note" rows="3" className={inputClass} {...register("note")} /></Field>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 border border-steel-200 bg-white p-6 sm:grid-cols-2">
          <legend className="px-2 text-h3">Thông tin liên hệ</legend>
          <Field label="Họ và tên" htmlFor="contact_name" error={errors.contact_name?.message}>
            <input id="contact_name" className={inputClass} aria-invalid={!!errors.contact_name} {...register("contact_name", { required: "Nhập họ và tên." })} />
          </Field>
          <Field label="Số điện thoại" htmlFor="q_phone" error={errors.phone?.message}>
            <input id="q_phone" inputMode="tel" className={inputClass} aria-invalid={!!errors.phone} {...register("phone", { required: "Nhập số điện thoại.", pattern: { value: PHONE, message: "Số điện thoại không hợp lệ." } })} />
          </Field>
          <Field label="Email" htmlFor="q_email" error={errors.email?.message}>
            <input id="q_email" type="email" className={inputClass} aria-invalid={!!errors.email} {...register("email", { required: "Nhập email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ." } })} />
          </Field>
          <Field label="Công ty / đơn vị thi công (nếu có)" htmlFor="company"><input id="company" className={inputClass} {...register("company")} /></Field>
        </fieldset>

        {submitError && <p role="alert" className="border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger">{submitError}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang gửi…" : "Gửi yêu cầu báo giá"}</Button>
          {!user && <p className="text-sm text-steel-500"><Link className="font-semibold underline" to="/dang-nhap?next=/bao-gia">Đăng nhập</Link> để theo dõi yêu cầu sau này.</p>}
        </div>
      </form>
    </div>
  );
}
