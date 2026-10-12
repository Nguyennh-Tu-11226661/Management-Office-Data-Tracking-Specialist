# Báo cáo thay đổi trên nhánh feature/system-review-2026-10-12

Ngày cập nhật: 12/10/2026. So sánh với main tại commit 12c789e. Đây là bản phát triển cục bộ, chưa nghiệm thu và chưa triển khai môi trường thật.

## Đã bổ sung trong commit 31b87f7

- Quản lý đơn hàng và đợt tuyển; danh mục nhà máy, team, chuyên viên và tình trạng lao động.
- Mở rộng hồ sơ để lưu nhiều lượt phỏng vấn/làm việc, liên kết đơn hàng/đợt tuyển và lịch sử thay đổi.
- Chính sách có thời gian hiệu lực, snapshot khi áp dụng, mốc công, xác nhận điều kiện/đạt mốc và ghi nhận khoản thực trả.
- Tổng quan có số liệu nổi bật, biểu đồ và bảng theo tháng phỏng vấn, nhà máy, tình trạng, đơn hàng, người tuyển/team, quay lại, thông tin NLĐ và các nhóm thưởng.
- Bộ lọc có nhãn rõ cho toàn bộ trường, các ô ngày căn cùng hàng; chú thích khoảng ngày và đơn vị thưởng.
- Thêm nhánh nhận diện/import DS_TONG, DS_THUONG và STK. Hai nhánh thưởng/STK còn lỗi cần sửa trước nghiệm thu; chưa coi là hoàn thiện.
- Thêm schema và migration để review; cấu hình chạy bản sao database cục bộ, không tự nâng cấp database gốc.
- Thêm kiểm thử và cập nhật đặc tả, báo cáo rà soát.

## Thay đổi bổ sung trong lần push này

Tệp: src/app/workers/page.tsx

- Đưa ô lọc tháng ra ngoài thẻ liên kết xuất Excel. Trước đây ô tháng nằm trong liên kết tải file; thao tác chọn tháng có thể kích hoạt điều hướng/tải file. Hiện liên kết chỉ chứa nút Xuất Excel DS_TONG.
- Bổ sung placeholder “Lọc theo tháng” cho ô tháng.
- Bỏ nút “Hồ sơ lưu trữ / Xem hồ sơ đang dùng” tại khu vực này. Không xóa dữ liệu đã lưu trữ; chức năng chuyển chế độ qua nút này không còn hiện ở đây. Cần cân nhắc khôi phục vị trí phù hợp nếu vẫn cần thao tác trong giao diện.

## Chưa sửa, không được hiểu là đã hoàn tất

Chi tiết và vị trí mã tại docs/RA_SOAT_HE_THONG_2026-10-12.md:

- Phân quyền import theo loại; tự duyệt thưởng/ghi đè bản thưởng khóa.
- Xác minh STK qua import chưa có bằng chứng đáng tin cậy.
- Nguồn thưởng import và nguồn báo cáo chưa thống nhất; liên kết thưởng có thể nhầm đợt làm việc.
- Thống kê suy kết quả đỗ từ tình trạng; validation, nhận diện sheet và dữ liệu thiếu chưa đầy đủ.
- Script sync_all_modules có dữ liệu mô phỏng và trỏ vào database thử nghiệm; không chạy trên dữ liệu cần giữ.
- Xóa bộ lọc chưa tải lại số liệu ngay. Google Sheets hai chiều vẫn hoãn theo yêu cầu.

## Kiểm chứng

- Lần push này: npx tsc --noEmit thành công.
- Lượt rà soát trước: npm test và node tests/reporting-summary.cjs thành công; HTTP chưa hoàn tất do môi trường QA/cổng 3101. Không tuyên bố toàn bộ luồng đã đạt.
- Chưa chạy lại build và chưa xác minh giao diện bản đang chạy cho thay đổi bổ sung này.
- Commit/push chỉ đưa mã nguồn và tài liệu lên cùng nhánh; không merge main, không triển khai, không đưa file tài khoản, database hoặc ba file Excel cục bộ mới lên Git.
