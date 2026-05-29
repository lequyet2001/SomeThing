# 🛍️ Marseille04 Shop

**Marseille04 Shop** là nền tảng bán hàng thời trang hiện đại với kiến trúc microservices, bao gồm:
- **Frontend**: React 18 + Vite (SPA responsive)
- **Backend**: Node.js + Express + MongoDB (REST API)
- **Deployment**: Docker Compose cho development & production

Dự án hỗ trợ đầy đủ các tính năng thương mại điện tử: xác thực JWT, phân quyền admin, giỏ hàng, thanh toán, đánh giá sản phẩm, upload ảnh, quản lý đơn hàng, và hỗ trợ đa ngôn ngữ (Việt/Anh).

## 🔧 Công nghệ sử dụng

### Frontend (Client)
- **React 18.3.1** - Thư viện UI component-based
- **Vite 5.4** - Build tool cực nhanh, development server
- **React Router v7** - Routing cho SPA
- **Lucide React** - Icon library
- **CSS3** - Responsive design, flexbox/grid

### Backend (Server)
- **Node.js** - JavaScript runtime
- **Express 4.18** - Web framework minimalist & flexible
- **MongoDB 9.6** - NoSQL database
- **Mongoose** - ODM (Object Document Mapper) cho MongoDB
- **Nodemon** - Auto-restart khi file thay đổi (development)
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variables management

### DevOps & Deployment
- **Docker** - Containerization cho client & server
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy cho frontend (production)
- **npm** - Package manager

### Tools & Services
- **npm** - Version 10+
- **Git** - Version control
- **VSCode** - Recommended IDE

## ✨ Chức năng chính

### 👤 Xác thực & Phân quyền
- ✅ Đăng ký tài khoản mới (email validation)
- ✅ Đăng nhập với email/password
- ✅ JWT token-based authentication (tuổi thọ: 7 ngày)  
- ✅ Phân quyền: User thường + Admin store
- ✅ Middleware auth check cho route bảo vệ
- ✅ Auto-assign admin qua email cấu hình

### 🏪 Quản lý sản phẩm
- ✅ Danh mục sản phẩm (10 categories)
- ✅ Tìm kiếm sản phẩm theo từ khóa
- ✅ Lọc theo danh mục, giá min/max
- ✅ Sắp xếp: giá tăng/giảm, tên A-Z
- ✅ URL slug thân thiện (vd: `/product-ao-thun-trang-abc123`)
- ✅ Mã hóa ID product để tránh trùng slug
- ✅ Pagination tự động
- ✅ Chi tiết sản phẩm: ảnh, giá, mô tả, tồn kho

### 🛒 Giỏ hàng & Thanh toán
- ✅ Thêm/xóa/cập nhật số lượng trong giỏ
- ✅ Lưu giỏ hàng vào localStorage (persist across sessions)
- ✅ Tính toán tổng tiền, giảm giá (nếu có)
- ✅ Checkout: nhập địa chỉ, method thanh toán
- ✅ Lưu đơn hàng vào database
- ✅ Giảm tồn kho khi đặt hàng
- ✅ Xác nhận đơn hàng bằng email

### ⭐ Đánh giá & Bình luận
- ✅ Gửi đánh giá sản phẩm (chỉ users đã đăng nhập)
- ✅ Rating 1-5 sao
- ✅ Comment text + timestamp
- ✅ Hiển thị trung bình rating
- ✅ Danh sách review có pagination

### 👥 Tài khoản khách hàng
- ✅ Xem/cập nhật thông tin cá nhân
- ✅ Quản lý địa chỉ giao hàng
- ✅ Lịch sử đơn hàng
- ✅ Trạng thái đơn hàng (pending, processing, shipped, delivered)

### 💼 Trang Admin Store
#### Dashboard Tổng quan
- 📊 Tổng doanh thu, số đơn hàng, số sản phẩm, số users
- 📈 Biểu đồ doanh thu (nếu có chart library)

#### Quản lý Đơn hàng
- ✅ Danh sách tất cả đơn hàng
- ✅ Lọc theo trạng thái, ngày
- ✅ Chi tiết đơn hàng
- ✅ Cập nhật trạng thái đơn hàng
- ✅ Export danh sách

#### Quản lý Sản phẩm
- ✅ CRUD sản phẩm (Create, Read, Update, Delete)
- ✅ Upload ảnh sản phẩm lên server (`/uploads/products/`)
- ✅ Manage categories
- ✅ Cập nhật giá, tồn kho
- ✅ Soft delete hoặc hard delete

#### Quản lý Người dùng
- ✅ Danh sách users
- ✅ Xem chi tiết account
- ✅ Gán/xóa quyền admin
- ✅ Khóa/mở khóa tài khoản

#### Quản lý Liên hệ
- ✅ Danh sách form liên hệ từ customers
- ✅ Xem nội dung pesan
- ✅ Đánh dấu đã trả lời
- ✅ Xóa tin nhắn cũ

### 🌍 Đa ngôn ngữ & UI/UX
- ✅ Chuyển đổi Tiếng Việt ↔ Tiếng Anh
- ✅ Context API quản lý ngôn ngữ toàn app
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Notification popup (success, error, info)
- ✅ Confirm dialog cho delete actions
- ✅ Loading states & error boundaries

### 📞 Liên hệ & Support
- ✅ Form liên hệ cho visitors
- ✅ Gửi message vào database
- ✅ Email notification (optional)
- ✅ Admin view all messages

## Cấu trúc thư mục

```txt
.
├── client/
│   ├── src/
│   │   ├── components/     # Header, Footer, Notification, LoginModal...
│   │   ├── data/           # Dữ liệu fallback khi chưa tải API
│   │   ├── hooks/          # Logic dùng chung cho catalog, cart, user, review
│   │   ├── i18n/           # LanguageContext, bộ text Việt/Anh
│   │   ├── pages/          # Home, Shop, Product, Cart, Checkout, Admin...
│   │   ├── routes/         # React Router và route sản phẩm
│   │   ├── services/       # shopApi gọi backend
│   │   ├── styles/         # CSS tách riêng theo từng phần giao diện
│   │   └── utils/          # currency, slug, category label
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   ├── nginx.conf
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/         # Biến môi trường, kết nối MongoDB
│   │   ├── controllers/    # Xử lý nghiệp vụ API
│   │   ├── data/           # Seed dữ liệu ban đầu
│   │   ├── middleware/     # Auth, phân quyền, xử lý lỗi
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── utils/          # JWT, password hash, async handler
│   ├── uploads/products/   # Ảnh sản phẩm upload lên server
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## ⚡ Quick Start (3 bước)

### 1️⃣ Clone & Install
```bash
git clone <repo-url>
cd SomeThing

# Cài dependencies backend
cd server && npm install && cd ..

# Cài dependencies frontend
cd client && npm install && cd ..
```

### 2️⃣ Setup Environment
```bash
# Backend config
cp server/.env.example server/.env

# Frontend config (optional)
cp client/.env.example client/.env
```

**⚠️ Backend .env MUST:**
- MongoDB server chạy sẵn (local hoặc Docker)
- Chỉnh `MONGODB_URI` nếu URI default không khớp
- Chỉnh `ADMIN_EMAIL` thành email của bạn

### 3️⃣ Run Development
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend  
cd client && npm run dev
```

✅ Open `http://localhost:5173`

---

## 📋 Yêu cầu Hệ thống

| Yêu cầu | Phiên bản | Ghi chú |
|---------|----------|--------|
| Node.js | >= 18.0 | `node --version` |
| npm | >= 9.0 | `npm --version` |
| MongoDB | >= 4.4 | Local hoặc Docker |
| Git | Mới nhất | Không bắt buộc |

**Kiểm tra:**
```bash
node --version   # v18.x.x
npm --version    # 9.x.x
mongod --version # MongoDB x.x.x
```

---

## 📦 Cài đặt Chi tiết

### Option 1: Local Setup

#### Bước 1: Chuẩn bị MongoDB
```bash
# Windows - nếu cài MongoDB thông qua installer
mongod

# Hoặc Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Bước 2: Clone Repository
```bash
git clone https://github.com/yourusername/marseille04-shop.git
cd marseille04-shop
```

#### Bước 3: Setup Backend
```bash
cd server
npm install

# Tạo .env file từ template
cp .env.example .env

# Edit .env - đảm bảo MongoDB connection string đúng
# Ví dụ: MONGODB_URI=mongodb://127.0.0.1:27017/marseille04_shop
```

#### Bước 4: Setup Frontend  
```bash
cd ../client
npm install

# Optional: Tạo .env nếu API URL khác
cp .env.example .env
```

#### Bước 5: Chạy Development Server
```bash
# Terminal 1: Backend (cwd: server/)
npm run dev
# Output: Shop API running at http://localhost:3001

# Terminal 2: Frontend (cwd: client/)
npm run dev
# Output: Local: http://localhost:5173
```

### Option 2: Docker Setup

#### Bước 1: Chuẩn bị
```bash
# Đảm bảo Docker & Docker Compose đã cài
docker --version
docker compose --version
```

#### Bước 2: Clone & Config
```bash
git clone https://github.com/yourusername/marseille04-shop.git
cd marseille04-shop

# Copy .env files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### Bước 3: Build & Run
```bash
# Build và start tất cả services (MongoDB, Backend, Frontend)
docker compose up --build

# Lần tiếp theo (không build)
docker compose up

# Dừng container
docker compose down

# Xóa tất cả (bao gồm data MongoDB)
docker compose down -v
```

#### Bước 4: Verify
```bash
# Check services
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

URLs trong Docker:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- MongoDB: `mongodb://mongodb:27017/marseille04_shop` (từ container)

---

## 🔐 Biến Môi Trường

Quyền admin được xác định bằng `ADMIN_EMAIL` trong `server/.env` hoặc biến môi trường Docker.

Quy trình:

1. Đặt email admin trong `.env`.
2. Đăng ký hoặc đăng nhập bằng email đó.
3. Backend sẽ tự đồng bộ `role: admin` cho tài khoản trùng `ADMIN_EMAIL`.
4. Trang quản lý chỉ truy cập được khi user có quyền admin.

Các route admin trên frontend:

```txt
/admin/overview
/admin/orders
/admin/products
/admin/users
/admin/contacts
```

## 🔐 Biến Môi Trường

### Backend Configuration (`server/.env`)

```env
# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/marseille04_shop
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS & Security
CLIENT_ORIGIN=http://localhost:5173

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
TOKEN_EXPIRES_IN_SECONDS=604800  # 7 ngày

# Admin Configuration
ADMIN_EMAIL=admin@example.com
```

| Biến | Giá trị mặc định | Ý nghĩa |
|------|-----------------|---------|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/marseille04_shop` | Chuỗi kết nối MongoDB |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | `5000` | Timeout kết nối (ms) |
| `PORT` | `3001` | Port Express server |
| `NODE_ENV` | `development` | `development` hoặc `production` |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS whitelist origin |
| `JWT_SECRET` | ⚠️ **MUST CHANGE** | Khóa bảo mật JWT token |
| `TOKEN_EXPIRES_IN_SECONDS` | `604800` | Token tuổi thọ (7 ngày) |
| `ADMIN_EMAIL` | `admin@example.com` | Email tự động gán admin role |

**⚠️ Production Security:**
```env
# Production .env MUST có:
JWT_SECRET=very-long-random-string-at-least-32-chars
NODE_ENV=production
CLIENT_ORIGIN=https://yourdomain.com
```

### Frontend Configuration (`client/.env`)

```env
# API Configuration
VITE_API_URL=/api/shop

# Optional: Production API (uncomment for production)
# VITE_API_URL=https://api.yourdomain.com/api/shop
```

**Development:**
- Frontend proxy `/api` → `http://localhost:3001/api` (via Vite)
- Frontend proxy `/uploads` → `http://localhost:3001/uploads` (via Vite)

**Production:**
- Frontend serve static từ Nginx
- Nginx proxy `/api` → backend container

---

## 🔑 Admin Account Setup

### Cách 1: Auto-Admin via Email
1. Thiết lập `ADMIN_EMAIL` trong `server/.env`:
   ```env
   ADMIN_EMAIL=your-email@gmail.com
   ```

2. Restart backend: `npm run dev`

3. Truy cập `/auth` ở frontend, đăng ký/đăng nhập với email đó

4. Tự động nhận quyền admin ✅

### Cách 2: Manual Admin Assignment
```bash
# Kết nối MongoDB
mongosh "mongodb://localhost:27017/marseille04_shop"

# Query và update user
db.users.updateOne(
  { email: "your-email@gmail.com" },
  { $set: { role: "admin" } }
)

# Verify
db.users.findOne({ email: "your-email@gmail.com" })
```

### Truy cập Admin Dashboard
Sau khi có admin role:
- Frontend: Click menu → Admin (nếu role là admin)
- URL: `http://localhost:5173/admin/overview`

Admin có thể truy cập:
- `/admin/overview` - Dashboard
- `/admin/orders` - Quản lý đơn hàng
- `/admin/products` - Quản lý sản phẩm
- `/admin/users` - Quản lý người dùng
- `/admin/contacts` - Quản lý liên hệ

---

## 🗄️ Cấu Trúc Cơ Sở Dữ Liệu

### Collections

#### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  phone: String,
  address: String,
  role: String, // "user" | "admin"
  createdAt: Date,
  updatedAt: Date
}
```

#### Product
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  category: String,
  price: Number,
  stock: Number,
  description: String,
  image: String, // filename hoặc URL
  rating: Number, // 0-5
  reviews: [ObjectId], // Reference to Review
  createdAt: Date,
  updatedAt: Date
}
```

#### Review
```javascript
{
  _id: ObjectId,
  productId: ObjectId (ref: Product),
  userId: ObjectId (ref: User),
  rating: Number, // 1-5
  comment: String,
  createdAt: Date
}
```

#### Cart
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  items: [
    {
      productId: ObjectId (ref: Product),
      quantity: Number,
      price: Number // giá tại thời điểm add
    }
  ],
  updatedAt: Date
}
```

#### Order
```javascript
{
  _id: ObjectId,
  orderCode: String (unique), // ví dụ: ORD-20240101-001
  userId: ObjectId (ref: User),
  items: [
    {
      productId: ObjectId,
      productName: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }
  ],
  shippingAddress: String,
  shippingPhone: String,
  totalAmount: Number,
  paymentMethod: String, // "credit_card", "bank_transfer", "cash_on_delivery"
  status: String, // "pending", "processing", "shipped", "delivered", "cancelled"
  createdAt: Date,
  updatedAt: Date
}
```

#### ContactMessage
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  message: String,
  status: String, // "new", "replied", "resolved"
  replyMessage: String,
  createdAt: Date,
  replyAt: Date
}
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/shop/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response:
{
  "message": "Registration successful",
  "user": { ... }
}
```

#### Login
```http
POST /api/shop/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1...",
  "user": { ... }
}
```

#### Get Current User
```http
GET /api/shop/me
Authorization: Bearer <token>

Response:
{
  "_id": "...",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "phone": "...",
  "address": "..."
}
```

#### Update Profile
```http
PUT /api/shop/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "0123456789",
  "address": "123 Tran Hung Dao St"
}
```

### Product Endpoints

#### Get All Products
```http
GET /api/shop/products?category=tshirt&minPrice=10&maxPrice=50&sort=price_asc&page=1&limit=20

Response:
{
  "data": [ { _id, name, price, ... } ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

#### Get Product Detail
```http
GET /api/shop/products/ao-thun-xanh-abc123

Response:
{
  "_id": "...",
  "name": "Áo thun xanh",
  "slug": "ao-thun-xanh-abc123",
  "price": 199000,
  "stock": 50,
  "description": "...",
  "rating": 4.5,
  "reviews": [ ... ]
}
```

#### Get Categories
```http
GET /api/shop/categories

Response:
{
  "data": [
    "tshirt", "jeans", "jacket", "shoes", ...
  ]
}
```

### Review Endpoints

#### Get Product Reviews
```http
GET /api/shop/reviews?productId=XXX&page=1&limit=10

Response:
{
  "data": [ ... ],
  "total": 45,
  "page": 1
}
```

#### Post Review (Auth Required)
```http
POST /api/shop/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "...",
  "rating": 5,
  "comment": "Sản phẩm rất tốt!"
}

Response:
{
  "_id": "...",
  "productId": "...",
  "userId": "...",
  "rating": 5,
  "comment": "Sản phẩm rất tốt!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Order Endpoints

#### Create Order (Auth Required)
```http
POST /api/shop/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "productId": "...", "quantity": 2 },
    { "productId": "...", "quantity": 1 }
  ],
  "shippingAddress": "123 Main St, City",
  "shippingPhone": "0123456789",
  "paymentMethod": "credit_card"
}

Response:
{
  "orderCode": "ORD-20240115-001",
  "status": "pending",
  "totalAmount": 500000,
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

#### Get User Orders (Auth Required)
```http
GET /api/shop/orders/me
Authorization: Bearer <token>

Response:
{
  "data": [ ... orders ... ],
  "total": 10
}
```

#### Get Order Detail
```http
GET /api/shop/orders/ORD-20240115-001

Response:
{
  "orderCode": "ORD-20240115-001",
  "items": [ ... ],
  "totalAmount": 500000,
  "status": "processing",
  ...
}
```

### Admin Endpoints

#### Get Dashboard Summary (Admin Only)
```http
GET /api/shop/admin/summary
Authorization: Bearer <admin-token>

Response:
{
  "totalRevenue": 50000000,
  "totalOrders": 250,
  "totalProducts": 450,
  "totalUsers": 320
}
```

#### Upload Product Image (Admin Only)
```http
POST /api/shop/admin/uploads/product-image
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Form Data:
  file: <binary>

Response:
{
  "filename": "product-1705329000123.jpg",
  "url": "/uploads/products/product-1705329000123.jpg"
}
```

#### Create Product (Admin Only)
```http
POST /api/shop/admin/products
Authorization: Bearer <admin-token>

{
  "name": "Áo thun mới",
  "category": "tshirt",
  "price": 199000,
  "stock": 100,
  "description": "Mô tả sản phẩm",
  "image": "product-1705329000123.jpg"
}
```

#### Update Product (Admin Only)
```http
PATCH /api/shop/admin/products/:productId
Authorization: Bearer <admin-token>

{
  "price": 179000,
  "stock": 50
}
```

#### Delete Product (Admin Only)
```http
DELETE /api/shop/admin/products/:productId
Authorization: Bearer <admin-token>
```

### Full API Routes

```
BASE_URL = /api/shop

=== AUTHENTICATION ===
POST   /register                    # Đăng ký
POST   /login                       # Đăng nhập
GET    /me                          # Lấy thông tin user hiện tại (Auth)
PUT    /me                          # Cập nhật profil (Auth)

=== PRODUCTS ===
GET    /products                    # Danh sách sản phẩm (filter, sort, pagination)
GET    /products/:productId         # Chi tiết sản phẩm
GET    /categories                  # Danh sách categories

=== REVIEWS ===
GET    /reviews                     # Danh sách reviews
POST   /reviews                     # Thêm review (Auth)

=== CART (Client-side localStorage) ===
# Note: Cart được lưu ở frontend localStorage, không có endpoint backend

=== ORDERS ===
POST   /orders                      # Tạo đơn hàng (Auth)
GET    /orders/me                   # Lấy đơn hàng của user (Auth)
GET    /orders/:orderCode           # Chi tiết đơn hàng

=== CONTACT ===
POST   /contact                     # Gửi message liên hệ

=== ADMIN (require admin role) ===
GET    /admin/summary               # Dashboard thống kê
GET    /admin/orders                # Danh sách đơn hàng (Admin)
PATCH  /admin/orders/:orderCode/status  # Cập nhật trạng thái đơn hàng
GET    /admin/contacts              # Danh sách contact messages
PATCH  /admin/contacts/:contactId/status # Cập nhật trạng thái contact
GET    /admin/users                 # Danh sách users
PATCH  /admin/users/:userId/role    # Gán/xóa admin role
GET    /admin/products              # Danh sách sản phẩm (Admin)
POST   /admin/products              # Tạo sản phẩm (Admin)
PATCH  /admin/products/:productId   # Cập nhật sản phẩm (Admin)
DELETE /admin/products/:productId   # Xóa sản phẩm (Admin)
POST   /admin/uploads/product-image # Upload ảnh sản phẩm (Admin)
```

---

## 🔐 Authentication Flow

### 1. Registration
```
User Input (email, password, name)
    ↓
Frontend: POST /api/shop/register
    ↓
Backend: Hash password (bcryptjs)
    ↓
Create User document in MongoDB
    ↓
Response: User object
    ↓
Frontend: Redirect to /auth/login
```

### 2. Login
```
User Input (email, password)
    ↓
Frontend: POST /api/shop/login
    ↓
Backend: Find user by email
    ↓
Compare password hash (bcryptjs)
    ↓
Generate JWT token (signed with JWT_SECRET)
    ↓
Response: { token, user }
    ↓
Frontend: Store token in localStorage
Frontend: Redirect to / or previous page
```

### 3. Authenticated Requests
```
Frontend: GET /api/shop/me
    + Header: Authorization: Bearer <token>
    ↓
Backend: Extract token from Authorization header
    ↓
Verify token signature (JWT_SECRET)
    ↓
If valid: Attach user data to request
If invalid: Return 401 Unauthorized
    ↓
Continue to route handler OR send error
```

### 4. Token Expiration
- Default: 7 ngày (604800 seconds)
- After expiry: User phải login lại
- Frontend: Check token expiry & redirect to login

### Admin Auto-Promotion
```
ADMIN_EMAIL = "admin@example.com"
    ↓
User registers/login with this email
    ↓
Backend: Check if user.email === ADMIN_EMAIL
    ↓
If yes: Set user.role = "admin"
    ↓
User gains access to /admin routes
```

---

## 📁 File Upload Handling

### Product Image Upload

**Frontend:**
```javascript
// client/src/pages/StoreAdminPage.jsx
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch(
  '/api/shop/admin/uploads/product-image',
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }
);
const { filename, url } = await response.json();
// url = "/uploads/products/product-1705329000123.jpg"
```

**Backend:**
```javascript
// server/src/routes/adminRoutes.js
router.post('/uploads/product-image', 
  requireAuth, 
  requireAdmin,
  upload.single('file'),
  (req, res) => {
    const filename = req.file.filename;
    res.json({ filename, url: `/uploads/products/${filename}` });
  }
);

// File saved at: server/uploads/products/product-*.jpg
```

**Static Serving:**
```javascript
// server/src/index.js
app.use('/uploads', express.static('uploads'));
```

**Client Display:**
```jsx
<img src={product.image} alt={product.name} />
{/* image path: /uploads/products/product-1705329000123.jpg */}
```

---

## 🌍 Internationalization (i18n)

### Cách hoạt động

**1. Language Context:**
```jsx
// client/src/i18n/LanguageContext.jsx
const LanguageContext = React.createContext();

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('marseille04_language') || 'vi'
  );
  
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

**2. Usage:**
```jsx
import { useLanguage } from '../i18n/LanguageContext';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <>
      <h1>{t('header.title')}</h1>
      <button onClick={() => setLanguage('vi')}>Tiếng Việt</button>
      <button onClick={() => setLanguage('en')}>English</button>
    </>
  );
}
```

**3. Thêm text mới:**
```javascript
// Cập nhật file LanguageContext.jsx
const translations = {
  vi: {
    'header.title': 'Marseille04 Shop',
    'button.buy': 'Mua hàng',
    'footer.copyright': '© 2024 Marseille04'
  },
  en: {
    'header.title': 'Marseille04 Shop',
    'button.buy': 'Purchase',
    'footer.copyright': '© 2024 Marseille04'
  }
};
```

**4. Lưu preference:**
- Ngôn ngữ được lưu vào `localStorage` với key `marseille04_language`
- Persist khi user reload page

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: ECONNREFUSED 127.0.0.1:27017
```
**Solutions:**
1. Kiểm tra MongoDB chạy:
   ```bash
   mongosh "mongodb://localhost:27017"
   ```
2. Chỉnh lại `MONGODB_URI` trong `.env`
3. Nếu dùng Docker:
   ```bash
   docker run -d -p 27017:27017 mongo
   ```

### Frontend API 404
```
GET http://localhost:5173/api/shop/products → 404
```
**Solutions:**
1. Kiểm tra backend chạy: `npm run dev` trong `server/`
2. Kiểm tra Vite proxy config (`vite.config.js`)
3. Kiểm tra `VITE_API_URL` trong `.env`

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solutions:**
1. Kiểm tra `CLIENT_ORIGIN` trong `server/.env`:
   ```env
   CLIENT_ORIGIN=http://localhost:5173
   ```
2. Backend CORS middleware:
   ```javascript
   app.use(cors({
     origin: process.env.CLIENT_ORIGIN,
     credentials: true
   }));
   ```

### JWT Token Invalid
```
Error: Invalid token
```
**Solutions:**
1. Kiểm tra `JWT_SECRET` đã set trong `.env`
2. Token hết hạn → phải login lại
3. Clear localStorage: 
   ```javascript
   localStorage.removeItem('auth_token')
   ```

### Upload Image Fail
```
Error: ENOENT: no such file or directory
```
**Solutions:**
1. Kiểm tra folder `server/uploads/products/` tồn tại
2. Kiểm tra permissions (rwx)
3. Tạo folder nếu chưa có:
   ```bash
   mkdir -p server/uploads/products
   ```

### Docker Build Fail
```
Error: ENOENT: npm ERR! Could not find package.json
```
**Solutions:**
1. Kiểm tra `.dockerignore` không ignore `package.json`
2. Rebuild: `docker compose build --no-cache`
3. Check logs: `docker compose logs backend`

---

## 📊 Performance Tips

### Frontend Optimization
- ✅ Use React.memo() cho components không cần re-render
- ✅ Lazy load routes: `React.lazy(() => import(...))`
- ✅ Optimize images (use WebP, appropriate sizing)
- ✅ CSS optimize: merge files, minify
- ✅ Use Vite plugin cho compression

### Backend Optimization
- ✅ Add MongoDB indexes trên `email`, `slug`, `productId`
- ✅ Pagination: limit 20-50 items per page
- ✅ Query projection: select only needed fields
- ✅ Use caching layer (Redis) cho frequently accessed data
- ✅ Implement rate limiting để prevent abuse

### Deployment Optimization
- ✅ Enable Gzip compression (Nginx, Express)
- ✅ Use CDN cho static files
- ✅ Enable HTTP/2 & HTTP/3
- ✅ Set proper cache headers
- ✅ Monitor database query performance

---

## 🚀 Deployment Guide

### Prepare for Production

**1. Environment Variables**
```bash
# server/.env (production)
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/marseille04
JWT_SECRET=<long-random-secure-key-at-least-32-chars>
CLIENT_ORIGIN=https://yourdomain.com
PORT=3001
```

**2. Build Frontend**
```bash
cd client
npm run build
# Creates dist/ folder with optimized files
```

**3. Docker Compose**
```yaml
# docker-compose.yml (for production)
version: '3.8'
services:
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
    
  mongodb:
    image: mongo:latest
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongodb_data:
```

**4. Deploy**
```bash
# Build all images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f
```

### Platform Deployment

**Heroku/Railway:**
```bash
# Push to git
git push heroku main

# Or use railway CLI
railway up
```

**AWS/Azure/GCP:**
- Use managed services (ECR, Container Registry)
- Deploy containers to Kubernetes or App Services
- Use managed MongoDB (Atlas)
- Configure auto-scaling

**Vercel (Frontend only):**
```bash
npm install -g vercel
vercel
```

---

## 📚 Best Practices

### Code Organization
- ✅ Tách logic vào services/utils
- ✅ Components nhỏ & reusable
- ✅ Use custom hooks cho business logic
- ✅ Consistent naming conventions

### Frontend
```javascript
// ✅ Good - clear, reusable
const useProducts = (filters) => {
  const [products, setProducts] = useState([]);
  useEffect(() => { /* fetch */ }, [filters]);
  return { products, loading, error };
};

// ❌ Avoid - logic in component
function ProductList() {
  useEffect(() => { /* fetch in component */ }, []);
}
```

### Backend
```javascript
// ✅ Good - validation middleware
router.post('/products', 
  validateInput,
  requireAuth,
  requireAdmin,
  createProduct
);

// ❌ Avoid - validation in handler
router.post('/products', (req, res) => {
  if (!req.body.name) throw new Error('...');
});
```

### Database
- ✅ Use indexes strategically
- ✅ Validate data before save
- ✅ Use transactions cho multi-step operations
- ✅ Backup regularly

### Security
- ✅ Hash passwords (bcryptjs)
- ✅ Use HTTPS in production
- ✅ Validate all inputs
- ✅ Use rate limiting
- ✅ Sanitize SQL/NoSQL injection
- ✅ Keep dependencies updated
- ✅ Never commit `.env` files

### Error Handling
```javascript
// ✅ Good - consistent error format
res.status(400).json({
  success: false,
  message: 'Invalid input',
  errors: { email: 'Email already exists' }
});

// ❌ Avoid - inconsistent responses
res.send('Error occurred');
```

---

## 📖 Development Guidelines

### Adding New Feature

**1. Design:**
- Plan database schema
- Define API endpoints
- Create component mockups

**2. Backend:**
```bash
cd server

# Add model (if needed)
# Modify models/Feature.js

# Add controller logic
# Modify controllers/featureController.js

# Add routes
# Modify routes/featureRoutes.js

npm run dev  # Test with Postman/curl
```

**3. Frontend:**
```bash
cd client

# Create components
# src/components/FeatureComponent.jsx

# Create hook (if needed)
# src/hooks/useFeature.js

# Create page
# src/pages/FeaturePage.jsx

# Add route
# src/routes/AppRoutes.jsx

# Add i18n keys
# src/i18n/LanguageContext.jsx

npm run dev  # Test in browser
```

**4. Test:**
- Manual testing (browser, API client)
- Check responsive design (mobile, tablet, desktop)
- Test with different languages
- Test error scenarios

**5. Commit:**
```bash
git add .
git commit -m "feat: add new feature description"
git push
```

### Commit Message Convention
```
feat: add new feature
fix: fix bug
docs: update documentation
style: code formatting
refactor: restructure code without changing functionality
perf: improve performance
test: add tests
chore: update dependencies
```

### Before Committing
```bash
# Check for errors
npm run lint

# Format code
npm run format

# Test build
npm run build

# Push clean code
git push
```

---

## 🤝 Contributing

### Contribution Steps
1. Fork repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request

### Pull Request Guidelines
- Clear description of changes
- Reference related issues
- Include screenshots if UI changes
- Ensure tests pass
- Follow code style

---

## 📝 Ghi chú Phát triển

- ❌ Không sửa dữ liệu user trực tiếp trong database
- ✅ Khi thêm text mới ở frontend, thêm key vào cả `vi` và `en`
- ✅ Khi thêm route admin mới, bảo vệ bằng `requireAuth` + `requireAdmin`
- ✅ Upload ảnh qua trang admin để file lưu đúng folder
- ✅ Seed data chỉ add mới, không ghi đè dữ liệu tồn tại
- ❌ Không commit `.env` files
- ✅ Test thoroughly trước khi push
- ✅ Write clear commit messages

---

## 📄 License

MIT License - Tự do sử dụng cho dự án cá nhân hoặc thương mại

---

## 👥 Support & Contact

- 📧 Email: support@marseille04.com
- 💬 Issues: GitHub Issues
- 📱 Phone: (+84) XXX-XXX-XXXX

---

**Last Updated:** May 2024  
**Version:** 1.0.0

Made with ❤️ by Marseille04 Team
