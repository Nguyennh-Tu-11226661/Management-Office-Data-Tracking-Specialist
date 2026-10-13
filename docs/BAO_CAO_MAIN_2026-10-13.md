# Báo cáo cập nhật main — 13/10/2026

## Thay đổi lần này
- Trang hồ sơ hiển thị đủ 22 cột nguồn, từng dòng nguồn/lượt tuyển, bộ lọc động và lọc theo cột bất kỳ.
- Dòng thiếu/sai thông tin vẫn được giữ nguyên kèm cảnh báo; lưu bản chụp nguồn riêng ở .local/source-imports.
- Tách luồng cảnh báo và trùng: cảnh báo ở danh sách chính, trùng ở danh sách chờ kiểm tra. Dòng có cả hai đi theo luồng trùng, giữ kèm cảnh báo.
- Thêm trang /import-review, bộ lọc file/loại trùng và mở nội dung gốc để đối chiếu.
- Import không tạo/ghi đè bản nghiệp vụ trùng; số dòng nguồn, số hồ sơ chuẩn hóa và số dòng chờ kiểm tra được phân biệt.
- Bỏ biểu mẫu đăng nhập và nút đăng xuất trong demo. Demo localhost:3005 có quyền thao tác ADMIN khi cấu hình cục bộ bật; API ghi vẫn kiểm Origin. Host ngoài phạm vi này không tự có quyền demo.

## Kiểm chứng
- npm test, tests/local-auto-view.cjs, tests/source-row-acceptance.cjs, tests/worker-source-view.cjs, tests/import-review.cjs và TypeScript đạt.
- Build thành công, kiểm tra giao diện trang hồ sơ và hai luồng review trên localhost.
- Các lỗi và giới hạn cũ chưa được mặc nhiên coi là đã sửa hết. Không có kiểm thử toàn hệ thống mới chứng nhận vận hành thật.

## Dữ liệu và phạm vi phát hành
- Chỉ commit mã nguồn, kiểm thử và tài liệu lên main theo yêu cầu.
- Không xóa database trên máy. Không đưa database, tài khoản, .env, bản chụp dòng Excel hoặc ảnh preview lên GitHub.
- main trên GitHub đã có PR #1 chứa các commit trước; lần này tiếp tục từ main mới nhất, không force-push.
- Không thực hiện triển khai máy chủ hoặc gửi dữ liệu cho khách trong lượt này.
