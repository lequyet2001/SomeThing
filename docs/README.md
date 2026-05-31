# Tai lieu du an Marseille04 Shop

Thu muc nay chua tai lieu van hanh, Docker, CI/CD va cac so do luong code/client.

## Tai lieu chinh

- [README goc du an](../README.md): tong quan du an, cach chay local, Docker, seed data, API va troubleshooting.
- [Docker Hub build/push](docker-hub-guide.md): build image local, tag va push len Docker Hub.
- [Pull tu Docker Hub](docker-hub-pull-guide.md): huong dan cho nguoi chi can pull image ve chay, khong can source code.
- [GitHub Actions CI/CD](github-actions-docker-cicd.md): cau hinh secrets va workflow tu dong build/push Docker image sau khi push code len GitHub.
- [Use case va luong chinh](use-cases-and-main-flows.md): actor, use case nghiep vu, dieu kien truoc/sau va dac ta cac luong chinh.
- [Client code flow](client-code-flow.doc): tai lieu mo ta luong code frontend va Redux.
- [Realtime notifications](realtime-notifications.md): luong thong bao realtime bang SSE, API, Redux va cach van hanh.

## So do luong chuc nang

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
- [Search/filter flow](flow-search-filter.svg)
- [Product detail flow](flow-product-detail.svg)
- [Cart flow](flow-cart.svg)
- [Cart update flow](flow-cart-update.svg)
- [Checkout flow](flow-checkout.svg)
- [Review flow](flow-review.svg)
- [Contact flow](flow-contact.svg)
- [Admin flow](flow-admin.svg)
- [Realtime notification flow](flow-realtime-notification.svg)

## Docker images

```txt
lequyet/marseille04-client:latest
lequyet/marseille04-server:latest
```

Chay nhanh:

```powershell
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Truy cap:

```txt
http://localhost:5173
```
