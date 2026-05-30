# Marseille04 Shop

Marseille04 Shop là web bán hàng thời trang full-stack gồm React client, Express API và MongoDB. Dự án hỗ trợ mua hàng, quản lý giỏ hàng, đánh giá sản phẩm, lịch sử đơn hàng, sổ địa chỉ giao hàng, trang quản lý cửa hàng, upload ảnh sản phẩm, đa ngôn ngữ Việt/Anh, Docker và CI/CD Docker Hub.

## Công nghệ

Client:

- React 18, Vite 5
- Redux Toolkit, React Redux
- React Router
- Lucide React
- CSS tách theo module giao diện
- Nginx khi chạy production bằng Docker

Server:

- Node.js, Express
- MongoDB, Mongoose
- JWT authentication
- Password hash bằng PBKDF2 từ Node `crypto`
- CORS, dotenv
- Upload ảnh sản phẩm vào `/uploads/products`

DevOps:

- Dockerfile riêng cho `client` và `server`
- `docker-compose.yml` để build local
- `docker-compose.hub.yml` để chạy từ Docker Hub
- GitHub Actions build/push Docker images tự động

## Tính năng chính

Khách hàng:

- Đăng ký, đăng nhập, JWT session
- Trang chủ, danh mục bán chạy trong tháng
- Tìm kiếm, lọc danh mục, sắp xếp giá
- Trang shop hiển thị 9 sản phẩm mỗi trang
- URL sản phẩm dạng `/products-ten-san-pham-x<id-ma-hoa>`
- Xem chi tiết sản phẩm
- Đánh giá sản phẩm, yêu cầu đăng nhập trước khi gửi
- Thêm vào giỏ có animation bay về cart, không chuyển trang
- Giỏ hàng, mua hàng, thanh toán
- Lịch sử mua hàng
- Hồ sơ khách hàng và nhiều địa chỉ giao hàng
- Trang liên hệ
- Chuyển ngôn ngữ Việt/Anh
- Responsive mobile, header mobile dạng overlay

Admin:

- Chỉ tài khoản có role `admin` được vào `/admin/*`
- Dashboard tổng quan
- Thống kê theo tháng hoặc khoảng ngày
- Biểu đồ cột/list cho doanh thu, best sellers, low selling, top customers
- Quản lý đơn hàng
- Quản lý sản phẩm, thêm/sửa/xóa, upload ảnh lên server
- Quản lý người dùng, nâng/hạ quyền admin
- Quản lý liên hệ
- Quản lý đánh giá sản phẩm
- Tìm kiếm và lọc trong các mục quản lý
- Popup thông báo và popup xác nhận xóa

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
│   │   ├── styles/
│   │   └── utils/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
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

Seed hiện tạo dữ liệu lớn để test:

```txt
Products: 122
Users: 26
Orders: 160
Reviews: 104
Carts: 18
Contacts: 22
```

Seed dùng upsert theo khóa như `legacyId`, email, mã đơn, nên chạy lại không xóa dữ liệu người dùng hiện có.

## API chính

Base URL:

```txt
/api/shop
```

Public:

```txt
POST /register
POST /login
GET  /categories
GET  /products
GET  /products/:productId
GET  /reviews
POST /contact
GET  /orders/:orderCode
```

Auth:

```txt
GET    /me
PUT    /me
GET    /cart
POST   /cart/items
PATCH  /cart/items/:productId
DELETE /cart/items/:productId
DELETE /cart
POST   /orders
GET    /orders/me
POST   /reviews
```

Admin:

```txt
GET    /admin/summary
GET    /admin/orders
PATCH  /admin/orders/:orderCode/status
GET    /admin/contacts
PATCH  /admin/contacts/:contactId/status
GET    /admin/reviews
DELETE /admin/reviews/:reviewId
GET    /admin/users
PATCH  /admin/users/:userId/role
GET    /admin/products
POST   /admin/uploads/product-image
POST   /admin/products
PATCH  /admin/products/:productId
DELETE /admin/products/:productId
```

## Upload ảnh sản phẩm

Admin upload ảnh qua:

```txt
POST /api/shop/admin/uploads/product-image
```

Client gửi ảnh dạng data URL JSON. Server lưu file vào:

```txt
server/uploads/products
```

Giới hạn:

- File ảnh nhỏ hơn 5MB.
- Hỗ trợ JPG, PNG, WEBP, GIF.
- Nginx client Docker đã cấu hình `client_max_body_size 100M` để tránh lỗi 413 ở proxy.

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
- [docs/client-code-flow.doc](docs/client-code-flow.doc)
- [docs/docker-hub-guide.md](docs/docker-hub-guide.md)
- [docs/docker-hub-pull-guide.md](docs/docker-hub-pull-guide.md)
- [docs/github-actions-docker-cicd.md](docs/github-actions-docker-cicd.md)
- Các file SVG trong `docs/` mô tả luồng auth, cart, checkout, admin, review, search/filter và Redux.

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

## Ghi chú bảo mật

- Không commit `.env`, token, key, certificate.
- Không commit `server/uploads/products`.
- Đổi `JWT_SECRET` khi deploy thật.
- Dùng Docker Hub access token thay vì mật khẩu tài khoản.
