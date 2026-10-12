# HỆ THỐNG QUẢN TRỊ LAO ĐỘNG & CHI TRẢ THƯỞNG (L-INCENTIVE V2.0)
> **Năm áp dụng: 2026**  
> Bản nâng cấp toàn diện thay thế 6 file bảng tính Excel (`DS_TONG`, `Còn LV`, `Tháng cũ`, `Cảnh báo trùng`, `DS_THUONG`, `STK ngân hàng 2026`).

---

## 1. CÁC TÍNH NĂNG CHÍNH ĐÃ TRIỂN KHAI

### 📊 Phân Hệ 1: Dashboard BI & Ma Trận Tuyển Dụng
- **Ma trận Tuyển dụng 9 Nhà Máy:** LUXSHARE QC, CANON, GOERTEK, FUSHAN, AMPHENOL, BẢO VỆ, FOXCONN, LUXSHARE VT, LG.
- **Thống kê 6 thẻ KPI thời gian thực:**
  - Tổng số hồ sơ
  - Lao động Đang làm việc (Còn LV)
  - Lao động Đã nghỉ việc (chốt Ngày NH)
  - Tỷ lệ Giữ chân (Retention Rate %)
  - Ngân sách Thưởng đã duyệt (VND)
  - Số lượng Cảnh báo lệch tên STK
- **Xếp hạng hiệu suất Chuyên viên Tuyển dụng (Recruiter KPI):** Thống kê số lượng tuyển vào và số lao động còn giữ chân được tại xưởng.
- **Bản đồ nguồn lao động:** Phân bố quê quán theo tỉnh thành (Nghệ An, Thanh Hóa, Bắc Giang, Thái Nguyên...).

### 👥 Phân Hệ 2: Hồ Sơ Lao Động Master Data (`DS_TONG`)
- Quản lý đầy đủ tất cả các trường dữ liệu theo bảng tính Excel:
  - `STT, Nhà máy PV, Nhà máy làm việc, Loại HD, Tình trạng, Ngày NH, Lý do, Mã NV, Họ và tên, Ngày sinh, Giới tính, số CCCD, Ngày cấp, Địa chỉ, SĐT, Tuyển dụng, Đón xe - KTX, Ngày PV, Ngày đào tạo chuẩn, Tháng nhận việc, Nguồn`.
- **Cơ chế Chặn Trùng Lặp 3 Tầng:**
  1. **Trùng cứng CCCD:** Ngăn chặn ngay lập tức, cảnh báo đỏ danh tính và Recruiter quản lý cũ.
  2. **Trùng SĐT:** Bật cảnh báo vàng để xác minh trùng ứng viên.
  3. **Lao động quay lại (Re-hire):** Tự động kế thừa lịch sử thay vì báo trùng lỗi.
- **Quản lý Nghỉ việc:** Cập nhật trạng thái `Đã nghỉ việc`, ghi nhận chính xác `Ngày NH` (Ngày nghỉ việc) và `Lý do nghỉ`.

### 💰 Phân Hệ 3: Quản Lý Tiền Thưởng & Định Mức Công (`DS_THUONG`)
- Cấu hình thưởng bậc thang 7 mốc công:
  - **Mốc 1 (3 công):** Khởi động (300,000 đ)
  - **Mốc 2 (7 công):** Tuần đầu (500,000 đ)
  - **Mốc 3 (15 công):** Tiền xe hỗ trợ (500,000 đ)
  - **Mốc 4 (30 công):** Gắn bó tháng 1 (1,000,000 đ)
  - **Mốc 5 (45 công):** Tháng 2 (1,000,000 đ)
  - **Mốc 6 (60 công):** Tháng 3 (1,000,000 đ)
  - **Mốc 7:** Chuyên cần quý (1,500,000 đ)
- Phân kỳ dữ liệu rõ ràng theo các tháng: `T01.2026`, `T02.2026`, `T03.2026` ... `T10.2026`.
- **Quy trình duyệt 3 bước:** Dự thảo (DRAFT) $\rightarrow$ Phê duyệt (APPROVED) $\rightarrow$ Khóa sổ (LOCKED).
- **Xuất Lệnh Chi Ngân Hàng:** 1 cú nhấp chuột xuất file Excel chi trả tương thích Internet Banking (VCB, MB, Techcombank...).

### 💳 Phân Hệ 4: Tài Chính & Xác Thực STK Ngân Hàng (`STK 2026`)
- Quản lý STK, tên ngân hàng, tên chủ tài khoản.
- **Tự động đối soát tên chủ tài khoản với CCCD:**
  - `Khớp tên 100% (Xanh)`: Tên trên thẻ trùng với tên trên CCCD.
  - `Cảnh báo Lệch tên CCCD (Đỏ)`: Tên trên thẻ khác tên hồ sơ $\rightarrow$ Cảnh báo không chi trả nhầm.
  - `Tài khoản Ủy Quyền (Tím)`: Ghi nhận trường hợp lao động mượn thẻ người thân (Bố/Mẹ/Vợ/Chồng) có xác nhận.
- Tích hợp tra cứu VietQR / Napas tự động để lấy tên chủ thẻ thật.

### 🛡️ Phân Hệ 5: Bộ Lọc Cảnh Báo Trùng Lặp (`Cảnh báo trùng`)
- Quét toàn bộ CSDL và trích xuất danh sách theo đúng mẫu sheet Excel:
  `CCCD, Họ và Tên, Nhà máy PV, Tình Trạng, Ngày PV`.
- Xuất file Excel `CanhBaoTrung_2026.xlsx` để đối soát nhanh.

### 📁 Phân Hệ 6: Bộ Máy Xử Lý Excel Engine
- Hỗ trợ Kéo & Thả file Excel hiện có của doanh nghiệp để nạp dữ liệu nền (Import).
- Báo cáo chi tiết từng dòng: số dòng thành công, các dòng bị trùng CCCD hoặc sai định dạng.
- Xuất file mẫu chuẩn: `DS_TONG`, `Lệnh Chi Ngân Hàng`, `Cảnh báo trùng`.

### 🔍 Phân Hệ 7: Cổng Tra Cứu Tự Phục Vụ Cho Người Lao Động (Self-service)
- Người lao động chỉ cần nhập: **Số CCCD** + **4 số cuối SĐT**.
- Tra cứu tức thì: Nhà máy, Tình trạng nhận việc, Lịch sử đạt các mốc thưởng và trạng thái giải ngân.

---

## 2. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG

### Cách 1: Khởi chạy chế độ Phát triển (Dev Mode)
```bash
npm run dev
```
Truy cập hệ thống tại: **`http://localhost:3000`**

### Cách 2: Khởi chạy chế độ Production
```bash
npm run build
npm start
```

---

## 3. CƠ SỞ DỮ LIỆU
- Hệ thống sử dụng CSDL SQLite cục bộ được định nghĩa tại `prisma/schema.prisma` và lưu ở `dev.db`.
- Để chuyển đổi sang **PostgreSQL**, chỉ cần thay đổi biến `DATABASE_URL` trong file `.env` và đổi provider trong `schema.prisma`.
