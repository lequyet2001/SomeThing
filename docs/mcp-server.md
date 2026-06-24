# MCP server

Marseille04 Shop có MCP server project-scoped để Codex hoặc AI client đọc dữ liệu shop từ MongoDB thông qua các tool quản trị an toàn.

## Cấu hình

File cấu hình:

```txt
.codex/config.toml
```

Server:

```toml
[mcp_servers.marseille04_shop]
command = "node"
args = ["D:/SomeThing/server/src/mcp/shopMcpServer.js"]
cwd = "D:/SomeThing/server"
startup_timeout_sec = 20
tool_timeout_sec = 60
enabled = true
default_tools_approval_mode = "prompt"
```

Biến môi trường mặc định:

```toml
MONGODB_URI = "mongodb://127.0.0.1:27017/marseille04_shop"
MONGODB_SERVER_SELECTION_TIMEOUT_MS = "5000"
```

## Tool đang bật

| Tool | Mục đích |
| --- | --- |
| `shop_health` | Kiểm tra trạng thái MCP server và kết nối MongoDB |
| `shop_list_categories` | Lấy danh sách danh mục |
| `shop_list_products` | Tìm kiếm/lọc/phân trang sản phẩm |
| `shop_get_product` | Lấy chi tiết sản phẩm theo id/tên |
| `shop_list_orders` | Lọc và phân trang đơn hàng |
| `shop_admin_summary` | Lấy thống kê tổng quan cửa hàng |

## Cách chạy qua Codex

Mở Codex ở thư mục dự án:

```powershell
cd D:\SomeThing
codex
```

Trong Codex TUI:

```txt
/mcp
```

Kết quả mong muốn:

```txt
marseille04_shop  enabled
```

Kiểm tra bằng CLI:

```powershell
cd D:\SomeThing
codex mcp list
```

## Kiểm tra kết nối

Gọi tool `shop_health`. Kết quả mong muốn:

```json
{
  "status": "ok",
  "database": "connected",
  "databaseName": "marseille04_shop"
}
```

Nếu báo lỗi MongoDB, cần chạy MongoDB local hoặc Docker trước rồi mở lại Codex.

## Lưu ý bảo mật

- MCP tool đọc dữ liệu trực tiếp từ MongoDB, nên chỉ bật trong môi trường tin cậy.
- `default_tools_approval_mode = "prompt"` giúp Codex hỏi trước khi gọi tool.
- Không đưa thông tin bí mật thật vào `.codex/config.toml`; dùng biến môi trường khi triển khai nghiêm túc.
