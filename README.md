# Marseille04 Shop

Marseille04 Shop là web bán hàng thời trang full-stack gồm React client, Express API và MongoDB. Dự án hỗ trợ mua hàng, quản lý giỏ hàng, đánh giá sản phẩm kèm ảnh, lịch sử đơn hàng, sổ địa chỉ giao hàng, realtime notification, quản lý kho hàng, upload ảnh sản phẩm/review/avatar, đa ngôn ngữ Việt/Anh, Docker và CI/CD Docker Hub.

## Công nghệ

Client:

- React 18, TypeScript/TSX, Vite 5
- Redux Toolkit, React Redux
- React Router
- Lucide React
- Tailwind CSS, Headless UI, React Hook Form, Zod
- TanStack Table cho bảng quản trị responsive
- Recharts cho biểu đồ thống kê
- Nginx khi chạy production bằng Docker

Server:

- Node.js, Express
- MongoDB, Mongoose
- JWT authentication
- Mã hóa mật khẩu phía client bằng RSA-OAEP trước khi gửi server
- Realtime notification bằng Server-Sent Events (SSE)
- Password hash bằng PBKDF2 từ Node `crypto`
- CORS, dotenv
- Upload ảnh sản phẩm vào `/uploads/products`
- Upload ảnh review vào `/uploads/reviews`
- Upload avatar người dùng vào `/uploads/avatars`

DevOps:

- Dockerfile riêng cho `client` và `server`
- `docker-compose.yml` để build local
- `docker-compose.hub.yml` để chạy từ Docker Hub
- GitHub Actions build/push Docker images tự động
- MCP server dạng `stdio` để AI client đọc dữ liệu shop từ MongoDB

Brand assets:

- Logo header: `client/public/brand/marseille04-logo-header.png` (`384x96`)
- Logo footer: `client/public/brand/marseille04-logo-footer.png` (`640x160`)
- Open Graph image: `client/public/brand/marseille04-logo-og.png` (`1200x630`)
- App/fav icon: `client/public/favicon.png`, `client/public/brand/marseille04-mark-192.png`, `client/public/brand/marseille04-mark-512.png`

## Tính năng chính

Khách hàng:

- Đăng ký, đăng nhập, JWT session
- Quên mật khẩu và đặt lại mật khẩu bằng reset token
- Trang chủ, danh mục bán chạy trong tháng
- Tìm kiếm, lọc danh mục, sắp xếp giá
- Trang shop hiển thị 10 sản phẩm mỗi trang, phân trang từ API
- URL sản phẩm dạng `/products-ten-san-pham-x<id-ma-hoa>`
- Xem chi tiết sản phẩm với ảnh chính và gallery ảnh mô tả
- Đánh giá sản phẩm kèm nhiều ảnh review, yêu cầu đăng nhập trước khi gửi
- Thêm vào giỏ có animation bay về cart, không chuyển trang
- Giỏ hàng, mua hàng, thanh toán
- Lịch sử mua hàng
- Đơn hàng phân biệt khách đã đăng ký và khách chưa đăng ký
- Hồ sơ khách hàng và nhiều địa chỉ giao hàng
- Cập nhật avatar người dùng
- Chuông thông báo realtime, phân biệt đã đọc/chưa đọc, xóa thông báo
- Nhận thông báo khi trạng thái đơn hàng hoặc yêu cầu hỗ trợ được admin cập nhật
- Trang liên hệ
- Chuyển ngôn ngữ Việt/Anh
- Responsive đa kích thước, header dạng overlay trên màn hình nhỏ

Admin:

- Chỉ tài khoản có role `admin` được vào `/admin/*`
- Dashboard tổng quan
- Thống kê theo tháng hoặc khoảng ngày
- Biểu đồ cột/list cho doanh thu, best sellers, low selling, top customers
- Quản lý đơn hàng
- Lọc đơn hàng theo khách đã đăng ký/khách chưa đăng ký
- Cập nhật trạng thái đơn hàng và gửi realtime notification cho khách hàng
- Quản lý kho hàng: mặt hàng, tồn kho, danh mục và lịch sử cập nhật kho
- Thêm/sửa/xóa mặt hàng trong dialog, upload ảnh chính và nhiều ảnh mô tả lên server
- Tự trừ tồn kho và ghi lịch sử khi đơn chuyển sang đang giao hoặc hoàn thành
- Quản lý người dùng, nâng/hạ quyền admin
- Quản lý liên hệ
- Cập nhật trạng thái liên hệ/yêu cầu hỗ trợ và gửi realtime notification cho khách hàng
- Quản lý đánh giá sản phẩm, lọc review có/không có ảnh và mở dialog chi tiết review
- Phạm vi đồ án bổ sung hệ thống kế toán nội bộ: sổ thu/chi, đối soát doanh thu đơn hàng, chi phí, lợi nhuận tạm tính và công nợ
- Tìm kiếm và lọc trong các mục quản lý
- Popup thông báo và popup xác nhận xóa
- Popup nhắc đơn hàng/liên hệ chưa xử lý, click để mở đúng mục quản lý và tự lọc
- Admin nhận sự kiện realtime khi có đơn hàng mới/cập nhật để dashboard tải lại nhanh

## Phạm vi kế toán trong đồ án

Hệ thống kế toán được thiết kế cho web quản trị ở mức kế toán quản trị nội bộ. Phạm vi gồm ghi nhận doanh thu từ đơn đã thanh toán/hoàn thành, nhập khoản chi, phân loại thu/chi, xem sổ quỹ, lợi nhuận tạm tính, công nợ và báo cáo theo tháng hoặc khoảng ngày.

Phạm vi này không bao gồm hóa đơn điện tử thật, ký số, nộp báo cáo thuế hoặc tích hợp phần mềm kế toán bên thứ ba.

## Cấu trúc thư mục

```txt
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── public/
│   │   └── brand/
│   ├── scripts/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── mcp/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── uploads/
│   ├── Dockerfile
│   └── package.json
├── docs/
├── docker-compose.yml
├── docker-compose.hub.yml
└── .env.example
```

## Chạy nhanh bằng Docker Hub

Không cần build source. Dùng image đã push:

```txt
lequyet/marseille04-client:latest
lequyet/marseille04-server:latest
```

Chạy tại thư mục dự án:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Truy cập:

```txt
Web: http://localhost:5173
API: http://localhost:3001/api/shop
```

Nếu database mới trống, seed dữ liệu:

```powershell
docker compose -f docker-compose.hub.yml exec server npm run seed
```

Tài khoản admin seed:

```txt
Email: test@gmail.com
Password: 123456
```

Chi tiết: [docs/docker-hub-pull-guide.md](docs/docker-hub-pull-guide.md)

## Chạy local development

Yêu cầu:

- Node.js 18+
- npm 9+
- MongoDB local hoặc Docker

Cài dependencies:

```powershell
cd server
npm install
cd ../client
npm install
cd ..
```

Tạo file môi trường nếu cần:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

Chạy server:

```powershell
cd server
npm run dev
```

Chạy client:

```powershell
cd client
npm run dev
```

Mặc định:

```txt
Client: http://localhost:5173
Server: http://localhost:3001
MongoDB: mongodb://127.0.0.1:27017/marseille04_shop
```

## Chạy bằng Docker local build

Build và chạy từ source:

```powershell
docker compose up --build -d
```

Dừng:

```powershell
docker compose down
```

Dừng và xóa database/uploads volumes:

```powershell
docker compose down -v
```

## Biến môi trường

Server:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/marseille04_shop
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change-this-secret-in-production
TOKEN_EXPIRES_IN_SECONDS=604800
ADMIN_EMAIL=test@gmail.com
```

Client:

```env
VITE_API_URL=/api/shop
```

Lưu ý production:

- Đổi `JWT_SECRET` thành chuỗi mạnh.
- Đổi `ADMIN_EMAIL` thành email admin thật.
- Đổi `CLIENT_ORIGIN` theo domain frontend.
- Không commit `.env`.

## Seed data

Server tự chạy `seedDatabase()` khi start. Có thể chạy thủ công:

```powershell
cd server
npm run seed
```

Với Docker Hub compose:

```powershell
docker compose -f docker-compose.hub.yml exec server npm run seed
```

Seed hiện tạo bộ dữ liệu lớn để test toàn bộ luồng: sản phẩm/kho hàng, danh mục, user, đơn hàng, đánh giá, giỏ hàng, liên hệ, thông báo và lịch sử kho. Seed dùng upsert theo khóa như `legacyId`, email, mã đơn, nên chạy lại không xóa dữ liệu người dùng hiện có.

## API chính

Base URL:

```txt
/api/shop
```

Public:

```txt
POST /register
POST /login
GET  /password-public-key
POST /forgot-password
POST /reset-password/:token
GET  /categories
GET  /products?page=1&limit=10&category=Tat%20ca&query=&sort=default
GET  /products/:productId
GET  /reviews?productId=<product-id>
POST /contact
GET  /orders/:orderCode
```

Mật khẩu trong `POST /register`, `POST /login` và reset password được client mã hóa thành `passwordEncrypted` bằng public key lấy từ `GET /password-public-key`. Server giải mã rồi hash bằng PBKDF2 trước khi lưu/so sánh.

Auth:

```txt
GET    /me
PUT    /me
GET    /contacts/me
GET    /notifications
GET    /notifications/stream?token=<jwt-token>
PATCH  /notifications/:notificationId/read
PATCH  /notifications/read-all
DELETE /notifications/:notificationId
GET    /cart
POST   /cart/items
PATCH  /cart/items/:productId
DELETE /cart/items/:productId
DELETE /cart
POST   /orders
GET    /orders/me
POST   /reviews
```

`POST /orders` trả thêm `customerType`/`customerTypeLabel`. Nếu order có `user` thì là `registered`, nếu không có `user` thì là `guest`.

`POST /reviews` nhận `productId`, `rating`, `comment` và tùy chọn `images` là mảng data URL ảnh review. Server lưu ảnh vào `/uploads/reviews` và trả review có `images: []`.

Realtime notification:

- Client mở SSE stream qua `GET /api/shop/notifications/stream?token=<jwt-token>`.
- Khi admin cập nhật đơn hàng/liên hệ, server lưu `UserNotification` vào MongoDB và đẩy event `notification` tới user đang online.
- Admin mở stream riêng `GET /api/shop/admin/events/stream?token=<jwt-token>` để nhận sự kiện quản trị như `order-created` và `order-updated`.
- Client vẫn fallback tải lại thông báo khi focus tab và mỗi 60 giây nếu stream gián đoạn.
- Với Docker/Nginx, `client/nginx.conf` đã tắt `proxy_buffering` cho `/api/` để SSE không bị delay.

Admin:

```txt
GET    /admin/summary
GET    /admin/orders
PATCH  /admin/orders/:orderCode/status
GET    /admin/customers
GET    /admin/contacts
PATCH  /admin/contacts/:contactId/status
GET    /admin/reviews
DELETE /admin/reviews/:reviewId
GET    /admin/users
PATCH  /admin/users/:userId/role
GET    /admin/categories
POST   /admin/categories
PATCH  /admin/categories/:categoryName
DELETE /admin/categories/:categoryName
GET    /admin/products
GET    /admin/inventory-history
POST   /admin/uploads/product-image
POST   /admin/products
PATCH  /admin/products/:productId
DELETE /admin/products/:productId
```

Các API danh sách admin hỗ trợ `page`, `limit`, `query` và bộ lọc theo từng mục. Riêng đơn hàng hỗ trợ `status`, `payment`, `customerType=all|registered|guest`, `dateField`, `startDate`, `endDate`. Riêng review hỗ trợ lọc theo `rating` và `hasImages=all|yes|no`.

## Upload ảnh sản phẩm

Admin upload ảnh qua:

```txt
POST /api/shop/admin/uploads/product-image
```

Client gửi ảnh dạng data URL JSON. Server lưu file vào:

```txt
server/uploads/products
```

Ảnh chính sản phẩm được lưu trong trường `image`. Các ảnh mô tả/ảnh gallery được lưu trong trường `images` dạng mảng URL và cũng dùng endpoint upload này trước khi gửi `POST/PATCH /admin/products`.

Giới hạn:

- File ảnh nhỏ hơn 5MB.
- Hỗ trợ JPG, PNG, WEBP, GIF.
- Nginx client Docker đã cấu hình `client_max_body_size 100M` để tránh lỗi 413 ở proxy.

## Upload ảnh review

Khách hàng gửi ảnh review trực tiếp trong payload:

```txt
POST /api/shop/reviews
```

Server lưu file vào:

```txt
server/uploads/reviews
```

Giới hạn:

- Tối đa 4 ảnh cho mỗi review.
- Mỗi ảnh nhỏ hơn 2MB.
- Hỗ trợ JPG, PNG, WEBP, GIF.
- API review trả về đường dẫn `/uploads/reviews/...` trong trường `images`.

## Upload avatar người dùng

Người dùng cập nhật avatar trong trang thông tin khách hàng. Client preview ảnh trước khi lưu, server lưu file vào:

```txt
server/uploads/avatars
```

Giới hạn:

- File ảnh nhỏ hơn 2MB.
- Hỗ trợ JPG, PNG, WEBP, GIF.
- API hồ sơ trả về đường dẫn `/uploads/avatars/...` để client hiển thị.

## Docker Hub và CI/CD

Images:

```txt
lequyet/marseille04-client:latest
lequyet/marseille04-server:latest
```

Tài liệu Docker:

- [docs/docker-hub-guide.md](docs/docker-hub-guide.md)
- [docs/docker-hub-pull-guide.md](docs/docker-hub-pull-guide.md)

GitHub Actions workflow:

```txt
.github/workflows/docker-publish.yml
```

Secrets cần cấu hình trong GitHub:

```txt
DOCKERHUB_USERNAME=lequyet
DOCKERHUB_TOKEN=<docker-hub-access-token>
```

Workflow tự push:

```txt
lequyet/marseille04-client:latest
lequyet/marseille04-server:latest
lequyet/marseille04-client:git-<commit-sha>
lequyet/marseille04-server:git-<commit-sha>
```

Chi tiết: [docs/github-actions-docker-cicd.md](docs/github-actions-docker-cicd.md)

## Tài liệu bổ sung

- [docs/README.md](docs/README.md)
- [docs/bao-cao-phan-tich-thiet-ke-he-thong.md](docs/bao-cao-phan-tich-thiet-ke-he-thong.md)
- [docs/bao-cao-phan-tich-thiet-ke-he-thong.docx](docs/bao-cao-phan-tich-thiet-ke-he-thong.docx)
- [docs/use-cases-and-main-flows.md](docs/use-cases-and-main-flows.md)
- [docs/client-code-flow.doc](docs/client-code-flow.doc)
- [docs/realtime-notifications.md](docs/realtime-notifications.md)
- [docs/brand-assets.md](docs/brand-assets.md)
- [docs/docker-hub-guide.md](docs/docker-hub-guide.md)
- [docs/docker-hub-pull-guide.md](docs/docker-hub-pull-guide.md)
- [docs/github-actions-docker-cicd.md](docs/github-actions-docker-cicd.md)
- [docs/mcp-server.md](docs/mcp-server.md)
- Các file SVG trong `docs/` mô tả use case, luồng auth, cart, checkout, admin, review, search/filter, realtime notification và Redux.

## Kiểm tra trước khi push

Client:

```powershell
cd client
npm run build
```

Server:

```powershell
cd server
node --check src/index.js
node --check src/controllers/adminController.js
```

Docker:

```powershell
docker compose build
```

## Lỗi thường gặp

Không tìm thấy file compose:

```txt
no configuration file provided: not found
```

Cách xử lý:

```powershell
docker compose -f docker-compose.hub.yml up -d
```

Upload ảnh lỗi 413:

- Kéo image client mới nhất.
- Đảm bảo `client/nginx.conf` có `client_max_body_size 100M`.
- Ảnh vẫn phải nhỏ hơn 5MB theo validate server.

MongoDB không kết nối:

- Kiểm tra container `mongo` đang healthy.
- Kiểm tra `MONGODB_URI`.
- Với Docker Compose phải dùng host `mongo`, không phải `127.0.0.1`.

Admin không đúng quyền:

- Kiểm tra `ADMIN_EMAIL`.
- Đăng nhập lại bằng email trùng `ADMIN_EMAIL`.
- Admin có thể nâng/hạ quyền người dùng trong `/admin/users`.

Realtime notification không hiện ngay:

- Kiểm tra user đang đăng nhập và request stream `/api/shop/notifications/stream?token=...` có status `200`.
- Nếu chạy sau reverse proxy, tắt response buffering cho SSE.
- Kiểm tra admin cập nhật đúng đơn/liên hệ thuộc email hoặc user đang mở web.
- Client vẫn fallback tải lại thông báo khi focus tab và mỗi 60 giây.

## Ghi chú bảo mật

- Không commit `.env`, token, key, certificate.
- Không commit `server/uploads/products`.
- Không commit `server/uploads/reviews`.
- Không commit `server/uploads/avatars`.
- Đổi `JWT_SECRET` khi deploy thật.
- Dùng Docker Hub access token thay vì mật khẩu tài khoản.
