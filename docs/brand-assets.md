# Brand assets

Tài liệu này mô tả các ảnh nhận diện đang dùng trong web Marseille04 Shop và kích thước phù hợp cho từng vị trí.

## Nguồn ảnh

| File | Vai trò |
| --- | --- |
| `client/scripts/assets/marseille04-logo-source.png` | Ảnh nguồn chất lượng cao dùng để sinh các biến thể |
| `client/scripts/create-logo-assets.ps1` | Script tạo lại toàn bộ ảnh logo/mark từ ảnh nguồn |

Chạy lại script khi cần tạo lại asset:

```powershell
cd client
powershell -File scripts/create-logo-assets.ps1
```

## Asset đang sử dụng

| Vị trí | File | Kích thước | Cách dùng |
| --- | --- | ---: | --- |
| Header responsive | `client/public/brand/marseille04-logo-header.png` | `384x96` | Logo ngang, hiển thị trong `Header.tsx` |
| Footer | `client/public/brand/marseille04-logo-footer.png` | `640x160` | Logo ngang lớn hơn, hiển thị trong `Footer.tsx` |
| Favicon | `client/public/favicon.png` | `64x64` | Icon tab trình duyệt trong `index.html` |
| Apple/shortcut icon | `client/public/brand/marseille04-mark-192.png` | `192x192` | Icon thiết bị/browser shortcut |
| PWA/large mark | `client/public/brand/marseille04-mark-512.png` | `512x512` | Icon kích thước lớn nếu cần mở rộng PWA |
| Social share | `client/public/brand/marseille04-logo-og.png` | `1200x630` | Ảnh Open Graph khi chia sẻ link |

## Quy ước sử dụng

- Header dùng logo ngang có nền trong suốt, đặt trong vùng cao khoảng `48-64px`.
- Footer dùng logo ngang lớn hơn để cân bằng với nội dung mô tả và thông tin liên hệ.
- Favicon/mark dùng bản vuông, không dùng logo ngang để tránh bị nhỏ và khó đọc.
- Open Graph dùng tỉ lệ `1200x630`, phù hợp Facebook/Zalo/LinkedIn preview.
- Không chỉnh trực tiếp asset đã sinh nếu chỉ cần đổi kích thước; chỉnh ảnh nguồn hoặc script rồi sinh lại.

## File đã tích hợp

- `client/src/components/Header.tsx`
- `client/src/components/Footer.tsx`
- `client/index.html`
