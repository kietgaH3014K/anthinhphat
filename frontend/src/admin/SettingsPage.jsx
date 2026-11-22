import { useState } from "react";
import { useForm } from "react-hook-form";
import Field, { inputClass } from "../components/FormField";
import Button from "../components/ui/Button";
import { Loading } from "../components/ui/State";
import useFetch from "../hooks/useFetch";
import api from "../services/api";
import { apiErrorMessage } from "../utils/errors";

export default function SettingsPage() {
  const { data, loading } = useFetch(() => api.get("/manage/site-config/").then((r) => r.data), []);
  if (loading) return <Loading />;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: initial });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const onSubmit = async (v) => {
    setMsg({ type: "", text: "" });
    try {
      await api.patch("/manage/site-config/", { ...v, shipping_flat_fee: Number(v.shipping_flat_fee), free_ship_from: Number(v.free_ship_from) });
      setMsg({ type: "ok", text: "Đã lưu. Website cập nhật ngay khi tải lại trang." });
    } catch (err) { setMsg({ type: "error", text: apiErrorMessage(err, "Không lưu được.") }); }
  };
  return (
    <div>
      <h1 className="text-h2">Cấu hình website</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 grid max-w-3xl gap-4 border border-steel-200 bg-white p-6 sm:grid-cols-2">
        <Field label="Tên công ty" htmlFor="s-name"><input id="s-name" className={inputClass} {...register("company_name")} /></Field>
        <Field label="Hotline" htmlFor="s-hot"><input id="s-hot" className={inputClass} {...register("hotline")} /></Field>
        <Field label="Liên kết Zalo" htmlFor="s-zalo" hint="Ví dụ https://zalo.me/số-điện-thoại"><input id="s-zalo" type="url" className={inputClass} {...register("zalo_url")} /></Field>
        <Field label="Liên kết Messenger" htmlFor="s-msg" hint="Ví dụ https://m.me/tên-trang"><input id="s-msg" type="url" className={inputClass} {...register("messenger_url")} /></Field>
        <div className="sm:col-span-2"><Field label="Địa chỉ" htmlFor="s-addr"><input id="s-addr" className={inputClass} {...register("address")} /></Field></div>
        <div className="sm:col-span-2"><Field label="Thông tin chuyển khoản" htmlFor="s-bank" hint="Hiển thị cho khách chọn chuyển khoản sau khi đặt hàng. Ví dụ: Ngân hàng, số tài khoản, chủ tài khoản."><textarea id="s-bank" rows="4" className={inputClass} {...register("bank_info")} /></Field></div>
        <Field label="Phí vận chuyển cố định (VNĐ)" htmlFor="s-ship"><input id="s-ship" type="number" min="0" className={inputClass} {...register("shipping_flat_fee")} /></Field>
        <Field label="Miễn phí vận chuyển từ (VNĐ)" htmlFor="s-free"><input id="s-free" type="number" min="0" className={inputClass} {...register("free_ship_from")} /></Field>
        {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`p-3 text-sm sm:col-span-2 ${msg.type === "error" ? "border-l-4 border-danger bg-[#F6E1DE] text-danger" : "border-l-4 border-ok bg-[#E3F1E8] text-ok"}`}>{msg.text}</p>}
        <div className="sm:col-span-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu…" : "Lưu cấu hình"}</Button></div>
      </form>
    </div>
  );
}
