# Phân luồng cảnh báo và trùng import — 13/10/2026

## Quy tắc đã chốt

- Dòng có cảnh báo thiếu/sai thông tin vẫn lưu và hiển thị trong danh sách chính.
- Dòng được nhận diện trùng tách sang danh sách chờ kiểm tra, chưa tạo thêm hoặc ghi đè lượt/hồ sơ nghiệp vụ.
- Dòng vừa trùng vừa cảnh báo đi theo luồng trùng, giữ kèm tất cả cảnh báo.
- Lượt tuyển chuẩn đã có trước đó vẫn tồn tại trong danh sách chính; bản nguồn mới bị trùng được giữ riêng.

## Chức năng

- Kết quả import có các số riêng: tổng dòng, nguồn lưu, dòng cảnh báo, dòng trùng. Đếm dòng duy nhất, không đếm số thông báo.
- Có hai tab riêng trong kết quả: Cảnh báo dữ liệu và Trùng lặp.
- Trang /import-review có hai luồng đã lưu, tìm nội dung, lọc file, lọc loại trùng và mở nguyên cột/giá trị nguồn để đối chiếu.
- Loại trùng: lượt tuyển đã có, CCCD đang hoạt động, SĐT trùng và STK đã có; thưởng đã có cũng đưa sang luồng trùng.
- Bỏ hỏi xác nhận nhập trùng ngay trong import. Trùng vẫn lưu nguồn, chưa tự gộp/sửa/duyệt/xóa trong màn hình review.
- Trang hồ sơ không đưa các dòng nguồn trùng vào danh sách chính. Có liên kết đến danh sách trùng chờ kiểm tra.
- Đọc tương thích bản nguồn cũ có cảnh báo/trùng chung; tách theo loại thông báo, không xóa/sửa bản nguồn đã lưu.

## Kiểm chứng

- tests/import-review.cjs: đếm dòng, dòng cảnh báo ở danh sách chính, dòng trùng riêng và giữ cảnh báo kèm dòng trùng.
- tests/source-row-acceptance.cjs: dòng chưa hợp lệ vẫn được lưu nguồn, preview không ghi.
- npm test và TypeScript đạt; build kiểm tra sau thay đổi.
- Không nhập lại, xóa hoặc tự xử lý dữ liệu trùng của khách trong lần sửa này.

- Đối chiếu dữ liệu đang lưu lúc sửa: 819 dòng trùng thuộc DS_THUONG, không có dòng DS_TONG trùng trong nguồn hiện tại. Cảnh báo dữ liệu và trùng được đếm/hiển thị riêng, không tính theo số thông báo.
- Thưởng nguồn trùng cũng bị tách khỏi phần thưởng mở rộng ở hồ sơ. Danh sách trùng chờ kiểm tra bao gồm mọi loại file; các bản nghiệp vụ gốc đã có được giữ nguyên, không tự xóa.
