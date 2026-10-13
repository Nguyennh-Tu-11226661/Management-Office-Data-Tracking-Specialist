# Báo cáo cập nhật và dọn dữ liệu — 13/10/2026

Nhánh: feature/system-review-2026-10-12.

## Mã nguồn
- Đọc tiêu đề xuống dòng và tên cột theo hai file Excel gốc.
- Đọc Tháng 05 theo năm ở ngày PV cùng dòng, không tự gán năm hiện tại; giữ mã tình trạng nguồn.
- Đọc số tiền riêng khỏi nội dung mốc công; giữ nguyên mô tả và hiện vật. Chủ dữ liệu xác nhận đây là tiền thực tế đã trả.
- Import thưởng gắn duy nhất đúng đợt theo CCCD/công ty/ngày PV/mã NV; không tự ghi đè hoặc duyệt. Lưu snapshot nguồn, tách tiền nguồn trên dashboard.
- Trang thưởng đủ cột Excel và Thưởng lần 1–7, bỏ mốc công cố định, mặc định tất cả tháng.
- Demo localhost cổng 3005 mở trực tiếp bằng VIEWER; host khác và chế độ tắt vẫn yêu cầu đăng nhập. Không tự cấp quyền ghi/admin.

## Dọn dữ liệu theo yêu cầu
- Sao lưu database thử nghiệm trước khi xóa.
- Xóa 4.104 hồ sơ đã import và 4.191 lượt tuyển liên quan, xác định bằng audit và sự kiện import.
- Còn 8 hồ sơ, 8 lượt tuyển, 7 bản thưởng và 8 STK ngoài nhóm import. Các mốc/chi trả ngoài nhóm import được giữ.
- Không có thưởng/STK import mới trong lần này. Giữ tài khoản, danh mục, chính sách, file Excel gốc và audit.
- Hash database gốc prisma/dev.db và file tài khoản không thay đổi.
- Việc dọn dữ liệu chỉ trên máy; database và thông tin tài khoản không nằm trong commit.

## Kiểm chứng và giới hạn
- npm test, tests/source-format.cjs, tests/local-auto-view.cjs và TypeScript đạt.
- Build/giao diện đã kiểm tra trong các lượt cập nhật tương ứng; chưa kiểm thử HTTP toàn bộ luồng import nguồn thật.
- 597 dòng hồ sơ nguồn còn thiếu/sai dữ liệu; không tự sửa dữ liệu thiếu.
- Các lỗi chưa xử lý vẫn nêu trong RA_SOAT_HE_THONG_2026-10-12.md.
- Commit phản ánh cả việc xóa ba tài liệu cũ và file mẫu 1.000 dòng vốn đã bị xóa trong working tree trước lượt này. Tài liệu cập nhật mới ở CAP_NHAT_DU_LIEU_GOC_2026-10-13.md.
