import Button from "../components/ui/Button";
import usePageMeta from "../hooks/usePageMeta";

export default function AboutPage() {
  usePageMeta({ title: "Giới thiệu" });
  return (
    <div className="mx-auto max-w-page px-4 py-16">
      <h1 className="text-h1">Giới thiệu An Thịnh Phát</h1>
      <p className="mt-4 max-w-2xl text-xl font-semibold leading-snug">Chất lượng tạo niềm tin, đồng hành cùng mọi công trình.</p>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <p className="max-w-prose leading-relaxed text-steel-700">
          AN THỊNH PHÁT kinh doanh vật liệu xây dựng tại TP. Hồ Chí Minh, từ xi măng, sắt thép, gạch, cát, đá đến sơn, chống thấm,
          thiết bị vệ sinh và vật liệu hoàn thiện.
        </p>
        <ul className="space-y-4">
          {[
            ["Bán lẻ", "Dành cho khách hàng cá nhân sửa chữa, xây dựng nhà ở."],
            ["Bán sỉ", "Dành cho đại lý và cửa hàng, có giá và chiết khấu riêng sau khi được duyệt."],
            ["Cung cấp công trình", "Giao vật liệu theo tiến độ cho công trình dân dụng đến dự án lớn."],
            ["Báo giá số lượng lớn", "Nhận danh sách vật liệu và gửi báo giá riêng."],
          ].map(([t, d]) => (
            <li key={t} className="border-l-4 border-gold pl-4"><p className="font-bold">{t}</p><p className="text-sm text-steel-500">{d}</p></li>
          ))}
        </ul>
      </div>
      <div className="mt-12 flex gap-4"><Button to="/san-pham">Xem sản phẩm</Button><Button to="/bao-gia" variant="outline">Yêu cầu báo giá</Button></div>
    </div>
  );
}
