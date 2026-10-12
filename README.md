# L-Incentive — quản lý lao động và thưởng cục bộ

Đặc tả cập nhật ngày 12/10/2026: [Đọc bản đặc tả đầy đủ](docs/DAC_TA_HE_THONG_CAP_NHAT_2026-10-12.md).

Đã bổ sung đăng nhập/phân quyền, quản lý tài khoản, hồ sơ và lịch sử tái tuyển, kiểm tra nghỉ việc, chính sách 7 mốc, sửa dự thảo/duyệt/khóa thưởng, nhật ký và nhập Excel qua bước xem trước.

**Xác minh ngân hàng chưa kết nối. Mọi lệnh chi được chặn cho đến khi có bằng chứng thật. Duyệt/khóa thưởng không có nghĩa là đã chuyển tiền.**

## Chạy cục bộ

```powershell
npm run auth:setup
npm run dev
```

Tạo ADMIN đầu tiên bằng thông tin tự đặt; không có mật khẩu mặc định. Mở http://127.0.0.1:3000. Quản trị viên quản lý thêm tài khoản tại Phân quyền. Cấu hình đăng nhập được lưu riêng trong `.local/auth.json`, không nằm trong CSDL lao động và không đưa lên Git.

```powershell
npm test
npm run test:integration
npm run build
npm start
```

Kiểm thử integration dùng CSDL/tài khoản giả lập riêng trong `.local/qa-*` và cổng loopback 3101. Không nhập thử vào `prisma/dev.db`. Các lệnh chạy ứng dụng chỉ bind localhost.

Schema SQLite và dữ liệu hiện có được giữ nguyên. Không chạy migration hoặc triển khai trong đợt hoàn thiện này.

Bản README cũ được giữ để đối chiếu tại [docs/README_V2_TRUOC_CHINH_SUA.md](docs/README_V2_TRUOC_CHINH_SUA.md); không dùng các tuyên bố cũ về xác minh ngân hàng, ngày công hay Internet Banking làm bằng chứng chức năng đã hoàn thành.
