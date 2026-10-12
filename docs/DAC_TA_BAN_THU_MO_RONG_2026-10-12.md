# Đặc tả bản thử mở rộng — 12/10/2026

## Phạm vi đã được xác nhận

- Một nhà máy có nhiều đơn hàng; một đơn hàng có nhiều đợt tuyển, ngày tuyển và chỉ tiêu riêng.
- Mọi bộ lọc/thống kê tháng dùng ngày phỏng vấn, không dùng ngày tạo hồ sơ hoặc ngày trả tiền thay thế.
- Công thực tế được chốt thủ công, chỉ tính từ sau ngày phỏng vấn đỗ. Không lấy số ngày lịch làm số công.
- Điều kiện xét và kết quả đạt từng mốc thưởng được xác nhận thủ công.
- Bổ sung schema được duyệt; chạy trên CSDL sao chép, chưa chuyển dữ liệu gốc.
- Theo yêu cầu mới nhất, tạm hoãn Google Sheets để người dùng test import Excel trước.

## Mô hình và màn hình

1. Danh mục nhà máy, team, chuyên viên, trạng thái và ánh xạ import. Thêm/sửa/ngừng sử dụng; không xóa dây chuyền dữ liệu lịch sử.
2. Đơn hàng → đợt tuyển: mã, tên, nhà máy, khoảng ngày, kỳ chỉ tiêu, mục tiêu số người. Nhà máy và khoảng ngày của danh mục đã sử dụng được bảo vệ để tránh đổi lịch sử.
3. Hồ sơ: một CCCD duy nhất cho một người; nhiều lượt phỏng vấn/làm việc, mã NV tại công ty, đơn hàng, đợt, recruiter/team và kết quả riêng. Cho phép sửa từng đợt, lưu lịch sử cập nhật và chốt công thủ công.
4. Tổng quan: lọc tháng/ngày PV, nhà máy, đơn hàng/đợt, người lao động, recruiter/team; các bảng so sánh trạng thái, đỗ/trượt/bỏ, quay lại, giới tính, tỉnh thành và tuổi tại ngày PV.
5. Chính sách: từ 1 đến 7 mốc với nội dung, số công, số tiền, ngày bắt đầu/kết thúc và nhà máy/đơn hàng áp dụng. Khi áp dụng cho một đợt, lưu snapshot để chỉnh chính sách sau này không đổi thưởng cũ.
6. Mốc thưởng: đủ điều kiện xét, ngày xét, đạt/chưa đạt, ngày đạt, người và căn cứ xác nhận. Đạt mốc có số công yêu cầu cần số công được chốt đủ trước.
7. Khoản đã trả: số tiền, ngày trả, mã chứng từ duy nhất, người xác nhận; cho phép nhiều lần trả nhưng tổng không vượt mức thưởng. Đây là ghi nhận thủ công, không thực hiện chuyển tiền.
8. Hồ sơ chi tiết: hiển thị từng công ty/đợt, ngày PV/đỗ/làm/nghỉ, trạng thái và từng mốc/từng khoản đã nhận. Bản ghi thưởng cũ không tự được coi là đã lĩnh.

## Import Excel để nghiệm thu trước

- File `.xlsx` tối đa 5 MB, từ 1 đến 5.000 dòng. Mặc định đọc sheet `DS_TONG`; có thể chọn mẫu ánh xạ riêng.
- CCCD/SĐT phải là Text; ngày PV bắt buộc. Dòng sai báo cụ thể, không tự khôi phục số 0 đầu của định danh.
- Xem trước không ghi dữ liệu. Chỉ ghi các dòng hợp lệ khi người dùng xác nhận.
- CCCD cũ không tạo người mới: thêm lịch sử đợt tuyển vào hồ sơ đã có khi danh tính khớp.
- Trùng chính xác CCCD + nhà máy PV + ngày PV + mã NV: bỏ qua và không ghi đè.
- Chỉ cảnh báo CCCD/SĐT của hồ sơ có trạng thái được bật cảnh báo trong danh mục. Mặc định là Đang làm việc/Chưa đào tạo. Nghỉ hẳn không bật cảnh báo.
- Hồ sơ lưu trữ cần khôi phục trước khi nhập đợt mới. Thông tin cá nhân cũ không bị ghi đè bằng mỗi dòng lịch sử mới.
- Kết quả PV nhập bằng mã PASS/FAIL hoặc nhãn Đỗ/Trượt được chuẩn hóa. Nguồn ghi Đỗ nhưng không có ngày đỗ riêng sẽ dùng ngày PV làm ngày PV đỗ và hiện cảnh báo để kiểm tra ở bước xem trước. Không suy diễn kết quả Đỗ từ trạng thái Đang làm việc/Nghỉ việc.
- Bản thử hiện ưu tiên DS_TONG. Không tự nhập số tiền từ DS_THUONG/STK thành chứng từ đã trả hoặc xác minh ngân hàng.

## Cách tính và giới hạn

- Số người: CCCD/hồ sơ duy nhất trong bộ lọc; số lượt: tất cả đợt tuyển khớp bộ lọc.
- Đỗ/trượt: theo kết quả PV đã ghi; không bị mất khi đổi trạng thái sang đào tạo/nghỉ việc.
- Quay lại: có lịch sử đã làm trước ngày PV của lượt hiện tại. Lịch sử thiếu ngày/kết quả không được tự hoàn thiện.
- Tỷ lệ đạt thưởng: số mốc đã đạt / số mốc đã xác nhận đủ điều kiện xét; mẫu số 0 hiển thị chưa có mẫu số.
- Tiền đã trả: tổng các khoản có chứng từ, không cộng trạng thái APPROVED/LOCKED của dữ liệu cũ vào tiền đã lĩnh.
- Chỉ tiêu hiện tính theo đợt liên quan; không tự chia chỉ tiêu đợt kéo dài qua nhiều tháng. Chưa gán đơn hàng/đợt được báo riêng.
- Tuổi tính tại ngày PV; tỉnh thành lấy trường tỉnh/thành, thiếu thì Chưa xác định.
- Danh mục thay đổi không viết lại tên recruiter/team đã lưu theo lịch sử đợt.

## Môi trường và kiểm tra

- CSDL gốc `prisma/dev.db` và `.env` giữ nguyên; bản thử dùng `.local/evolution/preview/dev.db`.
- Migration SQL được lưu để xem xét; chưa chạy migration lên CSDL gốc.
- Prisma Client mở rộng sinh riêng trong `.generated/client`, tránh thay engine đang được bản cũ sử dụng.
- Build bản thử nằm trong `.next-evolution`; không dùng chung sản phẩm build của bản cũ.
- TypeScript, kiểm thử logic và production build đạt. Bộ kiểm thử HTTP mở rộng đạt 91 kiểm tra trên CSDL giả lập riêng, gồm đơn hàng/đợt, snapshot chính sách, xác nhận mốc, trả một phần, chặn trả vượt/trùng chứng từ, quay lại, hồ sơ lưu trữ/khôi phục và import.
- Người dùng test trên http://127.0.0.1:3005/excel-tools. Đây là chạy cục bộ, chưa phát hành hoặc push những thay đổi mới lên GitHub.
- Google Sheets chưa bật và không bị sửa. Kết nối hai chiều sẽ xử lý sau theo yêu cầu của người dùng.

### Cập nhật trình bày tổng quan
- Bộ lọc có nhãn tháng phỏng vấn, ngày phỏng vấn từ/đến và chú thích khoảng lọc bao gồm hai ngày biên.
- Hiển thị số liệu nổi bật và biểu đồ thanh so sánh theo tháng phỏng vấn, nhà máy, tình trạng và thưởng. Mỗi biểu đồ có chú giải, giá trị cụ thể, trạng thái không có dữ liệu. Các chỉ tiêu có thể chồng lặp, không cộng các thanh với nhau.
- Biểu đồ thưởng dùng tháng phỏng vấn của hồ sơ, đơn vị đồng; giữ bảng chi tiết để đối chiếu.


### Nhóm thống kê DS Tổng và DS Thưởng
- DS Tổng: biểu đồ tháng PV, nhà máy PV, tình trạng, đơn hàng, chuyên viên, team; tỷ lệ quay lại toàn bộ và từng đơn hàng. Bảng có chi tiết số lượt theo từng tình trạng.
- NLĐ: biểu đồ giới tính, quê quán, độ tuổi; chọn toàn bộ hoặc từng công ty, đếm người riêng biệt, tuổi tại ngày PV.
- DS Thưởng: tiền đạt mốc, đã trả và còn phải trả theo tháng PV, đơn hàng, chính sách và nội dung/mốc công đã cấu hình. Không tự tạo chính sách 3/7/15/30/45 công khi chưa có cấu hình; tiền xe phân biệt bằng tên khoản.
- Tỷ lệ đạt: mốc xác nhận đạt / mốc xác nhận đủ điều kiện, theo tháng, công ty, giai đoạn, chính sách; mẫu số 0 hiển thị chưa có mẫu số.
- Kiểm chứng: node tests/reporting-summary.cjs kiểm tra chi tiết tình trạng, mốc công, trả một phần và tỷ lệ thiếu mẫu số; npm test và TypeScript đều thành công.

