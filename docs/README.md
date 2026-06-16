# Tài liệu dự án Marseille04 Shop

Thư mục này chứa tài liệu phân tích thiết kế, luồng nghiệp vụ, luồng code client, realtime notification, Docker, Docker Hub và CI/CD của dự án Marseille04 Shop.

## Tài liệu chính

- [README gốc dự án](../README.md): tổng quan dự án, tính năng, cách chạy local/Docker, seed data, API và troubleshooting.
- [Báo cáo phân tích thiết kế hệ thống](bao-cao-phan-tich-thiet-ke-he-thong.md): yêu cầu, use case, kiến trúc, cơ sở dữ liệu, UML, giao diện, kế hoạch triển khai và kiểm thử.
- [Bản Word của báo cáo phân tích thiết kế](bao-cao-phan-tich-thiet-ke-he-thong.docx): file `.docx` sinh từ cùng nguồn nội dung với bản Markdown.
- [Use case và luồng chính](use-cases-and-main-flows.md): actor, use case nghiệp vụ, điều kiện trước/sau và đặc tả các luồng chính.
- [Client code flow](client-code-flow.doc): tài liệu mô tả luồng code frontend, Redux, router, API service và realtime.
- [Realtime notifications](realtime-notifications.md): luồng thông báo realtime bằng SSE cho người dùng và sự kiện realtime cho admin.

## Tài liệu vận hành

- [Docker Hub build/push](docker-hub-guide.md): build image local, tag và push lên Docker Hub.
- [Pull từ Docker Hub](docker-hub-pull-guide.md): hướng dẫn cho người chỉ cần pull image về chạy, không cần source code.
- [GitHub Actions CI/CD](github-actions-docker-cicd.md): cấu hình secrets và workflow tự động build/push Docker image sau khi push code lên GitHub.

## Sơ đồ luồng chức năng

- [Redux overview](client-redux-overview.svg)
- [Redux initial load](client-redux-initial-load.svg)
- [Redux action flow](client-redux-action-flow.svg)
- [Use case overview](use-case-overview.svg)
- [Main auth/access flow](flow-main-auth-access.svg)
- [Main shopping/review flow](flow-main-shopping-review.svg)
- [Main cart/checkout flow](flow-main-cart-checkout.svg)
- [Main account/notification flow](flow-main-account-notification.svg)
- [Main contact/admin flow](flow-main-contact-admin.svg)
- [Auth flow](flow-auth.svg)
- [Password reset flow](flow-password-reset.svg)
- [Search/filter flow](flow-search-filter.svg)
- [Product detail flow](flow-product-detail.svg)
- [Account address/avatar flow](flow-account-address-avatar.svg)
- [Cart flow](flow-cart.svg)
- [Cart update flow](flow-cart-update.svg)
- [Checkout flow](flow-checkout.svg)
- [Order customer type flow](flow-order-customer-type.svg)
- [Review flow](flow-review.svg)
- [Contact flow](flow-contact.svg)
- [Admin flow](flow-admin.svg)
- [Inventory management flow](flow-inventory-management.svg)
- [Realtime notification flow](flow-realtime-notification.svg)
- [Admin realtime dashboard flow](flow-admin-realtime-dashboard.svg)

## Docker images

```txt
lequyet/marseille04-client:latest
lequyet/marseille04-server:latest
```

Chạy nhanh:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Truy cập:

```txt
http://localhost:5173
```

## Ghi chú cập nhật tài liệu

- Khi thay đổi báo cáo phân tích thiết kế, cập nhật `docs/generate-system-design-report.mjs` rồi chạy `node docs/generate-system-design-report.mjs` để đồng bộ `.md` và `.docx`.
- Khi thay đổi API, cập nhật `README.md`, `use-cases-and-main-flows.md` và tài liệu liên quan tới Docker/deploy nếu biến môi trường hoặc endpoint thay đổi.
- Khi thay đổi text đa ngôn ngữ, cập nhật thêm `client/src/i18n/translations/README.md`.
