# AN THỊNH PHÁT – Nền tảng thương mại điện tử vật liệu xây dựng

ReactJS (Vite, Tailwind) + Django REST Framework + JWT. Dev dùng SQLite, triển khai dùng PostgreSQL.
Kiến trúc và quyết định thiết kế: `docs/ARCHITECTURE.md`.

## Chạy thử trên máy (Windows PowerShell)

Cần Python 3.11+ và Node.js 20+.

```powershell
copy .env.example .env          # DB_ENGINE=sqlite, DJANGO_DEBUG=True là đủ để thử

# --- Backend ---
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations accounts common catalog inventory suppliers promotions orders quotations
python manage.py migrate
python manage.py seed_demo          # nạp 15 sản phẩm mẫu, 1 kho, mã ATP5
python manage.py createsuperuser    # tạo tài khoản quản trị đầu tiên
python manage.py test               # chạy bộ kiểm thử backend
python manage.py runserver          # http://localhost:8000

# --- Frontend (cửa sổ PowerShell khác) ---
cd frontend
npm install
npm test
npm run dev                         # http://localhost:5173
```

Nâng cấp từ bản Giai đoạn 1-2: hãy **xóa file `backend\db.sqlite3` cũ** (chỉ có tài khoản thử) rồi chạy lại các lệnh trên.

Sau `createsuperuser`: vào `http://localhost:8000/quan-tri-django/`, mở người dùng đó và đặt **Vai trò = Super Admin**.
Từ đó đăng nhập website bằng tài khoản này và bấm **Quản trị** trên đầu trang (`/quan-tri`).

### Thử luồng khách sỉ
1. Đăng ký ở `/dang-ky?type=wholesale` (tài khoản ở trạng thái **chờ duyệt**, chưa thấy giá sỉ).
2. Đăng nhập tài khoản Super Admin, vào **Quản trị > Khách hàng và khách sỉ**, bấm **Duyệt**.
3. Đăng nhập lại tài khoản sỉ: giá sỉ hiện ra, và áp dụng khi số lượng đạt mức tối thiểu.

### Chỉ xem giao diện, không cần backend
Đặt `VITE_USE_MOCK=true` trong `.env` (dữ liệu mẫu, đơn hàng lưu trong trình duyệt). Đăng nhập/đăng ký vẫn cần backend.

## Vai trò và quyền

| Vai trò | Được làm |
|---|---|
| Super Admin | Mọi thứ, gồm nhân viên và phân quyền |
| Quản lý | Sản phẩm, giá, duyệt khách sỉ, khuyến mãi, kho, báo giá, cấu hình, thống kê |
| Nhân viên bán hàng | Xem sản phẩm (không thấy giá vốn), đơn hàng, báo giá, khách hàng |
| Nhân viên kho | Nhập, xuất, kiểm kê, nhà cung cấp; xem đơn hàng |

Mọi API kiểm tra vai trò ở backend (`accounts/permissions.py`); ẩn menu ở giao diện chỉ để tiện dùng.

## Các API chính (`/api/v1`)

- Công khai: `products/`, `products/<slug>/`, `categories/`, `brands/`, `site-config/`, `promotions/validate/`, `quotations/` (POST), `auth/register/`, `auth/token/`
- Cần đăng nhập: `orders/`, `orders/<mã>/cancel/`, `quotations/`, `accounts/me/`, `addresses/`, `notifications/`
- Quản trị `manage/…`: dashboard, products, categories, brands, orders (+`set-status`, `mark-paid`), customers (+`approve`, `reject`), inventory (+`receive`, `issue`, `adjust`, `low-stock`), suppliers, purchase-orders (+`receive`), quotations (+`send`, `pdf`, `attachment`), promotions, staff, site-config
- Ngoài API: `sitemap.xml`, `robots.txt`

## Triển khai thật (Giai đoạn 7)

1. Một máy chủ Linux có Docker, một tên miền, và HTTPS (Cloudflare, hoặc Caddy/certbot đứng trước nginx).
2. Sao chép dự án lên máy chủ, tạo `.env` từ `.env.example` và đặt:
   `DJANGO_DEBUG=False`, `DJANGO_SECRET_KEY` (chuỗi ngẫu nhiên dài), `DJANGO_ALLOWED_HOSTS=tenmien.vn`,
   `CORS_ALLOWED_ORIGINS` và `CSRF_TRUSTED_ORIGINS` = `https://tenmien.vn`, `FRONTEND_URL=https://tenmien.vn`,
   `POSTGRES_PASSWORD` mạnh. (`DB_ENGINE` và `POSTGRES_HOST` đã được compose tự đặt.)
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. Tạo admin: `docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser`, rồi đặt vai trò Super Admin trong `/quan-tri-django/`.
5. Vào **Quản trị > Cấu hình website** nhập hotline, Zalo, Messenger, địa chỉ, thông tin chuyển khoản, phí vận chuyển.
6. Sao lưu hằng ngày: `scripts/backup.sh` (cron), và **sao chép thư mục `backups/` ra ngoài máy chủ**. Khôi phục: `gunzip -c backups/db-NGÀY.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U <user> <db>`.
7. Khai báo `https://tenmien.vn/sitemap.xml` trong Google Search Console; điền `VITE_GA_ID` để bật Google Analytics (cần build lại frontend).

Lưu ý khi chạy thử HTTP (chưa có HTTPS): đặt `DJANGO_SSL_REDIRECT=False`, và bật lại khi đã có HTTPS.

## Những gì CHƯA có hoặc cần bạn quyết định

- Cổng thanh toán online (VNPay, MoMo…): chưa tích hợp vì cần tài khoản merchant. Hiện có COD và chuyển khoản.
- Zalo OA chat widget và Messenger chat plugin: mới có liên kết (cấu hình trong Admin), chưa nhúng khung chat.
- Quản lý nội dung (banner, tin tức), mục Đánh giá khách hàng và Tin tức trên trang chủ: chưa làm. Đánh giá sản phẩm đã có API (chỉ người đã mua mới đánh giá được) và duyệt trong Django Admin, nhưng trang chi tiết chưa hiển thị.
- Ảnh sản phẩm lưu trên đĩa của máy chủ (volume). Cloudinary/S3 chưa nối.
- Giao diện riêng cho đơn nhập hàng (purchase orders): API đã có, thao tác bằng Django Admin; nhập kho nhanh đã có trong **Kho và tồn kho**.
- Khách hàng chưa có trang xem lại báo giá đã gửi (API `GET /quotations/<mã>/pdf/` đã có).
- Chưa gửi email/SMS thông báo; hiện chỉ có thông báo trong hệ thống.
