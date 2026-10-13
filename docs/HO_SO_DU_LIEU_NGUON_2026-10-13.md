# Hồ sơ lao động giữ đầy đủ nguồn và lọc dữ liệu — 13/10/2026

## Yêu cầu đã chốt
Hai file hồ sơ/thưởng là nguồn. Dòng chưa hợp lệ vẫn lên trang và gắn cảnh báo; không bỏ chỉ vì thông tin phụ thiếu/sai.

## Thay đổi
- Hồ sơ hiển thị đầy đủ 22 cột nguồn. Không tự điền nhà máy làm việc bằng nhà máy PV hoặc mặc định hợp đồng khi nguồn trống.
- Bảng nguồn hiển thị từng dòng; bảng nội bộ hiển thị từng lượt tuyển, không chỉ assignments[0]. Các lượt nội bộ chưa có bản nguồn được giữ nếu khác khóa CCCD/nhà máy/ngày PV/mã NV.
- Bộ lọc nhà máy, trạng thái, tháng nhận việc, tuyển dụng lấy từ dữ liệu thực tế. Có tìm trong toàn bộ cột, lọc cột bất kỳ và chỉ dòng cảnh báo. Lọc tháng phỏng vấn độc lập với tháng nhận việc.
- Import giữ raw của mọi dòng vào .local/source-imports/<id>.json khi xác nhận, gồm file/tab/số dòng và cảnh báo. Preview không ghi dữ liệu; số dòng nguồn lưu riêng với số hồ sơ nghiệp vụ tạo được.
- Mọi dòng sai/thiếu định danh, ngày hoặc liên kết vẫn lưu ở nguồn. Các dòng chưa đủ để tạo quan hệ không tự trở thành hồ sơ chuẩn, đạt thưởng hoặc chứng từ.
- Thông tin phụ không hợp lệ được giữ với cảnh báo; import không xóa ngày nghỉ/lý do chỉ vì mã trạng thái nguồn là NH/LV/... . Quy trình nhập tay vẫn giữ validation nghiêm ngặt.
- Mở rộng dòng hồ sơ để xem nguyên nội dung Thưởng.xlsx cùng CCCD/công ty/ngày PV. Thưởng nguồn không ghép được nằm ở bảng riêng, không tự chọn hồ sơ khác.
- Bản demo tự xem không hạ quyền của phiên đã đăng nhập: tài khoản hợp lệ vẫn dùng quyền của tài khoản. Không có phiên thì dùng VIEWER ở localhost.

## Kiểm chứng
- Đọc cả 8.472 dòng file hồ sơ theo chế độ giữ nguồn; 597 dòng có lỗi validation nghiêm ngặt được chuyển thành cảnh báo, không tự sửa dữ liệu thiếu.
- tests/worker-source-view.cjs: giữ trường phụ, ngày nghỉ, dữ liệu nguồn, cảnh báo và snapshot.
- tests/source-row-acceptance.cjs: dòng sai CCCD/ngày được lưu nguồn, preview không ghi, số chuẩn hóa phân biệt số nguồn.
- npm test và TypeScript đạt. Build kiểm tra sau cập nhật.

## Giới hạn cần hiểu đúng
- Các dòng từng bị bỏ ở import cũ chưa có snapshot không thể tự khôi phục nguyên ô từ database; cần import lại file gốc qua luồng mới. Không tự import/ghi đè trong lần sửa này.
- Dòng nguồn bị trùng vẫn được giữ trong nguồn với cảnh báo; không tạo thêm lượt nghiệp vụ trùng. Tổng dòng nguồn khác số người riêng biệt và số lượt tuyển chuẩn.
- Dữ liệu chuẩn hóa và báo cáo nghiệp vụ vẫn cần định danh/ngày/link hợp lệ; không coi các dòng nguồn cảnh báo là đã xác minh.
- Bản chụp nguồn chứa dữ liệu cá nhân, nằm trong .local đã bỏ qua Git. Khi dọn dữ liệu import cần dọn cả bản chụp nguồn tương ứng sau sao lưu.
- Đồng bộ Sheets chưa triển khai; xuất DS_TONG cũ vẫn dựa vào hồ sơ chuẩn, chưa phải xuất toàn bộ dòng cảnh báo nguồn.

## Sửa triệt để màn hình đăng nhập trong demo
- /login kiểm tra chế độ demo trên server và chuyển về / trước khi dựng biểu mẫu.
- Cookie sai/hết hạn dùng quyền VIEWER cục bộ; phiên tài khoản hợp lệ vẫn giữ quyền tài khoản. Host ngoài localhost:3005 hoặc chế độ tắt không có fallback demo.
- Kiểm thử local-auto-view có thêm trường hợp cookie cũ sai; npm test và TypeScript đạt. Không thay tài khoản/mật khẩu hay dữ liệu.


## Theo yêu cầu bỏ hẳn login trong demo
- Xóa component LoginForm và thông tin đăng nhập demo được nhúng trong biểu mẫu.
- /login chỉ là chuyển hướng về tổng quan khi bật chế độ cục bộ; ngoài chế độ này trả 404, không mở công khai chức năng không xác thực.
- Bản demo cục bộ dùng ADMIN để thao tác được, thay cho VIEWER trước đây. Chỉ áp dụng loopback cổng 3005 với cấu hình .local; API ghi vẫn kiểm tra Origin.
- Bỏ nút đăng xuất ở demo và liên kết đăng nhập khỏi thanh điều hướng. Không xóa tài khoản hiện có hoặc dữ liệu nghiệp vụ.
- npm test, test local-auto-view và TypeScript đạt.

