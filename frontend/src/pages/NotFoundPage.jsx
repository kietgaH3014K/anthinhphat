import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-page px-4 py-24">
      <h1 className="text-h1">Không tìm thấy trang</h1>
      <p className="mt-4 text-steel-500">Đường dẫn có thể đã thay đổi hoặc nhập sai.</p>
      <Button to="/san-pham" className="mt-8">Xem sản phẩm</Button>
    </section>
  );
}
