# Kiến trúc hệ thống AN THỊNH PHÁT (Giai đoạn 1)

## 1. Phân tích nghiệp vụ

Ba nhóm khách và một nhóm vận hành quyết định toàn bộ thiết kế:

| Nhóm | Cần gì | Hệ quả kỹ thuật |
|---|---|---|
| Khách lẻ | Xem giá lẻ, mua, theo dõi đơn | Đơn hàng `sales_orders`, thanh toán COD/chuyển khoản |
| Khách sỉ / đại lý | Giá sỉ, chiết khấu, báo giá riêng | `wholesale_status` được Admin duyệt; giá sỉ chỉ trả về từ API khi `can_view_wholesale_price()` đúng |
| Chủ công trình | Báo giá nhiều hạng mục, đính kèm Excel/PDF | `quotations` + `quotation_items`, xuất PDF bằng ReportLab |
| Nội bộ (4 vai trò) | Quản lý hàng, kho, đơn, báo giá | Role-based permission trên API; kho dùng transaction + khóa dòng |

Hai rủi ro nghiệp vụ lớn nhất, xử lý từ đầu:

1. **Lộ giá sỉ.** Serializer của sản phẩm sẽ chỉ thêm trường giá sỉ khi `can_view_wholesale_price(request.user)`. Frontend không bao giờ nhận dữ liệu này nếu không đủ quyền. (Đã có hàm và test ở `accounts/`.)
2. **Bán vượt tồn kho.** Khi đặt hàng: `transaction.atomic()` + `select_for_update()` trên dòng `inventory`, trừ kho và tạo `inventory_transactions` trong cùng giao dịch. (Cài đặt ở Giai đoạn 4.)

## 2. Kiến trúc

```
Trình duyệt ── React (Vite, Tailwind, Router, Axios)
                 │  HTTPS, JSON, Bearer JWT
              Django REST Framework  (/api/v1/…)
                 │  Django ORM, transaction.atomic()
              PostgreSQL 16     Cloudinary/S3 (ảnh, file báo giá)
```

- Frontend và backend tách riêng, giao tiếp hoàn toàn qua `/api/v1`.
- Mỗi app Django là một miền nghiệp vụ: `accounts`, `catalog`, `orders`, `quotations`, `inventory`, `suppliers`, `promotions`; `common` giữ lớp dùng chung.
- Quyền mặc định của DRF là `IsAuthenticated`; view công khai phải khai báo `AllowAny`. Quên khai báo sẽ đóng, không mở.
- JWT: access 30 phút, refresh 7 ngày, xoay vòng và đưa vào blacklist; đăng nhập giới hạn 10 lần/phút.

## 3. Bảng dữ liệu theo app

| App | Bảng |
|---|---|
| accounts | users, customer_profiles, customer_groups |
| catalog | categories, brands, products, product_images, product_prices, reviews |
| inventory | warehouses, inventory, inventory_transactions |
| suppliers | suppliers, purchase_orders, purchase_order_items |
| orders | sales_orders, order_items, payments, shipping_addresses |
| quotations | quotations, quotation_items |
| promotions | promotions |
| common | notifications, audit_logs |

Đã tạo model: `users`, `customer_profiles`, `customer_groups`. Các bảng còn lại làm ở Giai đoạn 3.

## 4. Design System

Ý tưởng: **bản vẽ công trình**. Góc vuông (bo 2px), lưới, dấu góc như khung bản vẽ. Điểm nhấn duy nhất là hàng gạch xây lệch nửa viên ở hero.

| Token | Giá trị | Dùng cho |
|---|---|---|
| brand-500 | #E99A24 | Nút chính, điểm nhấn |
| steel-900 | #25282C | Chữ, header, nền khối đậm |
| gold | #D5A64A | Vòng focus, chi tiết logo |
| paper | #F8F9FA | Nền trang |
| white | #FFFFFF | Thẻ, ô nhập |

- Chữ: Be Vietnam Pro (thiết kế cho tiếng Việt), 400–800. Giá dùng chữ số đều (`tabular-nums`).
- Nút chính dùng **chữ than trên nền cam**, vì chữ trắng trên #E99A24 chỉ đạt tương phản khoảng 2:1.
- Chuyển động chỉ khi người dùng thao tác (hover, mở menu); tôn trọng `prefers-reduced-motion`.
- Xem trực tiếp tại `/thiet-ke` khi chạy frontend.

## 5. Quyết định lệch so với đề bài

- **Vite thay cho Create React App**, và entry là `src/main.jsx` thay vì `index.js` (CRA đã ngừng phát triển).
- **JWT lưu ở localStorage** để đơn giản ở giai đoạn đầu; rủi ro là XSS đọc được token. Có thể chuyển sang cookie httpOnly ở Giai đoạn 3 nếu muốn chặt hơn.
- **Ảnh**: dev lưu local (`backend/media`); Cloudinary sẽ nối khi có `CLOUDINARY_URL`.

## 6. Backend (Giai đoạn 3-5)

- Mỗi app có `models.py`, `serializers.py`, `views.py` (API cho khách) và `admin_api.py` (API quản trị, gắn vào `/api/v1/manage/`).
- **Giá sỉ**: `catalog/serializers.py` chỉ thêm `wholesale_price` khi `can_view_wholesale_price(user)`. Giá thật của mỗi dòng đơn do `catalog/pricing.unit_price()` tính ở backend; client có gửi giá cũng bị bỏ qua.
- **Đặt hàng** (`orders/services.place_order`): một `transaction.atomic()` gồm kiểm tra sản phẩm, tính giá, mã giảm giá, phí ship, trừ kho từng sản phẩm (theo thứ tự id để tránh deadlock) và tạo đơn. Thiếu hàng ở bất kỳ dòng nào thì toàn bộ bị hủy, kể cả lượt dùng mã.
- **Kho** (`inventory/services.py`): khóa dòng bằng `select_for_update()` (có tác dụng trên PostgreSQL), ràng buộc CHECK `quantity >= 0` ở database, mọi biến động ghi vào `inventory_transactions`. Giá vốn bình quân gia quyền cập nhật khi nhập hàng.
- **Báo giá**: file khách gửi lưu ở `PRIVATE_MEDIA_ROOT` (không có URL công khai), kiểm tra đuôi, dung lượng và chữ ký nội dung; chỉ nhân viên tải qua API. PDF bằng ReportLab với font DejaVu (có đủ dấu tiếng Việt).
- **Nhật ký** (`audit_logs`): đổi trạng thái đơn, duyệt khách sỉ, điều chỉnh kho, gửi báo giá, sửa cấu hình.
- **Giới hạn tần suất**: đăng nhập 10/phút, đăng ký 5/phút, gửi báo giá 10/giờ, khách ẩn danh 60/phút.

## 7. Giai đoạn 2: lớp dữ liệu giao diện

- Mọi trang gọi qua `services/catalogService.js` và `services/orderService.js`. Với `VITE_USE_MOCK=true` chúng đọc `services/mockApi.js`, ngược lại gọi `/api/v1`.
- Tên trường của dữ liệu mẫu trùng với serializer Django, nên chuyển chế độ không phải sửa trang.
- `utils/pricing.js` chỉ ước tính tổng tiền trong giỏ; số tiền chính thức luôn do backend trả về khi đặt hàng.

## 8. Kiểm thử

- Backend: `accounts`, `catalog`, `inventory`, `orders`, `quotations` (hơn 100 test): quyền xem giá sỉ, tìm kiếm không dấu, nhập/xuất/kiểm kê, chống bán vượt tồn, mã giảm giá, chuyển trạng thái đơn, upload giả mạo, phân quyền theo vai trò.
- Frontend: `vitest` cho định dạng tiền, giá, giỏ hàng, quyền, chuyển hướng an toàn, vai trò quản trị.
- Chưa có: kiểm thử đồng thời nhiều người đặt cùng lúc trên PostgreSQL thật, và kiểm thử giao diện trên trình duyệt (Playwright/Cypress).
