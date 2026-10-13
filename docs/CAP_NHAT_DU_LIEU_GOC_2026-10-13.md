# Cập nhật theo hai file dữ liệu gốc — 13/10/2026

Nguồn: Dữ liệu Qunản lí.xlsx (8.472 dòng) và Thưởng.xlsx (1.362 dòng). Không sửa file gốc, không tự import hoặc xóa dữ liệu trong lần cập nhật này.

- Chuẩn hóa khoảng trắng/xuống dòng tiêu đề; đọc Loại HĐ, Đón xe + KTX, Tình trạng đào tạo.
- Đọc Tháng 05 theo năm ở Ngày PV của cùng dòng (2026 trong nguồn đã kiểm tra); thiếu cả năm và ngày PV hợp lệ thì báo lỗi.
- Giữ nguyên các mã tình trạng nguồn; chỉ tạo danh mục SOURCE khi người dùng xác nhận import. Không tự diễn giải mã hoặc tạo kết quả đỗ.
- Chủ dữ liệu xác nhận các khoản thưởng có tiền là đã thực trả. Tách tiền đầu ô khỏi mốc công; giữ mô tả từng ô trong note nguồn; hiện vật không quy đổi thành tiền.
- Import thưởng yêu cầu hồ sơ đã tồn tại và duy nhất một đợt đúng CCCD/công ty/ngày PV/mã NV. Không chọn đợt đầu tiên, không tự tạo hồ sơ thiếu thông tin, không ghi đè bản thưởng đã có.
- Lưu thưởng nguồn ở trạng thái DRAFT cùng dấu nguồn đã trả; không tự duyệt, không tạo ngày chi/chứng từ. Dashboard có bảng Thưởng đã trả theo file Excel gốc, tách khỏi thưởng nội bộ để tránh đếm trùng.
- Import thưởng và STK kiểm quyền theo loại; tài khoản ngân hàng phát sinh từ nhánh thưởng giữ UNVERIFIED.

## Giới hạn còn tồn tại

7.875/8.472 dòng hồ sơ qua bước parse; 597 dòng bị validation: 52 SĐT, 4 ngày nghỉ, 2 ngày cấp, 530 thiếu ngày nghỉ/lý do, 9 ngày đào tạo chuẩn. Không tự sửa dữ liệu nguồn. Đây chưa phải số dòng nhập thành công vì còn kiểm trùng, danh mục và liên kết ở API.

Không có ngày chi/chứng từ để kiểm chứng độc lập tiền đã trả hoặc phân loại tháng chi. Tháng báo cáo tiếp tục theo ngày PV. Tỷ lệ đủ điều kiện/đạt vẫn cần xác nhận thủ công; không suy từ ô tiền đã trả.

Kiểm thử: tests/source-format.cjs và npm test đạt; TypeScript đạt. Chưa chạy kiểm thử HTTP toàn bộ import dữ liệu thật. Các lỗi khác trong báo cáo rà soát chưa mặc nhiên được xử lý.

## Trang DS_THUONG theo Excel
- Hiển thị STT, Công ty, Tháng gốc, Ngày PV, Chính sách, Mã nhân viên, Họ tên, CCCD, STK, Ngân hàng, đầy đủ Thưởng lần 1–7, tổng tiền và nguồn.
- Nguyên văn mốc thưởng nguồn được lấy từ note nguồn, không gắn nhãn 3/7/15/30 công cố định. Hiện vật và các trạng thái không đạt/không có chính sách không biến thành tiền.
- Mặc định tất cả tháng; bảng cuộn ngang. Thưởng nguồn hiện Đã trả theo Excel, không dùng nút sửa/duyệt nội bộ trên các dòng nguồn.
- Import mới lưu snapshot các cột nguồn để đối chiếu cả STK/ngân hàng; bản nhập từ trước khi bổ sung snapshot vẫn có nội dung mốc đã lưu, STK thiếu snapshot hiển thị theo hồ sơ nếu duy nhất một tài khoản.


## Mở demo cục bộ không qua đăng nhập
- Chế độ local auto-view bật bằng .local/auto-open-demo.json, chỉ áp dụng Host localhost/127.0.0.1 cổng 3005; mở /login sẽ chuyển về tổng quan.
- Quyền xem VIEWER, không cấp quyền sửa dữ liệu/tài khoản. Khi tắt chế độ hoặc dùng host khác vẫn yêu cầu xác thực.
- Không thay file tài khoản, không gửi dữ liệu cho khách hoặc triển khai ngoài máy. TypeScript, npm test và tests/local-auto-view.cjs đạt.

