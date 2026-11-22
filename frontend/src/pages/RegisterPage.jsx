import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { apiErrorMessage } from "../utils/errors";

const PHONE = /^(0|\+84)\d{9}$/;

export default function RegisterPage() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { account_type: params.get("type") === "wholesale" ? "wholesale" : "personal" },
  });
  const wholesale = watch("account_type") === "wholesale";

  if (user) return <Navigate to="/tai-khoan" replace />;

  const onSubmit = async ({ confirm, ...values }) => {
    setError("");
    try {
      const payload = { ...values, email: values.email.trim().toLowerCase() };
      if (!wholesale) { delete payload.company_name; delete payload.tax_code; }
      await api.post("/auth/register/", payload);
      await login(payload.email, values.password);
      navigate("/tai-khoan", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Không đăng ký được. Vui lòng thử lại."));
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-h1">Đăng ký tài khoản</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5 border border-steel-200 bg-white p-6">
        <fieldset className="flex flex-wrap gap-6 text-sm font-semibold">
          <legend className="sr-only">Loại tài khoản</legend>
          <label className="flex items-center gap-2"><input type="radio" value="personal" {...register("account_type")} /> Khách hàng cá nhân</label>
          <label className="flex items-center gap-2"><input type="radio" value="wholesale" {...register("account_type")} /> Doanh nghiệp / đại lý (mua sỉ)</label>
        </fieldset>

        <Field label="Họ và tên" htmlFor="full_name" error={errors.full_name?.message}>
          <input id="full_name" autoComplete="name" className={inputClass} aria-invalid={!!errors.full_name} {...register("full_name", { required: "Nhập họ và tên." })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" inputMode="tel" autoComplete="tel" className={inputClass} aria-invalid={!!errors.phone} {...register("phone", { required: "Nhập số điện thoại.", pattern: { value: PHONE, message: "Số điện thoại không hợp lệ (ví dụ 0901234567)." } })} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} {...register("email", { required: "Nhập email.", pattern: { value: /^\S+@\S+\.\S+$/, message: "Email không hợp lệ." } })} />
          </Field>
        </div>

        {wholesale && (
          <div className="space-y-5 border-l-4 border-gold bg-paper p-4">
            <Field label="Tên công ty / cửa hàng" htmlFor="company_name" error={errors.company_name?.message}>
              <input id="company_name" className={inputClass} aria-invalid={!!errors.company_name} {...register("company_name", { required: "Khách sỉ cần nhập tên công ty." })} />
            </Field>
            <Field label="Mã số thuế (nếu có)" htmlFor="tax_code"><input id="tax_code" className={inputClass} {...register("tax_code")} /></Field>
            <p className="text-xs text-steel-500">Sau khi đăng ký, tài khoản ở trạng thái chờ duyệt. Bạn xem được giá sỉ khi Admin phê duyệt.</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message} hint="Ít nhất 8 ký tự, không toàn số.">
            <input id="password" type="password" autoComplete="new-password" className={inputClass} aria-invalid={!!errors.password}
              {...register("password", { required: "Nhập mật khẩu.", minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự." } })} />
          </Field>
          <Field label="Nhập lại mật khẩu" htmlFor="confirm" error={errors.confirm?.message}>
            <input id="confirm" type="password" autoComplete="new-password" className={inputClass} aria-invalid={!!errors.confirm}
              {...register("confirm", { validate: (v, form) => v === form.password || "Mật khẩu nhập lại không khớp." })} />
          </Field>
        </div>

        {error && <p role="alert" className="border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</Button>
      </form>
      <p className="mt-5 text-sm text-steel-500">Đã có tài khoản? <Link to="/dang-nhap" className="font-bold text-steel-900 underline">Đăng nhập</Link></p>
    </div>
  );
}
