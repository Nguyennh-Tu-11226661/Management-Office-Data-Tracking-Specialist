# Kết quả kiểm thử cục bộ — 12/10/2026

Phạm vi nghiệm thu kỹ thuật: mã nguồn trong `C:\Hỗ trợ quản lí`. Chưa nghiệm thu nghiệp vụ với người dùng, chưa triển khai công khai.

## Kiểm tra đã thực hiện

- `npx tsc --noEmit`: đạt.
- `npm test`: đạt. Kiểm tra chuyển trạng thái, tiền/tháng hợp lệ, chặn dữ liệu ngân hàng giả, xung đột cập nhật, lỗi ghi nhật ký, ngày lịch, trường tùy chọn null và số định danh Excel dạng Text.
- `npm run build`: đạt, biên dịch và tạo các trang thành công.
- Kiểm thử HTTP trên CSDL/tài khoản giả lập riêng: 61 kiểm tra đạt; đã chạy trên bản production build cục bộ.

## Nhóm kiểm tra HTTP

1. Đăng nhập, từ chối khách chưa đăng nhập, quyền HR/FINANCE/VIEWER, Origin sai và cookie bị sửa.
2. Tạo hồ sơ, CCCD trùng, xác nhận SĐT dùng chung, nghỉ việc với ngày sai, dấu thời gian cũ, tái tuyển giữ đợt đã nghỉ và chặn xóa vĩnh viễn.
3. Tạo/sửa dự thảo thưởng, số tiền âm, bản ghi trùng kỳ, không khóa trước duyệt, lấy người duyệt từ phiên đăng nhập, chặn sửa sau duyệt, khóa và chặn chuyển lùi.
4. Tạo/sửa tài khoản ngân hàng đều chưa xác minh; API xác minh trả 503; lệnh chi bị chặn; HR không xuất lệnh chi, VIEWER không xuất Excel.
5. Xuất hồ sơ/cảnh báo/file mẫu; nhập Excel xem trước không ghi dữ liệu; số định danh dạng số báo lỗi; CCCD trùng không ghi đè; xác nhận chỉ nhập dòng hợp lệ.
6. Tạo/sửa chính sách và từ chối người thiếu quyền.
7. Tra cứu che STK, không trả CCCD đầy đủ, chỉ hiện thưởng duyệt/khóa, kiểm tra đúng 4 chữ số.
8. Nhật ký nghiệp vụ, nhật ký AUTH, tạo tài khoản, bảo vệ quản trị viên cuối cùng, tạm khóa tài khoản và vô hiệu phiên sau đổi quyền/đăng xuất.

## Bảo toàn dữ liệu

Script integration so sánh SHA-256 trước/sau của `prisma/dev.db`, `prisma/schema.prisma` và `.env`: không đổi. Dữ liệu kiểm thử nằm trong `.local/qa-*`, có `result.json` riêng. Tài khoản giả lập không được dùng làm tài khoản vận hành.

## Kiểm tra giao diện và giới hạn

- Đã mở và kiểm tra bố cục màn hình đăng nhập trên trình duyệt cục bộ; ảnh: `preview-login.jpg`.
- Các API nghiệp vụ đã được kiểm tra qua HTTP; chưa kiểm tra mọi thao tác trên các form bằng trình duyệt với tài khoản vận hành.
- Chưa có xác minh ngân hàng thật, nguồn chấm công/OTP, mẫu Internet Banking đã nghiệm thu hoặc bằng chứng chuyển tiền.
- Không thử nghiệm ghi dữ liệu thật, không chạy migration, không đưa lên Git hoặc triển khai.

Bản đặc tả chi tiết: `DAC_TA_HE_THONG_CAP_NHAT_2026-10-12.md`.
