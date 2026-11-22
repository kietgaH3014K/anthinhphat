import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatVND } from "../utils/format";

/** Hiện giá sỉ chỉ khi API đã trả về giá sỉ (tức backend cho phép). Không tự suy luận quyền ở đây. */
export default function PriceBlock({ product, large = false }) {
  const { user } = useAuth();
  const hasWholesale = product.wholesale_price != null;
  return (
    <div>
      {product.compare_at_price && (
        <p className="text-sm text-steel-500 line-through">{formatVND(product.compare_at_price)}</p>
      )}
      <p className={`price ${large ? "text-3xl" : "text-lg"}`}>
        {formatVND(product.retail_price)}
        <span className="ml-1 text-sm font-medium text-steel-500">/{product.unit}</span>
      </p>
      {hasWholesale ? (
        <p className="mt-1 text-sm">
          Giá sỉ <strong className="price text-brand-700">{formatVND(product.wholesale_price)}</strong>
          <span className="text-steel-500"> từ {product.min_wholesale_qty} {product.unit}</span>
        </p>
      ) : user?.wholesale_status === "pending" ? (
        <p className="mt-1 text-xs text-steel-500">Tài khoản sỉ đang chờ duyệt để xem giá sỉ.</p>
      ) : (
        <p className="mt-1 text-xs text-steel-500">
          <Link className="font-semibold underline hover:text-brand-600" to="/dang-ky?type=wholesale">Đăng ký khách sỉ</Link> để xem giá sỉ.
        </p>
      )}
    </div>
  );
}
