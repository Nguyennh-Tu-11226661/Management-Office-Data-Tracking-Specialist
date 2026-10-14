# Sửa thống kê thưởng nguồn theo công ty — 13/10/2026

## Nguyên nhân

Báo cáo cũ chỉ đọc BonusRecord có liên kết assignment. Bảng chuẩn hóa hiện gần như chỉ có Goertek, trong khi dữ liệu nguồn có nhiều công ty. Khi chọn Luxshare VT, các khoản chưa liên kết bị loại khỏi báo cáo.

## Thay đổi

- Phần Thưởng đã trả theo file Excel gốc đọc trực tiếp các dòng DS_THUONG đã lưu có cột Thưởng lần 1–7, không phụ thuộc việc chuẩn hóa thành công.
- Lọc công ty theo cột Công ty nguồn; tháng/từ/đến theo Ngày PV nguồn. Bộ lọc đơn hàng/đợt/người tuyển/team cần có liên kết phù hợp, không tự gán dữ kiện chưa có.
- Hiển thị bảng tổng theo công ty và chi tiết tên chính sách/nội dung mốc, trạng thái đối chiếu, số dòng chưa liên kết và số dòng chờ kiểm tra.
- Bỏ các dòng nguồn trùng đã phân luồng; nhận diện bản nhập lặp cùng CCCD/công ty/ngày PV/mã NV và cùng nội dung thưởng để tránh cộng hai lần.
- Các biến thể có nội dung thưởng khác nhau cùng khóa hồ sơ được đánh dấu xung đột, chưa cộng vào tổng; các ô tiền chưa đọc được cũng không tự coi là đã xác minh.
- Dữ liệu canonical nhập nguồn từ trước, không còn snapshot, được dùng bổ sung khi chưa có dòng nguồn tương ứng. Không gộp tiền thưởng nội bộ với tiền nguồn.

## Kiểm chứng

- tests/source-paid-report.cjs: lọc Luxshare VT/Goertek, tháng/khoảng ngày khi không có assignment; không cộng lặp và không cộng khoản xung đột.
- npm test và TypeScript đạt; build và kiểm tra API/giao diện sau cập nhật.
- Không sửa dữ liệu database hoặc chứng từ; số tiền nguồn tiếp tục dựa trên xác nhận của chủ dữ liệu là đã trả.
