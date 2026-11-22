import Button from "../components/ui/Button";
import { useSiteConfig } from "../context/SiteConfigContext";
import usePageMeta from "../hooks/usePageMeta";

export default function ContactPage() {
  const { hotline, zalo_url: zalo, messenger_url: messenger, address } = useSiteConfig();
  usePageMeta({ title: "Liên hệ", description: "Liên hệ AN THỊNH PHÁT: hotline, Zalo, Messenger. Cung cấp vật liệu xây dựng tại TP.HCM." });
  const Row = ({ label, children }) => (
    <div className="flex justify-between gap-4 p-4"><dt className="font-semibold">{label}</dt><dd>{children || <span className="text-steel-500">Đang cập nhật</span>}</dd></div>
  );
  const link = (href, text) => <a className="font-bold text-brand-700 underline" href={href} target="_blank" rel="noopener noreferrer">{text}</a>;
  return (
    <div className="mx-auto max-w-page px-4 py-16">
      <h1 className="text-h1">Liên hệ</h1>
      <p className="mt-3 max-w-xl text-steel-500">Khu vực phục vụ: TP. Hồ Chí Minh.</p>
      <dl className="mt-10 max-w-xl divide-y divide-steel-200 border border-steel-200 bg-white">
        <Row label="Hotline">{hotline && <a className="font-bold text-brand-700 underline" href={`tel:${hotline.replace(/\s/g, "")}`}>{hotline}</a>}</Row>
        <Row label="Zalo">{zalo && link(zalo, "Nhắn tin Zalo")}</Row>
        <Row label="Messenger">{messenger && link(messenger, "Nhắn tin Messenger")}</Row>
        <Row label="Địa chỉ">{address}</Row>
      </dl>
      <p className="mt-8 max-w-xl text-sm text-steel-500">Cần giá cho công trình? Gửi danh sách vật liệu để được báo giá riêng.</p>
      <Button to="/bao-gia" className="mt-4">Gửi yêu cầu báo giá</Button>
    </div>
  );
}
