import { Link } from "react-router-dom";
import ProductRow from "../components/ProductRow";
import Button from "../components/ui/Button";
import useFetch from "../hooks/useFetch";
import usePageMeta from "../hooks/usePageMeta";
import { listBrands, listCategories } from "../services/catalogService";

const REASONS = [
  ["Giá sỉ rõ ràng", "Đại lý và cửa hàng được duyệt xem giá sỉ và chính sách chiết khấu riêng."],
  ["Báo giá cho công trình", "Gửi danh sách vật liệu, nhận báo giá riêng theo số lượng và địa điểm giao."],
  ["Tồn kho minh bạch", "Số lượng còn hàng hiển thị ngay trên từng sản phẩm trước khi bạn đặt."],
  ["Giao hàng khu vực TP.HCM", "Đặt hàng trực tuyến, theo dõi trạng thái đơn trong tài khoản của bạn."],
];

export default function HomePage() {
  usePageMeta({});
  const categories = useFetch(listCategories, []);
  const brands = useFetch(listBrands, []);

  return (
    <>
      <section className="blueprint-grid relative overflow-hidden bg-steel-900 text-white">
        <div className="mx-auto grid max-w-page items-center gap-12 px-4 py-20 lg:grid-cols-[1.25fr_1fr] lg:py-28">
          <div>
            <h1 className="text-display">GIẢI PHÁP VẬT LIỆU XÂY DỰNG TOÀN DIỆN</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-200">
              Cung cấp vật liệu xây dựng chất lượng, giá cả cạnh tranh, phục vụ từ công trình dân dụng đến dự án quy mô lớn.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button to="/san-pham">KHÁM PHÁ SẢN PHẨM</Button>
              <Button to="/bao-gia" variant="outlineLight">NHẬN BÁO GIÁ NGAY</Button>
            </div>
          </div>
          <div aria-hidden="true" className="hidden lg:block">
            <div className="brick-courses ml-auto h-80 w-full max-w-sm bg-brand-500" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 pt-20" aria-labelledby="home-categories">
        <h2 id="home-categories" className="text-h2">Danh mục nổi bật</h2>
        <ul className="mt-6 grid gap-px border border-steel-200 bg-steel-200 sm:grid-cols-2 lg:grid-cols-4">
          {(categories.data || []).slice(0, 8).map((c) => (
            <li key={c.slug} className="bg-white">
              <Link to={`/san-pham?category=${c.slug}`} className="block border-l-4 border-transparent px-5 py-5 font-bold transition-colors hover:border-brand-500 hover:bg-brand-50">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/san-pham" className="mt-4 inline-block text-sm font-bold hover:text-brand-600">Xem tất cả danh mục</Link>
      </section>

      <ProductRow title="Sản phẩm bán chạy" flag="best_seller" />
      <ProductRow title="Sản phẩm mới" flag="new" />
      <ProductRow title="Sản phẩm khuyến mãi" flag="on_sale" />

      <section className="mx-auto mt-24 grid max-w-page gap-0 px-4 lg:grid-cols-[1fr_2fr]" aria-labelledby="home-wholesale">
        <div className="bg-brand-500 p-8 text-steel-900 lg:p-10">
          <h2 id="home-wholesale" className="text-h2">Dành cho khách mua sỉ</h2>
        </div>
        <div className="bg-steel-900 p-8 text-white lg:p-10">
          <p className="max-w-xl leading-relaxed text-steel-200">
            Đại lý, cửa hàng và nhà thầu đăng ký tài khoản doanh nghiệp. Sau khi Admin duyệt, bạn xem được giá bán sỉ,
            nhận chính sách chiết khấu và đặt hàng số lượng lớn.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button to="/dang-ky?type=wholesale">Đăng ký tài khoản sỉ</Button>
            <Button to="/dang-nhap" variant="outlineLight">Đã có tài khoản</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 pt-24" aria-labelledby="home-project">
        <div className="grid gap-8 border-y-2 border-steel-900 py-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 id="home-project" className="text-h1">Cung cấp vật liệu cho công trình</h2>
            <p className="mt-4 max-w-xl text-steel-500">
              Nhập danh sách vật liệu, địa chỉ công trình và ngày cần giao. Bạn có thể đính kèm file Excel hoặc PDF;
              chúng tôi gửi lại báo giá riêng cho từng hạng mục.
            </p>
          </div>
          <div className="lg:text-right"><Button to="/bao-gia" variant="dark">Gửi yêu cầu báo giá</Button></div>
        </div>
      </section>

      <section className="mx-auto max-w-page px-4 pt-24" aria-labelledby="home-why">
        <h2 id="home-why" className="text-h2">Vì sao chọn An Thịnh Phát</h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(([title, text]) => (
            <div key={title} className="border-l-4 border-gold pl-4">
              <dt className="font-bold">{title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-steel-500">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {brands.data?.length > 0 && (
        <section className="mx-auto max-w-page px-4 pt-24" aria-labelledby="home-brands">
          <h2 id="home-brands" className="text-h3">Thương hiệu có tại An Thịnh Phát</h2>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-lg font-bold text-steel-500">
            {brands.data.map((b) => <li key={b}><Link to={`/san-pham?brand=${encodeURIComponent(b)}`} className="hover:text-brand-600">{b}</Link></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
