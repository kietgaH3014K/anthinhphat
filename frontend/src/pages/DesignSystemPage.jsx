import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { formatVND } from "../utils/format";

const COLORS = [
  ["Cam vàng", "#E99A24", "brand-500 – nút chính, điểm nhấn"],
  ["Xám than", "#25282C", "steel-900 – chữ, header, nền khối"],
  ["Vàng kim", "#D5A64A", "gold – viền, vòng focus, chi tiết logo"],
  ["Nền sáng", "#F8F9FA", "paper – nền trang"],
  ["Trắng", "#FFFFFF", "thẻ, ô nhập"],
];

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-page space-y-16 px-4 py-16">
      <header>
        <h1 className="text-h1">Design System</h1>
        <p className="mt-3 max-w-2xl text-steel-500">
          Ngôn ngữ thiết kế lấy từ bản vẽ công trình: góc vuông, lưới, dấu góc khung bản vẽ. Chỉ một điểm nhấn lớn ở mỗi trang.
        </p>
      </header>

      <section aria-labelledby="ds-color">
        <h2 id="ds-color" className="text-h2">Màu sắc</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLORS.map(([name, hex, use]) => (
            <li key={hex} className="border border-steel-200 bg-white">
              <div className="h-20 border-b border-steel-200" style={{ background: hex }} />
              <div className="p-3 text-sm"><p className="font-bold">{name}</p><p className="text-steel-500">{hex}</p><p className="mt-1 text-xs text-steel-500">{use}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ds-type">
        <h2 id="ds-type" className="text-h2">Chữ</h2>
        <div className="mt-6 space-y-3">
          <p className="text-display">Hiển thị</p>
          <p className="text-h1">Tiêu đề 1</p>
          <p className="text-h2">Tiêu đề 2</p>
          <p className="text-h3">Tiêu đề 3</p>
          <p className="max-w-prose">Nội dung: Be Vietnam Pro, hỗ trợ đầy đủ dấu tiếng Việt. Độ dài dòng giữ dưới 80 ký tự.</p>
        </div>
      </section>

      <section aria-labelledby="ds-ui">
        <h2 id="ds-ui" className="text-h2">Thành phần</h2>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button>Thêm vào giỏ</Button>
          <Button variant="dark">Đặt hàng</Button>
          <Button variant="outline">Xem chi tiết</Button>
          <Button disabled>Hết hàng</Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge>Còn hàng</Badge><Badge tone="sale">Khuyến mãi</Badge><Badge tone="ok">Đã duyệt</Badge><Badge tone="danger">Sắp hết</Badge>
        </div>
        <div className="corner-marks mt-8 max-w-xs border border-steel-200 bg-white p-5">
          <p className="text-sm text-steel-500">Giá bán lẻ</p>
          <p className="price text-2xl">{formatVND(92000)}</p>
          <p className="mt-3 text-sm text-steel-500">Giá sỉ</p>
          <p className="price text-lg">{formatVND(null)}</p>
          <p className="mt-2 text-xs text-steel-500">Giá sỉ chỉ hiện sau khi tài khoản được duyệt.</p>
        </div>
      </section>
    </div>
  );
}
