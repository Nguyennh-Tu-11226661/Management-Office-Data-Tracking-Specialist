# Kết quả rà soát hệ thống — 12/10/2026

Phạm vi: kiểm tra mã nguồn hiện tại theo đặc tả DS Tổng/DS Thưởng/STK, hồ sơ, quyền và luồng thưởng. Không sửa mã nghiệp vụ, không chạy script đồng bộ mẫu, không thay đổi dữ liệu import. Các nhận định dưới đây dựa trên mã nguồn; chưa kết luận dữ liệu đã bị ảnh hưởng.

## Lỗi cần ưu tiên

1. **Import không phân quyền theo loại dữ liệu.** `src/app/api/excel-engine/import/route.ts:10` chỉ yêu cầu worker:write cho cả ba nhánh. HR có thể import thưởng và STK, trong khi FINANCE không có worker:write nên bị chặn. Phải kiểm quyền bonus:write/bank:write theo loại trước khi xử lý.
2. **Import thưởng vượt quy trình duyệt/khóa.** Nhánh DS_THUONG cập nhật bản ghi sẵn có, kể cả bản ghi khóa, đặt APPROVED (dòng 201–238) mà không kiểm trạng thái, phiên bản hay người duyệt. Thiếu các cột thưởng được chuyển thành 0 nên có nguy cơ mất số cũ. Cần nhập nháp, không ghi đè khóa và yêu cầu duyệt riêng.
3. **Xác minh STK giả qua import.** Dòng 254 tự đặt VALID và isNameVerified; dòng 317 coi không có cảnh báo là khớp. Chuỗi "không khớp" cũng chứa "khớp", "không hợp lệ" chứa "hợp lệ". Cần giữ UNVERIFIED và lưu kết quả nguồn như thông tin chưa xác minh. Xuất lệnh chi hiện vẫn bị paymentIssue chặn khi chưa có bằng chứng, nên chưa kết luận lỗi này đã cho phép chuyển tiền.
4. **Hai nguồn thưởng không thống nhất.** Import ghi BonusRecord, `/api/reports` chỉ đọc PolicyEnrollment/RewardStage/RewardPayment. Dashboard không tự phản ánh tiền import; cần định nghĩa từng cột là tiền chính sách, đạt mốc hay đã trả trước khi chuyển đổi, tránh tính hai lần.
5. **Ghép sai đợt làm việc.** Import thưởng chọn lần đầu cùng nhà máy, hoặc assignments[0] nếu không khớp (dòng 187–190). Lao động tái tuyển có thể bị gán thưởng sang đợt khác. Cần CCCD + nhà máy + ngày PV/mã NV, yêu cầu xử lý khi có nhiều kết quả.
6. **Sai số thống kê kết quả PV.** `src/lib/reporting.ts:16` coi đang làm/nghỉ việc/đào tạo là đỗ kể cả kết quả FAIL hoặc UNKNOWN; một lượt có thể vào cả đỗ và trượt. Cần ưu tiên kết quả đã xác nhận, hiển thị thiếu dữ liệu, không tự suy từ tình trạng.
7. **Tự điền dữ kiện và nhận diện file không chắc chắn.** Import thưởng mặc định T01.2026; tài khoản thiếu ngân hàng được gán tên giả; CCCD/STK số không được kiểm mất số 0 như DS_TONG. File nhiều sheet có thể tự chọn nhánh ngân hàng/thưởng thay vì DS_TONG. Cột trùng chỉ bị chặn trong nhánh DS_TONG, các nhánh khác bị Object.fromEntries ghi đè. Cần chọn rõ loại/sheet và xem trước dữ liệu từng dòng, chặn định danh dạng số/cột trùng/missing fields.
8. **Script demo có thể thay đổi database import.** `scripts/sync_all_modules.cjs` trỏ thẳng vào `.local/evolution/preview/dev.db`, phân bố trượt/bỏ theo index, tự xác nhận thưởng/chi trả và người duyệt. Không chạy script này trên dữ liệu cần đối chiếu; cần tách database demo, thêm điều kiện bắt buộc và ghi rõ mô phỏng. Chưa xác minh script đã từng được chạy.
9. **Nút xóa bộ lọc không tải lại ngay.** Chỉ setFilters({}); load chạy khi bấm áp dụng hoặc sau timer. Số liệu cũ có thể còn hiển thị dưới bộ lọc đã trống. Cần cập nhật dữ liệu và phạm vi đã áp dụng cùng lúc.

## Phần đã thấy có cơ chế

- Đăng nhập mật khẩu băm scrypt, phiên ký HMAC và hết hạn; guard kiểm quyền và nguồn yêu cầu ghi.
- Hồ sơ có nhiều lượt làm việc, lịch sử và cơ chế lưu trữ; DS_TONG có kiểm trùng CCCD/SĐT và ngày PV.
- Chính sách có hiệu lực và snapshot; xác nhận mốc kiểm đủ công, ngày; ghi nhận thực trả kiểm mã chứng từ và tổng không vượt mốc.
- Báo cáo có nhóm tháng, nhà máy, tình trạng, đơn hàng, recruiter/team, demographics, thưởng/tỷ lệ. Có khác biệt dữ liệu nguồn cần sửa như trên.
- Google Sheets hai chiều chưa triển khai theo quyết định để sau; không coi là lỗi đồng bộ hiện tại.

## Kiểm thử và giới hạn

- `npm test`: đạt kiểm thử duyệt/khóa, validation và chặn xuất lệnh chi.
- `node tests/reporting-summary.cjs`: đạt kiểm thử mốc công, trả một phần, tỷ lệ thiếu mẫu số và tình trạng.
- `npx tsc --noEmit`: đạt.
- Bộ test hiện có chưa chứng minh các nhánh import thưởng/STK an toàn. Cần bổ sung test phân quyền theo loại, thưởng đã khóa, chuỗi phủ định kết quả STK, trùng đợt, nhận diện nhiều sheet và dashboard sau import.

Ưu tiên sửa: phân quyền/import duyệt/khóa và STK → liên kết đợt và nguồn thưởng → xác nhận kết quả PV → validation/import preview → lọc/dashboard. Trước khi xử lý dữ liệu đã có cần sao lưu và đối chiếu file nguồn; không tự xóa hoặc sửa lịch sử.

- Kiểm thử HTTP lần này chưa hoàn tất: lần chạy sandbox không truy cập được server QA, lần tiếp theo gặp cổng 3101 đang bị chiếm. Không dùng kết quả 91 kiểm tra từ bản trước để chứng nhận mã hiện tại. Hash database gốc, schema và .env giữ nguyên qua lần thử. Chưa xác minh đầy đủ giao diện hoặc dữ liệu đang lưu trong bản sao; chưa chạy build mới trong lượt rà soát.
