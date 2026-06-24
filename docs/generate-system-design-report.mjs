import fs from 'node:fs'
import path from 'node:path'

const outputDir = path.resolve('docs')
const markdownPath = path.join(outputDir, 'bao-cao-phan-tich-thiet-ke-he-thong.md')
const docxPath = path.join(outputDir, 'bao-cao-phan-tich-thiet-ke-he-thong.docx')

const reportMarkdown = `
# BÁO CÁO PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## Dự án: Marseille04 Shop - Website bán hàng thời trang

### Thông tin tài liệu

| Thuộc tính | Nội dung |
|---|---|
| Tên hệ thống | Marseille04 Shop |
| Loại hệ thống | Website thương mại điện tử kết hợp trang quản trị cửa hàng |
| Phạm vi tài liệu | Web client, Backend API, Cơ sở dữ liệu, kế toán nội bộ, Docker/CI-CD |
| Phạm vi loại trừ | Cổng thanh toán thật, tích hợp vận chuyển thật, hóa đơn điện tử/khai báo thuế thật |
| Ngôn ngữ tài liệu | Tiếng Việt |
| Cơ sở dữ liệu triển khai | MongoDB qua Mongoose |
| Ghi chú SQL | Phần SQL là mô hình quan hệ tham chiếu phục vụ tài liệu phân tích thiết kế |

## 1. Khảo sát và xác định yêu cầu

### 1.1 Phân tích bài toán và mục tiêu dự án

Marseille04 Shop là hệ thống bán hàng thời trang trực tuyến. Hệ thống cần hỗ trợ khách hàng tìm kiếm, xem sản phẩm, đăng ký tài khoản, đăng nhập, quản lý giỏ hàng, đặt hàng, theo dõi lịch sử mua hàng, gửi liên hệ hỗ trợ và nhận thông báo khi đơn hàng hoặc yêu cầu hỗ trợ thay đổi trạng thái. Ở phía cửa hàng, quản trị viên cần một không gian quản lý riêng để theo dõi doanh thu, đơn hàng, khách hàng, người dùng, kho hàng, danh mục, đánh giá, liên hệ, kế toán nội bộ và các thông báo cần xử lý.

Mục tiêu chính:

- Xây dựng một website bán hàng có trải nghiệm mua sắm rõ ràng, dễ dùng và hỗ trợ tiếng Việt/tiếng Anh.
- Tách biệt rõ chức năng khách hàng và chức năng quản trị.
- Cung cấp API backend có xác thực, phân quyền và kết nối MongoDB.
- Quản lý kho hàng theo sản phẩm, danh mục và lịch sử cập nhật kho.
- Bổ sung hệ thống kế toán nội bộ để theo dõi thu, chi, lợi nhuận, công nợ và báo cáo tài chính cơ bản cho đồ án.
- Tự động gửi thông báo khi admin cập nhật trạng thái đơn hàng hoặc liên hệ.
- Hỗ trợ triển khai bằng Docker và tự động build/push image qua CI/CD.

### 1.2 Phạm vi hệ thống

Phạm vi bao gồm:

- Website khách hàng: trang chủ, cửa hàng, chi tiết sản phẩm, giỏ hàng, thanh toán, liên hệ, tài khoản, thông báo.
- Website quản trị: tổng quan, đơn hàng, kho hàng, danh mục, lịch sử kho, khách hàng, người dùng, liên hệ, đánh giá, kế toán nội bộ.
- Backend API: xác thực, sản phẩm, giỏ hàng, đơn hàng, đánh giá, liên hệ, thông báo, quản trị.
- Database: MongoDB lưu người dùng, sản phẩm, giỏ hàng, đơn hàng, đánh giá, liên hệ, thông báo, danh mục, lịch sử kho, bút toán thu chi và báo cáo kế toán.
- Realtime notification: Server-Sent Events cho người dùng và admin.
- Upload file: ảnh sản phẩm, ảnh mô tả sản phẩm, ảnh review và avatar người dùng.
- Đa ngôn ngữ: tiếng Việt và tiếng Anh.
- Docker, Docker Compose, Docker Hub, CI/CD GitHub Actions.

Phạm vi không bao gồm:

- Cổng thanh toán thật với ngân hàng hoặc ví điện tử.
- Tích hợp vận chuyển thật.
- Phát hành hóa đơn điện tử thật, ký số, nộp báo cáo thuế hoặc tích hợp phần mềm kế toán bên thứ ba.

### 1.3 Tác nhân của hệ thống

| Actor | Mô tả |
|---|---|
| Khách vãng lai | Người chưa đăng nhập, có thể xem và tìm kiếm sản phẩm, gửi liên hệ, đặt hàng theo thông tin nhập thủ công nếu hệ thống cho phép |
| Khách hàng | Người đã đăng ký/đăng nhập, có thể quản lý giỏ hàng, địa chỉ, đặt hàng, đánh giá, xem lịch sử mua hàng và nhận thông báo |
| Quản trị viên | Người có role admin, quản lý toàn bộ nghiệp vụ cửa hàng, gồm quản lý kế toán nội bộ |
| Hệ thống thông báo | Thành phần server tạo và đẩy thông báo realtime |
| Dịch vụ lưu trữ file nội bộ | Thư mục uploads trên server dùng cho ảnh sản phẩm/review/avatar |
| Docker/CI-CD | Hạ tầng build, đóng gói và triển khai hệ thống |

### 1.4 Yêu cầu chức năng

| Mã | Nhóm chức năng | Yêu cầu |
|---|---|---|
| FR-01 | Tài khoản | Đăng ký tài khoản bằng tên, email, mật khẩu; mật khẩu được mã hóa phía client trước khi gửi |
| FR-02 | Tài khoản | Đăng nhập, lưu token và tải hồ sơ người dùng; mật khẩu gửi dạng passwordEncrypted |
| FR-03 | Tài khoản | Quên mật khẩu và đặt lại mật khẩu bằng token |
| FR-04 | Tài khoản | Cập nhật hồ sơ, avatar, số liên hệ, địa chỉ mặc định |
| FR-05 | Địa chỉ | Thêm, sửa, chọn địa chỉ giao hàng |
| FR-06 | Sản phẩm | Xem danh sách sản phẩm, danh mục, sản phẩm bán chạy |
| FR-07 | Sản phẩm | Tìm kiếm, lọc, sắp xếp sản phẩm theo giá |
| FR-08 | Sản phẩm | Xem chi tiết sản phẩm bằng slug có phân biệt sản phẩm trùng tên, hỗ trợ gallery ảnh mô tả |
| FR-09 | Đánh giá | Người dùng đăng nhập mới được gửi đánh giá sản phẩm, có thể đính kèm nhiều ảnh review |
| FR-10 | Giỏ hàng | Thêm, tăng/giảm số lượng, xóa sản phẩm, xóa toàn bộ giỏ |
| FR-11 | Mua hàng | Tạo đơn hàng từ giỏ hàng hoặc thông tin checkout |
| FR-12 | Thanh toán | Chọn phương thức thanh toán, ghi nhận trạng thái đơn hàng |
| FR-13 | Đơn hàng | Khách hàng xem lịch sử và chi tiết đơn hàng; hệ thống phân biệt đơn của khách đã đăng ký và khách chưa đăng ký |
| FR-14 | Liên hệ | Gửi yêu cầu hỗ trợ; nếu đã đăng nhập tự điền thông tin cá nhân |
| FR-15 | Thông báo | Người dùng xem, đánh dấu đã đọc, xóa thông báo |
| FR-16 | Realtime | Nhận thông báo ngay khi đơn hàng/liên hệ được admin cập nhật |
| FR-17 | Admin | Xem dashboard doanh thu, đơn hàng, tồn kho, liên hệ cần xử lý |
| FR-18 | Admin | Lọc thống kê theo tháng hoặc khoảng ngày |
| FR-19 | Admin | Quản lý đơn hàng, lọc theo trạng thái, thanh toán, ngày và loại khách |
| FR-20 | Admin | Quản lý kho hàng: sản phẩm, tồn kho, ảnh chính, ảnh mô tả, danh mục |
| FR-21 | Admin | Ghi lịch sử thêm/sửa/xóa sản phẩm, danh mục và trừ kho theo đơn hàng |
| FR-22 | Admin | Quản lý khách hàng và xem đơn hàng của từng khách |
| FR-23 | Admin | Quản lý người dùng, nâng/hạ quyền admin |
| FR-24 | Admin | Quản lý liên hệ và trạng thái xử lý |
| FR-25 | Admin | Quản lý đánh giá sản phẩm, lọc review có ảnh và xem dialog chi tiết |
| FR-26 | Kế toán | Ghi nhận doanh thu từ đơn đã thanh toán/hoàn thành và tạo bút toán thu tự động |
| FR-27 | Kế toán | Quản lý khoản chi như nhập hàng, vận hành, marketing, hoàn tiền và chi phí khác |
| FR-28 | Kế toán | Xem sổ quỹ, công nợ, báo cáo lãi lỗ theo tháng hoặc khoảng ngày |
| FR-29 | Kế toán | Đối soát doanh thu đơn hàng với phương thức thanh toán và trạng thái đơn |
| FR-30 | Quốc tế hóa | Chuyển đổi tiếng Việt/tiếng Anh bằng file JSON |

### 1.5 Yêu cầu phi chức năng

| Nhóm | Yêu cầu | Quyết định thiết kế |
|---|---|---|
| Bảo mật | Mật khẩu không lưu dạng rõ | Lưu passwordHash và passwordSalt |
| Bảo mật | Mật khẩu không gửi dạng rõ trong payload auth | Client lấy public key và mã hóa RSA-OAEP thành passwordEncrypted |
| Bảo mật | API admin chỉ cho role admin | Middleware requireAuth và requireAdmin |
| Bảo mật | Token reset mật khẩu không lưu dạng rõ | Lưu passwordResetTokenHash và thời gian hết hạn |
| Bảo mật | CORS cấu hình theo môi trường | CLIENT_ORIGIN trong server env |
| Hiệu năng | Tải dữ liệu admin không làm lệch giao diện | Loading skeleton và phân trang/lọc |
| Hiệu năng | Tìm kiếm/lọc phía client và truy vấn server theo mục | Redux cache, API phân trang cho khách hàng/đơn |
| Khả dụng | Giao diện chạy trên nhiều kích thước màn hình web | Tailwind responsive, layout quản trị dạng sidebar và bảng/card thích ứng |
| Dễ bảo trì | Tách module theo page, component, hook, service, slice | Client chia pages/components/hooks/store/services |
| Mở rộng | API tách theo route/controller/model | Express Router, Controller, Mongoose Model |
| Theo dõi | Ghi lịch sử kho và trạng thái xử lý | InventoryLog, UserNotification |
| Kế toán | Số liệu tài chính cần truy vết được nguồn gốc | AccountingTransaction liên kết đơn hàng, chi phí và người tạo |
| Triển khai | Có thể chạy local hoặc Docker Hub | Dockerfile, docker-compose, CI/CD |
| Quốc tế hóa | Dễ tìm và sửa text | Translation JSON theo namespace |

### 1.6 Giả định và ràng buộc

Giả định:

- Website phục vụ một cửa hàng thời trang, chưa cần multi-tenant.
- Mỗi sản phẩm có legacyId dạng số để giữ tương thích URL và dữ liệu cũ.
- Thanh toán hiện tại ghi nhận phương thức và trạng thái, chưa tích hợp gateway thật.
- Kế toán trong phạm vi đồ án là kế toán quản trị nội bộ, phục vụ theo dõi kinh doanh và báo cáo lãi lỗ cơ bản.
- Doanh thu kế toán được ghi nhận từ các đơn có trạng thái đã thanh toán hoặc hoàn thành; chi phí được nhập thủ công hoặc lấy từ nghiệp vụ kho nếu có dữ liệu giá vốn.
- Email reset mật khẩu trong môi trường đồ án có thể hiển thị/log token hoặc giả lập gửi email.
- Ảnh upload lưu tại server local trong thư mục uploads; môi trường production cần cân nhắc object storage.
- Review cho phép tối đa 4 ảnh, mỗi ảnh nhỏ hơn 2MB; ảnh sản phẩm và ảnh mô tả sản phẩm dùng giới hạn upload ảnh sản phẩm.

Ràng buộc:

- Backend sử dụng Node.js/Express và MongoDB.
- Frontend sử dụng React, TypeScript/TSX, Vite, Redux Toolkit, React Router và Tailwind CSS.
- Dữ liệu quản trị phải yêu cầu đăng nhập và role admin.
- Đơn có trường user được phân loại là khách đã đăng ký; đơn không có user được phân loại là khách chưa đăng ký.
- Doanh thu chỉ tính từ đơn đã thanh toán hoặc hoàn thành.
- Báo cáo kế toán không thay thế báo cáo thuế/hóa đơn điện tử hợp pháp.
- Khi đơn hàng ở trạng thái đang giao hoặc hoàn thành, hệ thống cập nhật tồn kho và ghi lịch sử kho.

## 2. Phân tích yêu cầu

### 2.1 Mô tả nghiệp vụ hiện tại

Quy trình bán hàng truyền thống thường gồm: khách xem sản phẩm qua kênh giới thiệu, hỏi thông tin qua tin nhắn, nhân viên xác nhận hàng còn hay hết, ghi đơn thủ công, cập nhật tồn kho bằng bảng tính và phản hồi trạng thái đơn hàng qua tin nhắn. Cách làm này có các hạn chế:

- Dữ liệu sản phẩm, đơn hàng và khách hàng phân tán.
- Tồn kho dễ sai lệch vì không có lịch sử cập nhật rõ ràng.
- Khách hàng khó tự theo dõi trạng thái đơn hàng.
- Admin khó thống kê doanh thu, sản phẩm bán chạy, khách hàng tiêu thụ nhiều.
- Chủ cửa hàng khó đối soát doanh thu, chi phí, lợi nhuận và công nợ nếu chỉ ghi nhận bằng bảng tính rời.
- Quá trình xử lý liên hệ và đánh giá thiếu trạng thái theo dõi.

### 2.2 Quy trình nghiệp vụ mới đề xuất

Quy trình mới:

1. Admin tạo danh mục và sản phẩm trong quản lý kho.
2. Khách hàng truy cập website, tìm kiếm/lọc/xem chi tiết sản phẩm.
3. Khách hàng đăng ký/đăng nhập để đồng bộ giỏ hàng và địa chỉ.
4. Khách hàng thêm sản phẩm vào giỏ, chọn địa chỉ giao hàng và phương thức thanh toán.
5. Hệ thống tạo đơn hàng, lưu thông tin khách, sản phẩm, tổng tiền, trạng thái và phân loại khách đã đăng ký/chưa đăng ký.
6. Admin xử lý đơn hàng trong trang quản lý.
7. Khi trạng thái đơn chuyển sang đang giao hoặc hoàn thành, hệ thống trừ kho một lần và ghi InventoryLog.
8. Khi đơn hàng đủ điều kiện ghi nhận doanh thu, hệ thống tạo bút toán thu hoặc đưa đơn vào danh sách đối soát kế toán.
9. Admin nhập các khoản chi như nhập hàng, vận hành, marketing, hoàn tiền hoặc chi phí khác.
10. Khi trạng thái đơn hàng/liên hệ thay đổi, hệ thống tạo UserNotification và đẩy realtime tới người dùng nếu đang online.
11. Admin xem thống kê theo tháng/khoảng ngày, quản lý khách hàng, đánh giá, liên hệ, người dùng và báo cáo kế toán nội bộ.

### 2.3 Danh sách Use Case

| Mã | Use Case | Actor chính | Mức ưu tiên |
|---|---|---|---|
| UC-01 | Đăng ký tài khoản | Khách vãng lai | Cao |
| UC-02 | Đăng nhập | Khách vãng lai | Cao |
| UC-03 | Quên/đặt lại mật khẩu | Khách vãng lai | Trung bình |
| UC-04 | Quản lý hồ sơ và địa chỉ | Khách hàng | Cao |
| UC-05 | Tìm kiếm, lọc, sắp xếp sản phẩm | Khách vãng lai, Khách hàng | Cao |
| UC-06 | Xem chi tiết sản phẩm | Khách vãng lai, Khách hàng | Cao |
| UC-07 | Đánh giá sản phẩm | Khách hàng | Trung bình |
| UC-08 | Quản lý giỏ hàng | Khách hàng | Cao |
| UC-09 | Đặt hàng và thanh toán | Khách hàng, Khách vãng lai | Cao |
| UC-10 | Xem lịch sử mua hàng | Khách hàng | Trung bình |
| UC-11 | Gửi liên hệ hỗ trợ | Khách vãng lai, Khách hàng | Trung bình |
| UC-12 | Quản lý thông báo cá nhân | Khách hàng | Trung bình |
| UC-13 | Xem dashboard quản trị | Quản trị viên | Cao |
| UC-14 | Quản lý đơn hàng | Quản trị viên | Cao |
| UC-15 | Quản lý kho hàng và danh mục | Quản trị viên | Cao |
| UC-16 | Quản lý khách hàng | Quản trị viên | Trung bình |
| UC-17 | Quản lý người dùng và phân quyền | Quản trị viên | Cao |
| UC-18 | Quản lý liên hệ và đánh giá | Quản trị viên | Trung bình |
| UC-19 | Quản lý kế toán nội bộ | Quản trị viên | Cao |

### 2.4 Đặc tả chi tiết Use Case

| Use Case | Tiền điều kiện | Luồng chính | Ngoại lệ | Hậu điều kiện |
|---|---|---|---|---|
| UC-01 Đăng ký | Email chưa tồn tại | Người dùng nhập tên/email/mật khẩu; client mã hóa password; server giải mã, kiểm tra; tạo User role customer; trả token | Email trùng, dữ liệu thiếu, mật khẩu yếu | Tài khoản được tạo và đăng nhập |
| UC-02 Đăng nhập | Tài khoản tồn tại | Nhập email/mật khẩu; client mã hóa password; server giải mã và kiểm tra hash; trả JWT; client lưu user/token | Sai thông tin, tài khoản không tồn tại | Người dùng vào hệ thống theo role |
| UC-03 Quên mật khẩu | Email đã đăng ký | Nhập email; server tạo token hash và hạn dùng; người dùng đặt mật khẩu mới | Token hết hạn/sai, email không tồn tại | Mật khẩu được thay đổi |
| UC-04 Hồ sơ/địa chỉ | Đã đăng nhập | Xem hồ sơ; sửa tên, phone, avatar; thêm/sửa/chọn địa chỉ giao hàng | Upload lỗi, dữ liệu địa chỉ thiếu | Hồ sơ và địa chỉ được cập nhật |
| UC-05 Tìm kiếm/lọc | Có danh sách sản phẩm | Nhập từ khóa; chọn danh mục; sắp xếp giá; client render kết quả | Không có kết quả | Danh sách phù hợp được hiển thị |
| UC-06 Chi tiết sản phẩm | Sản phẩm tồn tại | Mở URL slug; giải mã id; tải sản phẩm/review; hiển thị ảnh chính, gallery ảnh mô tả, giá, tồn kho | Slug/id sai, sản phẩm bị xóa | Người dùng thấy chi tiết sản phẩm |
| UC-07 Đánh giá | Đã đăng nhập | Chọn sao, nhập bình luận, chọn ảnh nếu có; gửi review; server lưu ảnh review và cập nhật rating | Chưa đăng nhập thì hiện popup login; rating ngoài 1-5; ảnh quá giới hạn | Review hiển thị trong sản phẩm |
| UC-08 Giỏ hàng | Đã đăng nhập | Thêm sản phẩm; cập nhật số lượng; xóa sản phẩm; đồng bộ server | Hết hàng, số lượng không hợp lệ | Cart lưu trong MongoDB và Redux |
| UC-09 Đặt hàng | Có sản phẩm cần mua | Chọn địa chỉ, phương thức thanh toán; tạo order; gắn user nếu đã đăng nhập; clear cart nếu cần | Thiếu thông tin giao hàng, sản phẩm không tồn tại | Order được tạo, khách nhận mã đơn và customerType |
| UC-10 Lịch sử mua | Đã đăng nhập | Tải /orders/me; xem danh sách và chi tiết | Chưa có đơn | Người dùng theo dõi đơn hàng |
| UC-11 Liên hệ | Có nội dung liên hệ | Nếu đăng nhập tự lấy thông tin; nhập chủ đề/nội dung; gửi contact | Thiếu message, message quá dài | ContactMessage được tạo |
| UC-12 Thông báo | Đã đăng nhập | Tải notifications; mở SSE stream; đánh dấu đọc/xóa | Token hết hạn, stream lỗi | Thông báo được đồng bộ |
| UC-13 Dashboard admin | Admin đăng nhập | Tải summary theo bộ lọc; hiển thị doanh thu, đơn, khách, tồn kho | Không có dữ liệu | Admin thấy tình hình kinh doanh |
| UC-14 Quản lý đơn | Admin đăng nhập | Lọc đơn theo status/payment/date/customerType; mở chi tiết; đổi trạng thái; gửi notification | Order không tồn tại; trạng thái sai | Order cập nhật, có thông báo cho khách |
| UC-15 Quản lý kho | Admin đăng nhập | Thêm/sửa/xóa sản phẩm; upload ảnh chính/ảnh mô tả; quản lý category; xem lịch sử kho | Upload quá lớn, category trùng, stock âm | Product/Category cập nhật và ghi InventoryLog |
| UC-16 Quản lý khách hàng | Admin đăng nhập | Lọc khách theo thời gian; mở chi tiết đơn; chuyển đến sản phẩm/khách tương ứng | Không có đơn theo lọc | Admin phân tích khách hàng |
| UC-17 Người dùng/role | Admin đăng nhập | Xem người dùng; lọc; nâng/hạ role admin | Không được tự phá admin cuối cùng nếu áp dụng rule mở rộng | Role người dùng thay đổi |
| UC-18 Liên hệ/đánh giá | Admin đăng nhập | Lọc liên hệ/review; lọc review có ảnh; mở dialog chi tiết review; cập nhật trạng thái liên hệ; xóa review vi phạm | Contact/review không tồn tại | Dữ liệu hỗ trợ và review được quản lý |
| UC-19 Kế toán nội bộ | Admin đăng nhập | Xem sổ quỹ; hệ thống ghi nhận doanh thu từ đơn hợp lệ; admin nhập chi phí; lọc báo cáo theo tháng/khoảng ngày; xem lãi lỗ và công nợ | Thiếu số tiền, loại bút toán sai, kỳ báo cáo không có dữ liệu | Bút toán kế toán và báo cáo tài chính nội bộ được cập nhật |

### 2.5 Use Case Diagram

~~~mermaid
flowchart LR
  Guest[Khách vãng lai]
  Customer[Khách hàng]
  Admin[Quản trị viên]
  Noti[Hệ thống thông báo]

  UC01((Đăng ký))
  UC02((Đăng nhập))
  UC03((Quên mật khẩu))
  UC05((Tìm kiếm/lọc sản phẩm))
  UC06((Xem sản phẩm))
  UC11((Gửi liên hệ))

  UC04((Quản lý hồ sơ/địa chỉ))
  UC07((Đánh giá sản phẩm))
  UC08((Quản lý giỏ hàng))
  UC09((Đặt hàng/thanh toán))
  UC10((Lịch sử mua hàng))
  UC12((Thông báo cá nhân))

  UC13((Dashboard quản trị))
  UC14((Quản lý đơn hàng))
  UC15((Quản lý kho/danh mục))
  UC16((Quản lý khách hàng))
  UC17((Quản lý người dùng))
  UC18((Quản lý liên hệ/đánh giá))
  UC19((Quản lý kế toán nội bộ))

  Guest --> UC01
  Guest --> UC02
  Guest --> UC03
  Guest --> UC05
  Guest --> UC06
  Guest --> UC11

  Customer --> UC04
  Customer --> UC05
  Customer --> UC06
  Customer --> UC07
  Customer --> UC08
  Customer --> UC09
  Customer --> UC10
  Customer --> UC11
  Customer --> UC12

  Admin --> UC13
  Admin --> UC14
  Admin --> UC15
  Admin --> UC16
  Admin --> UC17
  Admin --> UC18
  Admin --> UC19

  UC14 --> Noti
  UC18 --> Noti
  Noti --> UC12
~~~

## 3. Thiết kế hệ thống

### 3.1 Kiến trúc đề xuất

Hệ thống dùng kiến trúc 3 lớp kết hợp SPA:

| Lớp | Thành phần | Trách nhiệm |
|---|---|---|
| Presentation | React + TypeScript + Vite + Redux + React Router + Tailwind | Render UI khách hàng/admin, điều hướng, quản lý state client |
| Application/API | Node.js + Express | Xác thực, xử lý nghiệp vụ, phân quyền, upload, realtime SSE |
| Data | MongoDB + Mongoose | Lưu dữ liệu nghiệp vụ và audit log |
| Deployment | Docker, Docker Compose, GitHub Actions | Đóng gói, chạy local/production, tự động build/push image |

Lý do chọn kiến trúc:

- SPA phù hợp với trải nghiệm mua sắm cần chuyển trang nhanh và giữ state giỏ hàng/thông báo.
- Express Router/Controller/Model giúp backend dễ tách module theo nghiệp vụ.
- MongoDB phù hợp với dữ liệu đơn hàng có items, địa chỉ, metadata thông báo và lịch sử thay đổi dạng linh hoạt.
- SSE đủ nhẹ cho realtime một chiều từ server tới client, không cần WebSocket khi chỉ cần thông báo.

### 3.2 Module chính

| Module | Thành phần chính | Mô tả |
|---|---|---|
| Auth | authRoutes, authController, User | Đăng ký, đăng nhập, profile, reset password |
| Catalog | productRoutes, Product, Category | Danh sách sản phẩm, danh mục, chi tiết |
| Cart | cartRoutes, Cart | Đồng bộ giỏ hàng người dùng |
| Order | orderRoutes, Order | Tạo đơn, xem đơn cá nhân, tra cứu mã đơn |
| Review | reviewRoutes, Review | Xem và tạo đánh giá, lưu ảnh review |
| Contact | contactRoutes, ContactMessage | Gửi và xem liên hệ cá nhân |
| Notification | notificationRoutes, UserNotification, SSE | Thông báo cá nhân và realtime |
| Admin | adminRoutes, adminController | Dashboard, đơn hàng, khách hàng, user, contact, review |
| Inventory Admin | inventoryAdminController, InventoryLog | Quản lý kho, category, upload ảnh chính/ảnh mô tả, lịch sử kho |
| Accounting | accountingController, AccountingTransaction, ExpenseCategory | Ghi nhận thu/chi, đối soát doanh thu, báo cáo lãi lỗ và công nợ nội bộ |
| Client Store | Redux slices | user, catalog, cart, orders, contacts, reviews, notifications, UI |
| i18n | translations JSON | Text tiếng Việt/tiếng Anh |

### 3.3 Luồng dữ liệu giữa các module

1. Client mở ứng dụng, Redux gọi API tải profile, catalog, cart, orders, notifications.
2. User thao tác ở UI, action/hook gọi shopApi.
3. shopApi gắn token nếu có và gửi request tới Express API.
4. Controller kiểm tra dữ liệu, quyền truy cập và gọi Mongoose Model.
5. MongoDB trả dữ liệu; controller serialize response về client.
6. Redux cập nhật state, component tự render lại.
7. Với cập nhật đơn hàng/liên hệ, server tạo UserNotification và emit SSE.
8. Với đơn hàng đã thanh toán/hoàn thành, server tạo hoặc cập nhật AccountingTransaction để ghi nhận doanh thu nội bộ.
9. Client nhận event, thêm thông báo vào Redux và hiển thị popup/badge.

### 3.4 Thiết kế API

Base URL: /api/shop

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| GET | /password-public-key | Public | Lấy public key RSA-OAEP để mã hóa mật khẩu |
| POST | /register | Public | Đăng ký với passwordEncrypted |
| POST | /login | Public | Đăng nhập với passwordEncrypted |
| POST | /forgot-password | Public | Tạo token reset mật khẩu |
| POST | /reset-password/:token | Public | Đặt lại mật khẩu với passwordEncrypted |
| GET | /me | User | Lấy hồ sơ |
| PUT | /me | User | Cập nhật hồ sơ, avatar, địa chỉ |
| GET | /categories | Public | Lấy danh mục |
| GET | /products?page&limit&category&query&sort | Public | Lấy danh sách sản phẩm phân trang, mặc định 10 sản phẩm/trang |
| GET | /products/:productId | Public | Lấy chi tiết sản phẩm |
| GET | /reviews?productId=:id | Public | Lấy review theo sản phẩm |
| POST | /reviews | User | Tạo review, tùy chọn mảng ảnh review |
| GET | /cart | User | Lấy giỏ hàng |
| POST | /cart/items | User | Thêm sản phẩm vào giỏ |
| PATCH | /cart/items/:productId | User | Cập nhật số lượng |
| DELETE | /cart/items/:productId | User | Xóa item |
| DELETE | /cart | User | Xóa giỏ |
| POST | /orders | Optional User | Tạo đơn hàng, trả customerType |
| GET | /orders/me | User | Lịch sử đơn hàng |
| GET | /orders/:orderCode | Optional User | Tra cứu đơn |
| POST | /contact | Optional User | Gửi liên hệ |
| GET | /contacts/me | User | Liên hệ của tôi |
| GET | /notifications | User | Danh sách thông báo |
| GET | /notifications/stream | Token | SSE thông báo cá nhân |
| PATCH | /notifications/:id/read | User | Đánh dấu đã đọc |
| PATCH | /notifications/read-all | User | Đánh dấu tất cả |
| DELETE | /notifications/:id | User | Xóa thông báo |
| GET | /admin/events/stream | Admin token | SSE sự kiện admin |
| GET | /admin/summary | Admin | Dashboard |
| GET | /admin/orders?status&payment&customerType&startDate&endDate | Admin | Danh sách đơn có lọc loại khách |
| PATCH | /admin/orders/:orderCode/status | Admin | Cập nhật trạng thái đơn |
| GET | /admin/customers | Admin | Thống kê khách hàng |
| GET | /admin/users | Admin | Danh sách user |
| PATCH | /admin/users/:userId/role | Admin | Đổi role |
| GET | /admin/contacts | Admin | Danh sách liên hệ |
| PATCH | /admin/contacts/:contactId/status | Admin | Cập nhật trạng thái liên hệ |
| GET | /admin/reviews | Admin | Danh sách review, hỗ trợ lọc số sao và có/không có ảnh |
| DELETE | /admin/reviews/:reviewId | Admin | Xóa review |
| GET | /admin/categories | Admin | Danh sách category |
| POST | /admin/categories | Admin | Thêm category |
| PATCH | /admin/categories/:categoryName | Admin | Sửa category |
| DELETE | /admin/categories/:categoryName | Admin | Xóa category |
| GET | /admin/products | Admin | Danh sách kho |
| POST | /admin/uploads/product-image | Admin | Upload ảnh sản phẩm |
| POST | /admin/products | Admin | Thêm sản phẩm |
| PATCH | /admin/products/:productId | Admin | Sửa sản phẩm/tồn kho |
| DELETE | /admin/products/:productId | Admin | Xóa sản phẩm |
| GET | /admin/inventory-history | Admin | Lịch sử kho |
| GET | /admin/accounting/summary?month&startDate&endDate | Admin | Báo cáo doanh thu, chi phí, lợi nhuận, công nợ |
| GET | /admin/accounting/transactions?type&category&startDate&endDate | Admin | Danh sách bút toán thu/chi |
| POST | /admin/accounting/transactions | Admin | Thêm khoản thu/chi thủ công |
| PATCH | /admin/accounting/transactions/:transactionId | Admin | Sửa bút toán thủ công |
| DELETE | /admin/accounting/transactions/:transactionId | Admin | Xóa bút toán thủ công |
| GET | /admin/accounting/expense-categories | Admin | Danh mục chi phí kế toán |

### 3.5 Công nghệ sử dụng

| Nhóm | Công nghệ | Lý do |
|---|---|---|
| Frontend | React, TypeScript/TSX, Vite | Build nhanh, SPA dễ mở rộng, kiểm soát type tốt hơn |
| State | Redux Toolkit | Quản lý state dùng chung, giảm truyền props sâu |
| Routing | React Router | Tách route khách hàng/admin rõ ràng |
| Styling/UI | Tailwind CSS, Headless UI, Lucide React | Style nằm gần component, dialog/menu dễ truy cập, icon nhất quán |
| Form validation | React Hook Form, Zod | Validate form rõ ràng, giảm lỗi submit và dễ typed payload |
| Table/Chart | TanStack Table, Recharts | Bảng quản trị responsive, thống kê có biểu đồ cột/list |
| Backend | Node.js, Express | API REST dễ triển khai |
| Database | MongoDB, Mongoose | Schema linh hoạt, phù hợp order/cart/log |
| Auth | JWT + password hash/salt | Phân quyền stateless |
| Realtime | Server-Sent Events | Phù hợp thông báo một chiều |
| Upload | Multer/static uploads | Lưu ảnh sản phẩm/avatar trên server |
| Deployment | Docker, Nginx, Docker Compose | Đóng gói client/server/mongo |
| CI/CD | GitHub Actions + Docker Hub | Tự động build/push image |

## 4. Thiết kế cơ sở dữ liệu

### 4.1 Thực thể và thuộc tính

| Entity | Thuộc tính chính | Mô tả |
|---|---|---|
| User | name, email, passwordHash, passwordSalt, avatar, phone, address, role | Người dùng và admin |
| ShippingAddress | id, label, recipient, phone, address | Địa chỉ giao hàng nhúng trong User |
| Product | legacyId, name, category, price, rating, stock, image, images, description | Sản phẩm/kho hàng |
| Category | name | Danh mục sản phẩm |
| Cart | user, items | Giỏ hàng theo user |
| CartItem | productId, quantity | Item trong giỏ |
| Order | orderCode, user, customer, items, payment, status, subtotal, shipping, total | Đơn hàng; customerType được suy ra từ user |
| OrderItem | productId, name, price, quantity, image | Snapshot sản phẩm khi đặt hàng |
| Review | productId, user, name, rating, comment, images | Đánh giá sản phẩm |
| ContactMessage | user, name, email, phone, topic, message, status | Liên hệ/yêu cầu hỗ trợ |
| UserNotification | user, type, title, message, link, metadata, readAt | Thông báo người dùng |
| InventoryLog | action, actor, entityType, productId, stock, changes, orderCode | Lịch sử kho/danh mục |
| AccountingTransaction | type, source, category, amount, paymentMethod, orderCode, note, createdBy | Bút toán thu/chi nội bộ |
| ExpenseCategory | name, type, description | Danh mục khoản chi/khoản thu dùng cho kế toán |

Ghi chú: customerType là trường API trả về khi serialize order. Hệ thống không cần lưu riêng vì có thể suy ra: có order.user là registered, không có order.user là guest.

### 4.2 Khóa chính và khóa ngoại

| Entity | Khóa chính | Khóa ngoại/tham chiếu |
|---|---|---|
| User | _id | Không có |
| ShippingAddress | id | user._id nếu tách bảng quan hệ |
| Product | _id, legacyId unique | category tham chiếu Category.name ở mức logic |
| Category | _id, name unique | Không có |
| Cart | _id | user -> User._id |
| CartItem | cart_id + productId | cart -> Cart, productId -> Product.legacyId |
| Order | _id, orderCode unique | user -> User._id |
| OrderItem | order_id + productId | order -> Order, productId -> Product.legacyId |
| Review | _id | user -> User._id, productId -> Product.legacyId |
| ContactMessage | _id | user -> User._id |
| UserNotification | _id | user -> User._id |
| InventoryLog | _id | productId -> Product.legacyId theo logic |
| AccountingTransaction | _id | order -> Order._id, createdBy -> User._id |
| ExpenseCategory | _id, name unique | Không có |

### 4.3 ERD

~~~mermaid
erDiagram
  USERS ||--o{ SHIPPING_ADDRESSES : has
  USERS ||--o| CARTS : owns
  CARTS ||--o{ CART_ITEMS : contains
  PRODUCTS ||--o{ CART_ITEMS : referenced_by
  USERS ||--o{ ORDERS : places
  ORDERS ||--o{ ORDER_ITEMS : contains
  PRODUCTS ||--o{ ORDER_ITEMS : snapshot_of
  USERS ||--o{ REVIEWS : writes
  PRODUCTS ||--o{ REVIEWS : receives
  USERS ||--o{ CONTACT_MESSAGES : sends
  USERS ||--o{ USER_NOTIFICATIONS : receives
  PRODUCTS ||--o{ INVENTORY_LOGS : has
  CATEGORIES ||--o{ PRODUCTS : groups
  USERS ||--o{ ACCOUNTING_TRANSACTIONS : creates
  ORDERS ||--o{ ACCOUNTING_TRANSACTIONS : generates
  EXPENSE_CATEGORIES ||--o{ ACCOUNTING_TRANSACTIONS : classifies

  USERS {
    objectId id PK
    string name
    string email UK
    string role
    string avatar
    string phone
    string address
  }
  PRODUCTS {
    objectId id PK
    number legacyId UK
    string name
    string category
    number price
    number stock
    string image
  }
  ORDERS {
    objectId id PK
    string orderCode UK
    objectId user FK
    string payment
    string status
    number total
  }
  INVENTORY_LOGS {
    objectId id PK
    string action
    number productId
    number previousStock
    number newStock
    string orderCode
  }
  ACCOUNTING_TRANSACTIONS {
    objectId id PK
    string type
    string source
    decimal amount
    string category
    string orderCode
  }
  EXPENSE_CATEGORIES {
    objectId id PK
    string name UK
    string type
  }
~~~

### 4.4 SQL tạo bảng tham chiếu

Lưu ý: hệ thống triển khai thật bằng MongoDB/Mongoose. SQL dưới đây là mô hình quan hệ tham chiếu để mô tả cấu trúc dữ liệu trong tài liệu phân tích thiết kế.

~~~sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_reset_token_hash TEXT,
  password_reset_expires_at TIMESTAMP NULL,
  avatar TEXT,
  phone VARCHAR(30),
  address TEXT,
  selected_address_id VARCHAR(80),
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CHECK (role IN ('customer', 'admin'))
);

CREATE TABLE shipping_addresses (
  id VARCHAR(80) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  label VARCHAR(120) NOT NULL,
  recipient VARCHAR(120),
  phone VARCHAR(30),
  address TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  legacy_id INT NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  image TEXT NOT NULL,
  images_json TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE carts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
  cart_id VARCHAR(36) NOT NULL,
  product_legacy_id INT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (cart_id, product_legacy_id),
  FOREIGN KEY (cart_id) REFERENCES carts(id),
  FOREIGN KEY (product_legacy_id) REFERENCES products(legacy_id),
  CHECK (quantity >= 1)
);

CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_code VARCHAR(60) NOT NULL UNIQUE,
  user_id VARCHAR(36),
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(180) NOT NULL,
  customer_phone VARCHAR(30),
  customer_address TEXT NOT NULL,
  payment VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  inventory_applied_at TIMESTAMP NULL,
  inventory_applied_status VARCHAR(30),
  subtotal DECIMAL(12,2) NOT NULL,
  shipping DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (status IN ('confirmed', 'paid', 'shipping', 'completed', 'cancelled'))
);

CREATE TABLE order_items (
  order_id VARCHAR(36) NOT NULL,
  product_legacy_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  image TEXT NOT NULL,
  PRIMARY KEY (order_id, product_legacy_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  CHECK (quantity >= 1)
);

CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_legacy_id INT NOT NULL,
  user_id VARCHAR(36),
  name VARCHAR(120) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  images_json TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (product_legacy_id) REFERENCES products(legacy_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE contact_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(30),
  topic VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (status IN ('new', 'processing', 'done'))
);

CREATE TABLE user_notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'system',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata_json TEXT,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (type IN ('order', 'contact', 'system'))
);

CREATE TABLE inventory_logs (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(40) NOT NULL,
  actor_id VARCHAR(80),
  actor_name VARCHAR(120),
  actor_email VARCHAR(180),
  entity_type VARCHAR(20) NOT NULL DEFAULT 'product',
  product_legacy_id INT,
  product_name VARCHAR(200),
  product_category VARCHAR(120),
  category_name VARCHAR(120),
  order_code VARCHAR(60),
  previous_stock INT,
  new_stock INT,
  delta INT,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE inventory_log_changes (
  id VARCHAR(36) PRIMARY KEY,
  inventory_log_id VARCHAR(36) NOT NULL,
  field VARCHAR(120) NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  FOREIGN KEY (inventory_log_id) REFERENCES inventory_logs(id)
);

CREATE TABLE expense_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL DEFAULT 'expense',
  description TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CHECK (type IN ('income', 'expense'))
);

CREATE TABLE accounting_transactions (
  id VARCHAR(36) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  category_id VARCHAR(36),
  order_id VARCHAR(36),
  order_code VARCHAR(60),
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(80),
  note TEXT,
  transaction_date TIMESTAMP NOT NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  CHECK (type IN ('income', 'expense')),
  CHECK (source IN ('order', 'manual', 'refund', 'inventory'))
);
~~~

## 5. Thiết kế UML

### 5.1 Class Diagram

~~~mermaid
classDiagram
  class User {
    +String name
    +String email
    +String role
    +String avatar
    +String phone
    +String address
    +ShippingAddress[] shippingAddresses
  }
  class ShippingAddress {
    +String id
    +String label
    +String recipient
    +String phone
    +String address
  }
  class Product {
    +Number legacyId
    +String name
    +String category
    +Number price
    +Number rating
    +Number stock
    +String image
    +String[] images
    +String description
  }
  class Cart {
    +ObjectId user
    +CartItem[] items
  }
  class CartItem {
    +Number productId
    +Number quantity
  }
  class Order {
    +String orderCode
    +ObjectId user
    +Customer customer
    +OrderItem[] items
    +String payment
    +String status
    +Number total
    +getCustomerType()
  }
  class Review {
    +Number productId
    +ObjectId user
    +Number rating
    +String comment
    +String[] images
  }
  class ContactMessage {
    +ObjectId user
    +String topic
    +String message
    +String status
  }
  class UserNotification {
    +ObjectId user
    +String type
    +String title
    +Date readAt
  }
  class InventoryLog {
    +String action
    +String entityType
    +Number productId
    +String orderCode
    +Change[] changes
  }
  class AccountingTransaction {
    +String type
    +String source
    +Number amount
    +String paymentMethod
    +String orderCode
    +Date transactionDate
  }
  class ExpenseCategory {
    +String name
    +String type
    +String description
  }

  User "1" --> "*" ShippingAddress
  User "1" --> "0..1" Cart
  Cart "1" --> "*" CartItem
  Product "1" --> "*" CartItem
  User "1" --> "*" Order
  Order "1" --> "*" OrderItem
  Product "1" --> "*" Review
  User "1" --> "*" Review
  User "1" --> "*" ContactMessage
  User "1" --> "*" UserNotification
  Product "1" --> "*" InventoryLog
  User "1" --> "*" AccountingTransaction
  Order "1" --> "*" AccountingTransaction
  ExpenseCategory "1" --> "*" AccountingTransaction
~~~

### 5.2 Sequence Diagram - Đăng nhập

~~~mermaid
sequenceDiagram
  actor User as Người dùng
  participant UI as React AuthPage
  participant API as Express Auth API
  participant DB as MongoDB User

  User->>UI: Nhập email và mật khẩu
  UI->>API: GET /api/shop/password-public-key
  API-->>UI: Public key RSA-OAEP
  UI->>UI: Mã hóa mật khẩu thành passwordEncrypted
  UI->>API: POST /api/shop/login
  API->>API: Giải mã passwordEncrypted
  API->>DB: Tìm user theo email, lấy passwordHash/Salt
  DB-->>API: User
  API->>API: So khớp mật khẩu và tạo JWT
  API-->>UI: Token + thông tin user
  UI->>UI: Lưu Redux/localStorage
  UI-->>User: Chuyển về trang phù hợp
~~~

### 5.3 Sequence Diagram - Đặt hàng

~~~mermaid
sequenceDiagram
  actor Customer as Khách hàng
  participant Checkout as CheckoutPage
  participant API as Order API
  participant ProductDB as Product
  participant OrderDB as Order
  participant CartDB as Cart

  Customer->>Checkout: Chọn địa chỉ và phương thức thanh toán
  Checkout->>API: POST /api/shop/orders
  API->>ProductDB: Kiểm tra sản phẩm và giá hiện tại
  ProductDB-->>API: Danh sách sản phẩm
  API->>OrderDB: Tạo Order với snapshot items, gắn user nếu có token
  API->>CartDB: Xóa giỏ nếu order từ cart
  API-->>Checkout: OrderCode, tổng tiền và customerType
  Checkout-->>Customer: Hiển thị trang thanh toán/kết quả
~~~

### 5.4 Sequence Diagram - Admin cập nhật đơn và thông báo realtime

~~~mermaid
sequenceDiagram
  actor Admin as Quản trị viên
  participant AdminUI as Admin Orders
  participant API as Admin API
  participant OrderDB as Order
  participant Inv as InventoryLog/Product
  participant Noti as Notification Service
  participant UserUI as Client đang online

  Admin->>AdminUI: Đổi trạng thái đơn hàng
  AdminUI->>API: PATCH /admin/orders/:orderCode/status
  API->>OrderDB: Cập nhật status
  alt status là shipping hoặc completed
    API->>Inv: Trừ tồn kho một lần và ghi InventoryLog
  end
  API->>Noti: Tạo UserNotification
  Noti-->>UserUI: SSE event notification
  API-->>AdminUI: Order mới + message
~~~

### 5.5 Sequence Diagram - Ghi nhận kế toán nội bộ

~~~mermaid
sequenceDiagram
  actor Admin as Quản trị viên
  participant AdminUI as Admin Orders/Accounting
  participant API as Admin API
  participant OrderDB as Order
  participant Acc as Accounting Service
  participant AccDB as AccountingTransaction

  Admin->>AdminUI: Cập nhật đơn sang paid hoặc completed
  AdminUI->>API: PATCH /admin/orders/:orderCode/status
  API->>OrderDB: Lưu trạng thái đơn hàng
  API->>Acc: Kiểm tra điều kiện ghi nhận doanh thu
  Acc->>AccDB: Tạo hoặc cập nhật bút toán income nguồn order
  API-->>AdminUI: Trả đơn hàng và số liệu mới
  Admin->>AdminUI: Nhập khoản chi vận hành/nhập hàng
  AdminUI->>API: POST /admin/accounting/transactions
  API->>AccDB: Lưu bút toán expense thủ công
  API-->>AdminUI: Cập nhật báo cáo lãi lỗ
~~~

### 5.6 Activity Diagram - Quy trình mua hàng

~~~mermaid
flowchart TD
  A[Bắt đầu] --> B[Xem/tìm sản phẩm]
  B --> C{Muốn mua?}
  C -- Không --> B
  C -- Có --> D[Thêm vào giỏ]
  D --> E[Đăng nhập hoặc nhập thông tin]
  E --> F[Chọn địa chỉ giao hàng]
  F --> G[Chọn phương thức thanh toán]
  G --> H[Kiểm tra đơn]
  H --> I{Dữ liệu hợp lệ?}
  I -- Không --> F
  I -- Có --> J[Tạo đơn hàng]
  J --> K[Hiển thị mã đơn]
  K --> L[Kết thúc]
~~~

### 5.7 Activity Diagram - Quản lý kho

~~~mermaid
flowchart TD
  A[Admin vào Kho hàng] --> B{Chọn tab}
  B --> C[Danh sách kho]
  B --> D[Danh mục]
  B --> E[Lịch sử kho]
  C --> F[Thêm/Sửa/Xóa sản phẩm]
  F --> G[Upload ảnh nếu có]
  G --> H[Lưu Product]
  H --> I[Ghi InventoryLog]
  D --> J[Thêm/Sửa/Xóa category]
  J --> I
  E --> K[Lọc theo hành động/ngày/từ khóa]
  K --> L[Mở chi tiết log]
~~~

### 5.8 Component Diagram

~~~mermaid
flowchart LR
  subgraph Client[React Web Client]
    Pages[Pages]
    Components[Components]
    Store[Redux Store]
    ApiClient[shopApi Service]
    I18n[Language JSON]
  end

  subgraph Server[Express Server]
    Routes[Routes]
    Controllers[Controllers]
    Middleware[Auth/Error Middleware]
    SSE[SSE Notification]
    Uploads[Uploads Static]
  end

  subgraph Data[MongoDB]
    Models[Mongoose Models]
  end

  Pages --> Components
  Pages --> Store
  Store --> ApiClient
  ApiClient --> Routes
  Routes --> Middleware
  Routes --> Controllers
  Controllers --> Models
  Controllers --> SSE
  Controllers --> Uploads
  Models --> Data
  I18n --> Pages
~~~

## 6. Thiết kế giao diện

### 6.1 Danh sách màn hình

| Màn hình | Actor | Chức năng |
|---|---|---|
| Home | Tất cả | Hiển thị sản phẩm nổi bật, danh mục bán chạy, điều hướng mua sắm |
| Shop | Tất cả | Tìm kiếm, lọc danh mục, sắp xếp giá, phân trang sản phẩm |
| Product Detail | Tất cả | Xem ảnh chính, gallery ảnh mô tả, giá, mô tả, tồn kho, review, thêm giỏ |
| Login/Register/Forgot/Reset | Khách | Xác thực tài khoản |
| Cart | Khách hàng | Xem và chỉnh giỏ hàng |
| Checkout | Khách hàng | Chọn địa chỉ, phương thức thanh toán, tạo đơn |
| Payment | Khách hàng | Hiển thị thông tin thanh toán/kết quả đơn |
| Account | Khách hàng | Hồ sơ, avatar, địa chỉ, lịch sử đơn, liên hệ, thông báo |
| Contact | Tất cả | Gửi yêu cầu hỗ trợ |
| Admin Overview | Admin | Dashboard doanh thu, đơn, tồn kho, khách hàng |
| Admin Orders | Admin | Lọc đơn, xem chi tiết, cập nhật trạng thái |
| Admin Inventory | Admin | Quản lý mặt hàng kho, danh mục, lịch sử kho |
| Admin Customers | Admin | Thống kê khách hàng, đơn đã mua |
| Admin Users | Admin | Lọc user, đổi role |
| Admin Contacts | Admin | Lọc và cập nhật trạng thái liên hệ |
| Admin Reviews | Admin | Lọc đánh giá, lọc review có ảnh, mở dialog chi tiết, xóa đánh giá |
| Admin Accounting | Admin | Quản lý sổ thu/chi, đối soát doanh thu, chi phí, lợi nhuận và công nợ |

### 6.2 Đề xuất bố cục UI/UX

Nguyên tắc:

- Giao diện khách hàng ưu tiên hình ảnh sản phẩm, CTA rõ ràng, giỏ hàng dễ thấy.
- Giao diện admin ưu tiên đọc dữ liệu nhanh, sidebar bên trái, bảng có filter, loading skeleton khi chưa tải xong.
- Logo dùng đúng biến thể theo vị trí: header 384x96, footer 640x160, favicon/mark dạng vuông và Open Graph 1200x630.
- Các thao tác nguy hiểm như xóa sản phẩm/category/review phải có popup xác nhận.
- Sau thao tác admin phải có toast thông báo thành công/thất bại.
- Text lấy từ hệ thống i18n JSON để dễ đổi ngôn ngữ.

### 6.3 Wireframe văn bản

#### Shop Page

~~~text
+------------------------------------------------------------+
| Header: Logo | Shop | Contact | Account | Cart | Language |
+------------------------------------------------------------+
| Filter: Search box | Category select | Sort price          |
+------------------------------------------------------------+
| Product Card | Product Card | Product Card | Product Card  |
| Product Card | Product Card | Product Card | Product Card  |
+------------------------------------------------------------+
| Pagination: 1 2 3 ...                                      |
+------------------------------------------------------------+
| Footer                                                     |
+------------------------------------------------------------+
~~~

#### Product Detail

~~~text
+------------------------------------------------------------+
| Breadcrumb / Back                                          |
+-------------------------+----------------------------------+
| Product Image/Gallery   | Name, Rating, Price              |
|                         | Stock status                     |
|                         | Quantity / Add Cart              |
+-------------------------+----------------------------------+
| Description                                                |
+------------------------------------------------------------+
| Reviews: star input, ảnh review, comment list              |
+------------------------------------------------------------+
~~~

#### Admin Layout

~~~text
+----------------------+-------------------------------------+
| Sidebar Admin Tabs   | Hero + Refresh                      |
| - Overview           +-------------------------------------+
| - Orders             | Metrics cards                       |
| - Inventory          +-------------------------------------+
|   + Items            | Current admin section               |
|   + Categories       | Filter + Table/Card/List            |
|   + History          | Dialogs/Toast                       |
| - Customers          |                                     |
| - Users              |                                     |
| - Contacts           |                                     |
| - Reviews            |                                     |
| - Accounting         |                                     |
+----------------------+-------------------------------------+
~~~

## 7. Kế hoạch triển khai

### 7.1 Giai đoạn thực hiện

| Giai đoạn | Nội dung | Thời gian ước lượng |
|---|---|---|
| 1. Khởi tạo | Thiết lập React, Express, MongoDB, Docker, cấu trúc thư mục | 3-5 ngày |
| 2. Khách hàng cơ bản | Home, Shop, Product, Auth, Cart | 7-10 ngày |
| 3. Mua hàng | Checkout, Order, Payment, lịch sử mua | 5-7 ngày |
| 4. Liên hệ/Review/Thông báo | Contact, Review, Notification, SSE | 5-7 ngày |
| 5. Admin | Dashboard, Orders, Inventory, Users, Contacts, Reviews, Accounting | 12-16 ngày |
| 6. Hoàn thiện UX | Responsive web, i18n, loading, popup, toast | 5-7 ngày |
| 7. Dữ liệu/Seed/Docker | Seed data, Docker Hub, CI/CD | 3-5 ngày |
| 8. Kiểm thử và tài liệu | Test case, sửa lỗi, viết tài liệu | 5-7 ngày |

Tổng ước lượng: 43-62 ngày công tùy số lượng nhân sự và mức hoàn thiện UI.

### 7.2 Nhân sự và vai trò

| Vai trò | Số lượng | Trách nhiệm |
|---|---:|---|
| Project Manager/System Analyst | 1 | Khảo sát yêu cầu, quản lý tiến độ, nghiệm thu |
| Frontend Developer | 1-2 | React/TypeScript UI, Tailwind, Redux, Router, responsive, i18n |
| Backend Developer | 1 | Express API, MongoDB, auth, admin, SSE |
| UI/UX Designer | 0.5-1 | Wireframe, style guide, trải nghiệm admin/khách hàng |
| QA/Tester | 1 | Test case, integration test, UAT |
| DevOps | 0.5 | Docker, CI/CD, env, deploy |

### 7.3 Rủi ro và phương án xử lý

| Rủi ro | Ảnh hưởng | Phương án xử lý |
|---|---|---|
| Sai lệch tồn kho khi cập nhật đơn nhiều lần | Cao | Dùng inventoryAppliedAt/inventoryAppliedStatus để trừ kho một lần |
| Upload ảnh quá lớn | Trung bình | Giới hạn payload, kiểm tra size client/server, tối ưu ảnh |
| CORS khi dùng tunnel/local API | Trung bình | Cấu hình CLIENT_ORIGIN theo môi trường |
| Token hết hạn làm SSE lỗi | Trung bình | Đóng stream, yêu cầu đăng nhập lại, retry khi token hợp lệ |
| Thống kê doanh thu sai trạng thái | Cao | Chỉ tính đơn paid/completed theo rule |
| Ghi nhận kế toán trùng doanh thu | Cao | Dùng khóa nguồn orderCode/source và chỉ tạo một bút toán income cho mỗi đơn hợp lệ |
| Báo cáo lãi lỗ sai do thiếu chi phí | Trung bình | Cho phép nhập chi phí thủ công, phân loại category và ghi người tạo/thời điểm |
| Dữ liệu seed không đồng bộ | Trung bình | Script seed/reset có kiểm soát, giữ admin |
| Layout admin nhảy khi đổi tab | Trung bình | Loading skeleton và DOM ổn định |
| Lộ biến môi trường | Cao | .gitignore, .env.example, không commit .env thật |

## 8. Kiểm thử

### 8.1 Test Case chức năng

| Mã | Chức năng | Dữ liệu kiểm thử | Kết quả mong đợi |
|---|---|---|---|
| TC-01 | Đăng ký | Email mới, mật khẩu hợp lệ, passwordEncrypted | Tạo user, trả token |
| TC-02 | Đăng ký trùng email | Email đã tồn tại | API trả lỗi rõ ràng |
| TC-03 | Đăng nhập | Email/password đúng, passwordEncrypted hợp lệ | Lưu user/token, vào hệ thống |
| TC-04 | Đăng nhập sai | Password sai hoặc passwordEncrypted lỗi | Không đăng nhập, hiện lỗi |
| TC-05 | Reset password | Token hợp lệ | Mật khẩu thay đổi |
| TC-06 | Tìm kiếm sản phẩm | Từ khóa có kết quả | Danh sách lọc đúng |
| TC-07 | Sắp xếp giá | Sort tăng/giảm | Thứ tự giá đúng |
| TC-08 | Chi tiết sản phẩm trùng tên | Slug có id mã hóa/phân biệt | Mở đúng sản phẩm |
| TC-09 | Review chưa login | Submit review | Hiện popup đăng nhập |
| TC-10 | Review đã login | Rating 1-5, comment hợp lệ, tùy chọn ảnh review | Review và ảnh được lưu |
| TC-11 | Thêm giỏ | Product còn hàng | Cart count và server cart cập nhật |
| TC-12 | Cập nhật giỏ | Quantity hợp lệ | Tổng tiền đúng |
| TC-13 | Đặt hàng | Có địa chỉ/payment | Tạo orderCode, lưu order, trả customerType |
| TC-14 | Lịch sử mua | User có order | Hiển thị danh sách đơn |
| TC-15 | Liên hệ đã login | Chỉ nhập topic/message | Tự lấy name/email/phone |
| TC-16 | Notification read | Đánh dấu đã đọc | readAt có giá trị, badge giảm |
| TC-17 | Admin guard | User role customer vào /admin | Redirect hoặc chặn truy cập |
| TC-18 | Dashboard doanh thu | Có đơn completed/paid | Doanh thu chỉ tính đơn hợp lệ |
| TC-19 | Cập nhật đơn shipping | Order có item | Stock trừ một lần, ghi InventoryLog |
| TC-20 | Cập nhật liên hệ | Status new -> done | Contact đổi trạng thái, user nhận notification |
| TC-21 | Upload ảnh sản phẩm | File dưới giới hạn | Server trả URL uploads, dùng được cho ảnh chính và ảnh mô tả |
| TC-22 | Upload ảnh quá lớn | File vượt giới hạn | API/client báo lỗi |
| TC-23 | Quản lý category | Thêm category trùng | Báo lỗi trùng tên |
| TC-24 | Đổi role user | Admin đổi customer -> admin | Role cập nhật |
| TC-25 | Xóa review | Admin xóa review từ bảng/dialog chi tiết | Review biến mất khỏi danh sách và rating được tính lại |
| TC-26 | Loading admin | Vào tab quản lý chưa có dữ liệu | Hiện skeleton, không lệch layout |
| TC-27 | Đa ngôn ngữ | Chuyển VI/EN | Text đổi theo JSON |
| TC-28 | Phân loại đơn hàng | Một đơn có user, một đơn không có user | Admin lọc đúng registered/guest |
| TC-29 | Ghi nhận doanh thu kế toán | Đơn chuyển sang paid/completed | Tạo hoặc cập nhật bút toán income nguồn order |
| TC-30 | Nhập khoản chi | Chi phí hợp lệ, category hợp lệ | Tạo bút toán expense và báo cáo lãi lỗ cập nhật |
| TC-31 | Báo cáo kế toán theo kỳ | Chọn tháng/khoảng ngày | Hiển thị doanh thu, chi phí, lợi nhuận và công nợ đúng kỳ |

### 8.2 Chiến lược Unit Test

- Test utility: formatCurrency, slug, notificationTarget, categoryLabel.
- Test Redux reducers: userSlice, cartSlice, catalogSlice, userNotificationSlice.
- Test backend services: inventoryLogService, password decrypt/hash/verify, token utility.
- Test controller validation bằng mock request/response.
- Test quy tắc doanh thu: chỉ tính paid/completed.
- Test quy tắc trừ kho: chỉ trừ một lần khi shipping/completed.
- Test quy tắc phân loại khách: có order.user là registered, không có order.user là guest.

### 8.3 Chiến lược Integration Test

- Auth flow: register -> login -> getProfile.
- Cart flow: add -> update -> remove -> clear.
- Checkout flow: create order -> get order -> list my orders.
- Admin order flow: login admin -> list orders/filter customerType -> update status -> notification created.
- Inventory flow: create product -> update stock -> check InventoryLog.
- Contact flow: create contact -> admin update status -> notification stream/list.
- Accounting flow: paid/completed order -> accounting income transaction -> manual expense -> accounting summary.

### 8.4 Chiến lược UAT

Kịch bản UAT cho khách hàng:

1. Đăng ký tài khoản.
2. Tìm sản phẩm theo danh mục.
3. Xem chi tiết, thêm vào giỏ.
4. Thêm địa chỉ giao hàng.
5. Đặt hàng và xem lịch sử.
6. Gửi đánh giá và liên hệ.
7. Nhận thông báo khi admin cập nhật trạng thái.

Kịch bản UAT cho admin:

1. Đăng nhập bằng tài khoản admin.
2. Xem dashboard theo tháng/khoảng ngày.
3. Thêm sản phẩm và upload ảnh chính/ảnh mô tả.
4. Sửa tồn kho, xem lịch sử kho.
5. Tạo/sửa/xóa danh mục.
6. Cập nhật trạng thái đơn hàng.
7. Kiểm tra tồn kho bị trừ và khách nhận thông báo.
8. Kiểm tra bút toán doanh thu được ghi nhận trong kế toán.
9. Nhập khoản chi vận hành, xem báo cáo lãi lỗ theo tháng/khoảng ngày.
10. Lọc khách hàng, người dùng, liên hệ, đánh giá; mở dialog chi tiết review có ảnh.

## 9. Kết luận

Thiết kế đề xuất đáp ứng bài toán website bán hàng thời trang có quản trị cửa hàng, quản lý kho, thống kê, kế toán nội bộ, thông báo realtime và triển khai Docker. Việc chọn React/TypeScript/Redux/Tailwind ở frontend, Express ở backend và MongoDB ở database phù hợp với yêu cầu phát triển nhanh, dữ liệu linh hoạt và dễ mở rộng. Các quyết định như phân quyền admin, audit log kho hàng, bút toán kế toán có nguồn gốc, loading skeleton, i18n JSON và SSE giúp hệ thống có tính thực tế cao hơn, dễ bảo trì và phù hợp để phát triển tiếp trong môi trường dự án thật.
`.trim()

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraph(text = '', style = 'Normal') {
  const pStyle = style && style !== 'Normal' ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''
  return `<w:p>${pStyle}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
}

function codeParagraph(text = '') {
  return `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
}

function tableXml(rows) {
  const border = '<w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/><w:left w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/><w:right w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="B7C9C2"/></w:tblBorders></w:tblPr>'
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((cell) => {
      const shade = rowIndex === 0 ? '<w:shd w:fill="E8F2ED"/>' : ''
      return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>${shade}</w:tcPr>${paragraph(cell)}</w:tc>`
    }).join('')
    return `<w:tr>${cells}</w:tr>`
  }).join('')
  return `<w:tbl>${border}${body}</w:tbl>`
}

function parseTable(lines, startIndex) {
  const rows = []
  let index = startIndex
  while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
    const raw = lines[index].trim()
    const cells = raw.slice(1, -1).split('|').map((cell) => cell.trim())
    const isSeparator = cells.every((cell) => /^:?-{3,}:?$/.test(cell))
    if (!isSeparator) rows.push(cells)
    index += 1
  }
  return { rows, nextIndex: index }
}

function markdownToDocBody(markdown) {
  const lines = markdown.split(/\r?\n/)
  const parts = []
  let index = 0
  let inCode = false
  let codeLines = []

  while (index < lines.length) {
    const line = lines[index]

    if (line.startsWith('~~~')) {
      if (inCode) {
        codeLines.forEach((codeLine) => parts.push(codeParagraph(codeLine)))
        parts.push(paragraph(''))
        codeLines = []
        inCode = false
      } else {
        inCode = true
      }
      index += 1
      continue
    }

    if (inCode) {
      codeLines.push(line)
      index += 1
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line)) {
      const { rows, nextIndex } = parseTable(lines, index)
      if (rows.length > 0) parts.push(tableXml(rows))
      parts.push(paragraph(''))
      index = nextIndex
      continue
    }

    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^#+/)[0].length
      const text = line.replace(/^#{1,6}\s+/, '')
      parts.push(paragraph(text, `Heading${Math.min(level, 3)}`))
      index += 1
      continue
    }

    if (/^\s*[-*]\s+/.test(line)) {
      parts.push(paragraph(`• ${line.replace(/^\s*[-*]\s+/, '')}`))
      index += 1
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      parts.push(paragraph(line.trim()))
      index += 1
      continue
    }

    if (line.trim() === '') {
      parts.push(paragraph(''))
      index += 1
      continue
    }

    parts.push(paragraph(line.trim()))
    index += 1
  }

  return parts.join('')
}

function documentXml(body) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="850" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`
}

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
    <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:rPr><w:b/><w:color w:val="0F5F55"/><w:sz w:val="34"/></w:rPr>
    <w:pPr><w:spacing w:before="360" w:after="160"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:rPr><w:b/><w:color w:val="263B34"/><w:sz w:val="28"/></w:rPr>
    <w:pPr><w:spacing w:before="260" w:after="140"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:rPr><w:b/><w:color w:val="8A4F23"/><w:sz w:val="24"/></w:rPr>
    <w:pPr><w:spacing w:before="220" w:after="120"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/>
    <w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr>
    <w:pPr><w:shd w:fill="F4F7F5"/><w:spacing w:after="0"/></w:pPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B7C9C2"/><w:left w:val="single" w:sz="4" w:color="B7C9C2"/><w:bottom w:val="single" w:sz="4" w:color="B7C9C2"/><w:right w:val="single" w:sz="4" w:color="B7C9C2"/><w:insideH w:val="single" w:sz="4" w:color="B7C9C2"/><w:insideV w:val="single" w:sz="4" w:color="B7C9C2"/></w:tblBorders></w:tblPr>
  </w:style>
</w:styles>`

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const documentRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let j = 0; j < 8; j += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = Math.max(1980, date.getFullYear()) - 1980
  return { date: (year << 9) | (month << 5) | day, time }
}

function makeZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0
  const { date, time } = dosDateTime()

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8')
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8')
    const crc = crc32(data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(date, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBuffer.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, nameBuffer, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(time, 12)
    central.writeUInt16LE(date, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(nameBuffer.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, nameBuffer)

    offset += local.length + nameBuffer.length + data.length
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, ...centralParts, end])
}

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(markdownPath, `${reportMarkdown}\n`, 'utf8')

const body = markdownToDocBody(reportMarkdown)
const docxBuffer = makeZip([
  { name: '[Content_Types].xml', data: contentTypesXml },
  { name: '_rels/.rels', data: relsXml },
  { name: 'word/document.xml', data: documentXml(body) },
  { name: 'word/styles.xml', data: stylesXml },
  { name: 'word/_rels/document.xml.rels', data: documentRelsXml },
])

fs.writeFileSync(docxPath, docxBuffer)
console.log(`Created ${markdownPath}`)
console.log(`Created ${docxPath}`)
