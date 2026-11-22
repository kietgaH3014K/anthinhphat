// Giá trị mặc định khi chưa tải được cấu hình website.
export const FREE_SHIP_FROM = 5_000_000;
export const FLAT_SHIPPING = 50_000;

/** Đơn giá áp dụng: giá sỉ nếu được xem giá sỉ và đủ số lượng tối thiểu, ngược lại giá lẻ. */
export function unitPrice(item, wholesaleAllowed) {
  const ws = item.wholesale_price;
  if (wholesaleAllowed && ws != null && item.min_wholesale_qty && item.qty >= item.min_wholesale_qty) return Number(ws);
  return Number(item.retail_price);
}

export const DEFAULT_RULE = { flat: FLAT_SHIPPING, freeFrom: FREE_SHIP_FROM };

/** rule lấy từ cấu hình website (Admin chỉnh được); chỉ là ước tính, backend mới tính phí chính thức. */
export function calcShipping(amount, rule = DEFAULT_RULE) {
  if (amount <= 0 || amount >= rule.freeFrom) return 0;
  return rule.flat;
}

export function calcTotals(items, wholesaleAllowed, discountPercent = 0, rule = DEFAULT_RULE) {
  const subtotal = items.reduce((sum, it) => sum + unitPrice(it, wholesaleAllowed) * it.qty, 0);
  const discount = Math.round((subtotal * discountPercent) / 100);
  const shipping = calcShipping(subtotal - discount, rule);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
