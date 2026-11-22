import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { safeNext } from "../utils/errors";

export default function LoginPage() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  if (user) return <Navigate to={next} replace />;

  const onSubmit = async ({ email, password }) => {
    setError("");
    try { await login(email.trim().toLowerCase(), password); navigate(next, { replace: true }); }
    catch (err) {
      if (err.response?.status === 401) setError("Email hoặc mật khẩu không đúng.");
      else if (err.response?.status === 429) setError("Bạn thử quá nhiều lần. Hãy đợi một phút rồi đăng nhập lại.");
      else setError("Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-h1">Đăng nhập</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5 border border-steel-200 bg-white p-6">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input id="email" type="email" autoComplete="email" className={inputClass} aria-invalid={!!errors.email} {...register("email", { required: "Nhập email." })} />
        </Field>
        <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
          <input id="password" type="password" autoComplete="current-password" className={inputClass} aria-invalid={!!errors.password} {...register("password", { required: "Nhập mật khẩu." })} />
        </Field>
        {error && <p role="alert" className="border-l-4 border-danger bg-[#F6E1DE] p-3 text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
      </form>
      <p className="mt-5 text-sm text-steel-500">Chưa có tài khoản? <Link to="/dang-ky" className="font-bold text-steel-900 underline">Đăng ký</Link></p>
    </div>
  );
}
