# ĐẶC TẢ L-INCENTIVE — BẢN CẬP NHẬT CỤC BỘ

Ngày cập nhật: 12/10/2026. Phạm vi: quản lý hồ sơ lao động, đợt tuyển dụng, thưởng, thông tin tài khoản ngân hàng và Excel tại máy cục bộ.

Tài liệu này thay thế mô tả chức năng trong README v2.0. Những mục “chưa có” được ghi rõ để tránh nhầm với chức năng đã triển khai. Chưa nghiệm thu với người dùng; chưa triển khai hoặc phát hành công khai.

## 1. Mục tiêu và giới hạn đã thống nhất

- Hoàn thiện mã nguồn và kiểm thử cục bộ, giữ nguyên cấu trúc SQLite, dữ liệu hiện có và `.env`.
- Tài khoản đăng nhập, khóa ký phiên và nhật ký tài khoản nằm trong `.local/auth.json`, tách khỏi dữ liệu lao động.
- Không chạy migration, không nhập thử vào `prisma/dev.db`, không đưa mã lên Git và không triển khai.
- Dữ liệu mẫu trong kiểm thử nằm trong `.local/qa-*/test.db`, không phải dữ liệu doanh nghiệp.
- Không tạo kết quả xác minh ngân hàng giả, không thực hiện chuyển tiền và không diễn giải “đã duyệt” hoặc “đã khóa sổ” thành “đã thanh toán”.

## 2. Kiến trúc và lưu trữ

- Next.js 14, React 18, TypeScript, Ant Design; backend là các Route Handler trong `src/app/api`.
- Prisma 5 và SQLite; mô hình hiện có: Worker, WorkAssignment, BonusRecord, BankAccount, BonusPolicy, AuditLog.
- Một Worker có một CCCD/CMT duy nhất, nhiều WorkAssignment, BonusRecord và BankAccount.
- Đợt hiện tại được chọn theo `createdAt` giảm dần, thêm `id` để ổn định thứ tự khi trùng thời gian.
- Phiên đăng nhập có chữ ký HMAC, cookie HttpOnly/SameSite Strict, hết hạn sau 8 giờ. Cookie Secure khi dùng HTTPS.
- Mật khẩu được băm bằng scrypt và salt riêng; không lưu mật khẩu rõ. Không có tài khoản hoặc mật khẩu mặc định.
- API kiểm tra đăng nhập và quyền phía máy chủ. Các API thay đổi dữ liệu kiểm tra Origin/Host; không chỉ dựa vào nút trên giao diện.
- Đổi quyền, mật khẩu, tạm khóa hoặc đăng xuất làm vô hiệu các phiên cũ của tài khoản. Nút đăng xuất kết thúc mọi phiên của tài khoản.
- API đăng nhập và tra cứu có giới hạn số lần trong bộ nhớ. Đây là giải pháp cho máy cục bộ, chưa thay thế kho giới hạn dùng chung khi chạy nhiều máy chủ.

## 3. Đăng nhập, tài khoản và phân quyền

### 3.1 Khởi tạo

Quản trị viên chạy `npm run auth:setup` trên máy để tự đặt tên đăng nhập và mật khẩu. Tài khoản đầu tiên phải là ADMIN. Mật khẩu tối thiểu 12 ký tự, tối đa 128 ký tự; nhập lại để xác nhận. Không in mật khẩu ra kết quả lệnh.

Sau khi đăng nhập, ADMIN có thể tạo tài khoản, đổi vai trò, đổi mật khẩu và tạm khóa tài khoản tại màn hình Phân quyền. Không được hạ quyền hoặc tạm khóa quản trị viên hoạt động cuối cùng. Không xóa tài khoản vĩnh viễn.

### 3.2 Quyền

| Chức năng | ADMIN | HR | FINANCE | VIEWER |
|---|---|---|---|---|
| Đọc dữ liệu nội bộ | Có | Có | Có | Có |
| Tạo/sửa hồ sơ, nghỉ việc, tái tuyển, nhập Excel | Có | Có | Không | Không |
| Tạo/sửa tài khoản ngân hàng | Có | Không | Có | Không |
| Cấu hình chính sách, tạo/sửa dự thảo thưởng | Có | Không | Có | Không |
| Duyệt và khóa thưởng | Có | Không | Có | Không |
| Xuất hồ sơ, cảnh báo và file mẫu | Có | Có | Có | Không |
| Yêu cầu xuất lệnh chi | Có | Không | Có | Không |
| Xem lịch sử thay đổi và quản lý tài khoản | Có | Không | Không | Không |

Phân quyền theo vai trò, chưa giới hạn dữ liệu theo từng nhà máy/recruiter. Mọi vai trò đã đăng nhập có quyền đọc nội bộ; cần duyệt lại phạm vi đọc trước khi dùng với đội ngũ thực tế.

## 4. Dashboard

- Tổng hồ sơ và số người thuộc các trạng thái: chờ phỏng vấn, đạt phỏng vấn, đang làm, đã nghỉ.
- Ma trận 9 nhà máy ban đầu và các nhà máy khác xuất hiện trong dữ liệu.
- Mỗi hồ sơ được đếm theo đợt hiện tại, không cộng mọi lần tái tuyển vào số hồ sơ.
- Tỷ lệ đang làm việc = số đang làm / tổng hồ sơ. Đây không phải tỷ lệ giữ chân theo cohort hoặc theo số ngày công.
- Tổng ngân sách thưởng chỉ cộng APPROVED và LOCKED.
- Thống kê recruiter ưu tiên người phụ trách trên đợt hiện tại.
- Phân bố tỉnh/thành ưu tiên trường province; nếu thiếu, dùng phần cuối địa chỉ như nhãn thống kê. Chưa xác minh địa giới và chưa có bản đồ GIS.
- Cảnh báo lệch tên dùng trạng thái MISMATCH hiện có. Các trạng thái dữ liệu cũ không được coi là bằng chứng xác minh ngân hàng.

## 5. Hồ sơ và vòng đời tuyển dụng

### 5.1 Trường dữ liệu

Hồ sơ: mã NV, họ tên, ngày sinh, giới tính, CCCD/CMT, ngày/nơi cấp, SĐT, địa chỉ, tỉnh/thành, recruiter, đội nhóm, nguồn.

Đợt tuyển dụng: nhà máy PV, nhà máy làm việc, loại hợp đồng, tình trạng, ngày/lý do nghỉ, đón xe/KTX, ngày PV, ngày đào tạo dự kiến, tình trạng đào tạo dự kiến, ngày đào tạo chuẩn, kỳ nhận việc, recruiter và nguồn.

### 5.2 Kiểm tra

- Họ tên và CCCD 12 số hoặc CMT cũ 9 số là bắt buộc. Chỉ kiểm tra định dạng, chưa xác minh giấy tờ với cơ quan cấp.
- SĐT được bỏ khoảng trắng/dấu phân cách; `+84` được chuẩn hóa về `0`. Chỉ chấp nhận số nội địa bắt đầu bằng 0 với 10–11 chữ số.
- Ngày chấp nhận dd/mm/yyyy hoặc yyyy-mm-dd và kiểm tra ngày có thật; năm từ 1900 đến 2100.
- Kỳ nhận việc nếu nhập phải có dạng T01.2026 đến T12.2026; backend chấp nhận năm 4 chữ số.
- Không tự điền nhà máy hoặc kỳ tháng nếu người dùng chưa cung cấp. Trạng thái mặc định là chờ phỏng vấn.
- Sửa hồ sơ phải gửi đúng đợt hiện tại và dấu thời gian Worker/WorkAssignment. Dữ liệu đã thay đổi sẽ trả 409, yêu cầu tải lại.

### 5.3 Trùng lặp và tái tuyển

- CCCD đã tồn tại: chặn tạo Worker mới.
- SĐT trùng: cảnh báo và cần xác nhận đã kiểm tra việc dùng chung số; có nhật ký khi tạo mới.
- Tái tuyển: dùng nút Tái tuyển trên hồ sơ đã nghỉ, giữ Worker, tạo WorkAssignment mới, giữ nguyên các đợt và thưởng cũ.
- Chặn tái tuyển nếu còn bất kỳ đợt chưa nghỉ, tên không khớp hồ sơ cũ hoặc người lao động thuộc danh sách hạn chế.
- Màn hình Lịch sử hiển thị toàn bộ đợt tuyển dụng.
- Đợt đã nghỉ không được đổi trực tiếp thành đang làm; phải dùng tái tuyển.

### 5.4 Nghỉ việc và bảo toàn lịch sử

- Trạng thái đã nghỉ yêu cầu ngày nghỉ và lý do; ngày nghỉ không được trước ngày PV.
- Khi đợt chưa nghỉ, các trường ngày/lý do nghỉ được để trống.
- API DELETE không xóa vĩnh viễn hồ sơ; giao diện thay nút xóa bằng lịch sử/tái tuyển. Điều này tránh xóa dây chuyền các bản ghi thưởng và tài khoản.
- Ghi dữ liệu và nhật ký nghiệp vụ trong cùng transaction.

## 6. Chính sách và thưởng

### 6.1 Chính sách

- Tạo/sửa tên chính sách, nhà máy, ghi chú, trạng thái đang dùng/ngừng dùng.
- Mỗi chính sách gồm đúng 7 mốc liên tiếp: số thứ tự, mô tả điều kiện và số tiền nguyên không âm.
- Sửa chính sách cần dấu thời gian hiện tại; không tự sửa số tiền các bản ghi thưởng đã tạo.
- Chọn chính sách trong form thưởng điền tên căn cứ và nhà máy tham chiếu; không tự coi tất cả các mốc đã đạt.
- Chưa có bảng chấm công hoặc cơ chế tự xác định đạt mốc từ số ngày công. Nhân viên nhập số tiền cho các mốc đã xác nhận.
- Các mức 300.000/500.000/1.000.000/1.500.000 trong tài liệu cũ không được coi là chính sách doanh nghiệp đã xác nhận.

### 6.2 Bản ghi thưởng

- Chọn lao động, kỳ tháng, căn cứ và 7 khoản thưởng. Mặc định các khoản là 0.
- Số tiền phải là số nguyên không âm trong giới hạn Number.MAX_SAFE_INTEGER; tổng tính trên máy chủ.
- Bản ghi mới gắn với đợt hiện tại. Nhà máy lấy từ đợt đó; không tin nhà máy gửi tùy ý từ trình duyệt.
- Mỗi đợt có tối đa một bản ghi mới trong cùng kỳ; sửa dự thảo để bổ sung các mốc. Bản ghi cũ chưa gắn đợt nhưng cùng lao động/kỳ cũng chặn tạo thêm để tránh trả thưởng trùng.
- Dự thảo có thể sửa 7 khoản và căn cứ; cần updatedAt để tránh ghi đè thay đổi mới.
- Không thay lao động/kỳ/đợt khi sửa dự thảo. Chưa có quy trình hủy hoặc điều chỉnh bản ghi đã duyệt.

### 6.3 Duyệt và khóa

DRAFT → APPROVED → LOCKED. REVIEWED trong dữ liệu cũ được phép chuyển sang APPROVED.

- Duyệt yêu cầu tổng tiền dương, số tiền hợp lệ và tổng chi tiết khớp tổng lưu.
- Người duyệt lấy từ tài khoản đăng nhập; không nhận tên người duyệt tự khai từ trình duyệt.
- Khóa yêu cầu thông tin người/thời gian duyệt đã có.
- Không chuyển lùi, bỏ qua bước hoặc đổi trạng thái sau LOCKED.
- Sửa dự thảo bị chặn khi APPROVED hoặc LOCKED.
- Cập nhật có kiểm tra trạng thái/thời gian hiện tại; nhật ký cùng transaction.
- Duyệt và khóa là trạng thái nghiệp vụ, chưa phải bằng chứng đủ công hoặc đã chuyển tiền.

## 7. Tài khoản ngân hàng và điều kiện xuất lệnh chi

### 7.1 Ghi nhận tài khoản

- Tạo/sửa liên kết lao động, ngân hàng, STK dạng chuỗi số, tên chủ tài khoản và khai báo nhận thay/quan hệ.
- Đối chiếu tên sau chuẩn hóa dấu và khoảng trắng chỉ tạo thông báo tham khảo.
- Tài khoản mới hoặc được sửa luôn UNVERIFIED, isNameVerified=false, không tự ghi người/thời điểm kiểm chứng.
- Khai báo nhận thay không đồng nghĩa giấy ủy quyền đã được kiểm tra.
- Giữ nguyên dữ liệu cũ nhưng không dùng cờ VALID/AUTHORIZED cũ để cho phép chi tiền.
- Tên chủ tài khoản giả ngẫu nhiên đã bị loại bỏ. API xác minh trả 503 BANK_VERIFICATION_UNAVAILABLE do chưa kết nối nhà cung cấp thật.

### 7.2 Xuất lệnh chi

- ADMIN/FINANCE phải chọn kỳ tháng hợp lệ.
- Kiểm tra toàn bộ thưởng dương trong kỳ; nếu có bản ghi chưa đủ điều kiện, chặn cả đợt và trả lý do. Không âm thầm bỏ qua người chưa đủ điều kiện.
- Cần trạng thái APPROVED hoặc LOCKED, thông tin duyệt, số tiền nguyên dương và tài khoản nhận được xác định duy nhất.
- Thiếu tài khoản hoặc có nhiều tài khoản đều bị chặn.
- Chưa có nguồn xác minh ngân hàng/ủy quyền thật nên hiện mọi lệnh chi đều bị chặn, kể cả khi tên nhập trùng hồ sơ.
- Chưa chứng minh tương thích mẫu nhập Internet Banking của từng ngân hàng; không gọi file hiện tại là lệnh chi sẵn sàng thanh toán.
- Không có API chuyển tiền hoặc trường trạng thái đã giải ngân. Việc tích hợp thật cần nhà cung cấp, quyền truy cập, mẫu ngân hàng và quy trình phê duyệt riêng.

## 8. Excel

### 8.1 Nhập

- Chỉ nhận `.xlsx`, tối đa 5 MB và 5.000 dòng dữ liệu, sheet `DS_TONG`.
- Kiểm tra tên cột, cột trùng, họ tên và CCCD; tải file mẫu từ giao diện.
- CCCD/SĐT phải là Text. Dòng lưu dạng số bị báo lỗi vì có thể đã mất số 0 đầu; không tự đoán hoặc khôi phục.
- Chuẩn hóa tên cột bằng cách bỏ khoảng trắng đầu/cuối; hỗ trợ các tên cột thay thế đã nêu trong mã.
- Ngày Excel dạng serial được đổi sang ngày lịch rồi qua kiểm tra ngày.
- Ánh xạ đủ các trường hồ sơ/đợt tuyển dụng, không tự sao chép nhà máy PV thành nhà máy làm việc.
- Lượt đầu chỉ xem trước: số dòng hợp lệ, trùng CCCD, lỗi và cảnh báo SĐT. Chưa ghi dữ liệu.
- Sau khi người dùng xác nhận, file được đọc và kiểm tra lại. Dòng hợp lệ được thêm; dòng lỗi/trùng bỏ qua và báo từng dòng. Mỗi dòng lưu cùng nhật ký trong transaction.
- Không ghi đè hồ sơ cũ, không tự tái tuyển từ Excel. Dùng màn hình Hồ sơ để xác minh và tái tuyển.
- Chưa nhập sheet DS_THUONG, STK hoặc file `.xls`. Tài liệu cũ tuyên bố hỗ trợ các sheet này vượt quá chức năng thực tế.

### 8.2 Xuất

- Xuất DS_TONG theo đợt hiện tại, giữ CCCD/STK/SĐT dạng chuỗi.
- Xuất cảnh báo SĐT trùng và thông tin tái tuyển; phân biệt tái tuyển với trùng danh tính.
- Tải file mẫu DS_TONG với tên cột, không dùng dữ liệu người lao động.
- Các API xuất kiểm tra quyền. VIEWER không có quyền xuất Excel.
- Lệnh chi có điều kiện chặn như mục 7.

## 9. Cổng tra cứu

- Nhập CCCD/CMT và đúng 4 chữ số cuối SĐT; thông tin sai trả cùng thông báo để không phân biệt CCCD tồn tại hay không.
- Chỉ trả nhà máy/trạng thái/kỳ nhận việc của đợt hiện tại, thưởng APPROVED/LOCKED và STK che chỉ còn 4 số cuối.
- Không trả đầy đủ CCCD, SĐT, địa chỉ, thông tin nội bộ hoặc tên chủ tài khoản.
- Có giới hạn lượt tra cứu toàn hệ thống và theo định danh được băm; phản hồi không lưu cache.
- CCCD + 4 số cuối là cơ chế đối chiếu yếu, không chứng minh quyền sở hữu SĐT. Chưa có OTP. Cần nâng cấp xác thực trước khi mở ra Internet.
- Không hiển thị ngày công hoặc tuyên bố đã chuyển tiền vì hiện chưa có nguồn dữ liệu đó.

## 10. Nhật ký

- Màn hình Lịch sử thay đổi dành cho ADMIN, lọc theo phân hệ/người thao tác, phân trang 20 dòng.
- Nhật ký SQL ghi tạo/sửa hồ sơ, tái tuyển, tạo/sửa/duyệt/khóa thưởng, chính sách, tài khoản ngân hàng và nhập Excel.
- Nhật ký tài khoản AUTH nằm trong tệp cấu hình riêng, gộp vào màn hình; ghi tạo, đổi quyền/mật khẩu, tạm khóa và đăng xuất.
- Nhật ký là dấu vết thao tác, chưa phải snapshot đầy đủ trước/sau mọi trường và chưa có cơ chế chống sửa bởi người có quyền trên máy.

## 11. API chính

| API | Phương thức | Mục đích |
|---|---|---|
| /api/auth/login, logout, me | POST, POST, GET | Đăng nhập/đăng xuất/phiên |
| /api/users | GET, POST | Quản trị tài khoản |
| /api/workers | GET, POST | Danh sách, tạo hồ sơ/tái tuyển |
| /api/workers/:id | PUT, DELETE | Sửa hồ sơ; DELETE bị chặn |
| /api/bonuses | GET, POST, PATCH, PUT | Danh sách, tạo, sửa dự thảo, duyệt/khóa |
| /api/policies | GET, POST, PUT | Chính sách |
| /api/bank-accounts | GET, POST, PUT | Thông tin tài khoản |
| /api/bank-accounts/verify | POST | Báo chưa có xác minh thật |
| /api/dashboard, duplicates, audit | GET | Dashboard, cảnh báo, lịch sử |
| /api/excel-engine/import | POST multipart | Xem trước hoặc xác nhận nhập |
| /api/excel-engine/export | GET | WORKERS / DUPLICATES / TEMPLATE / PAYMENT_BATCH |
| /api/lookup | POST | Tra cứu giới hạn thông tin |

Mã phản hồi thường dùng: 400 dữ liệu sai; 401 chưa đăng nhập; 403 thiếu quyền/Origin sai; 404 không có bản ghi; 409 xung đột/chưa đủ điều kiện; 429 quá nhiều yêu cầu; 503 dịch vụ chưa cấu hình.

## 12. Chạy cục bộ và nghiệm thu

1. `npm run auth:setup`: tạo ADMIN đầu tiên với thông tin do người dùng tự đặt.
2. `npm run dev`: mở http://127.0.0.1:3000, đăng nhập và kiểm tra quyền trước khi dùng dữ liệu thật.
3. `npm test`: kiểm thử logic và API giả lập, không cần CSDL thật.
4. `npm run test:integration`: tạo CSDL/tài khoản kiểm thử riêng, chạy máy chủ loopback cổng 3101, kiểm tra HTTP, sau đó dừng máy chủ kiểm thử. Cần quyền kết nối localhost.
5. `npm run build`: kiểm tra bản build; `npm start`: chạy bản build cục bộ.

Dev dùng thư mục `.next-local`, build/start dùng `.next-production`, kiểm thử dev dùng `.next-qa` để tránh xung đột với máy chủ cũ dùng `.next`. Cả lệnh dev/start đều chỉ bind 127.0.0.1. Không tự mở mạng LAN hoặc Internet.

Điều kiện nghiệm thu: tạo/sửa hồ sơ, báo nghỉ, tái tuyển giữ lịch sử; xác nhận cảnh báo trùng; nhập Excel xem trước và báo lỗi đúng; tạo/sửa/duyệt/khóa thưởng; kiểm tra quyền bị từ chối; sửa tài khoản vẫn chưa xác minh; lệnh chi bị chặn đúng lý do; quản lý tài khoản và xem nhật ký. Không thử ghi vào dữ liệu thật trước khi người dùng duyệt.

## 13. Những việc cần quyết định trước khi vận hành thật

- Chính sách thưởng, mốc công và căn cứ đạt mốc của doanh nghiệp.
- Quyền đọc theo recruiter/nhà máy, danh sách tài khoản và người có thẩm quyền duyệt.
- Nguồn chấm công, giấy ủy quyền, dịch vụ xác minh ngân hàng, mẫu lệnh chi và đối soát thanh toán.
- Quy trình điều chỉnh/hủy thưởng đã duyệt, lựa chọn tài khoản nhận khi có nhiều STK.
- OTP cho tra cứu công khai; triển khai HTTPS, kho phiên/giới hạn dùng chung, backup và phục hồi, kiểm soát quyền tệp cấu hình và nhật ký.
- Chuyển PostgreSQL không chỉ là thay URL: cần đổi provider, migration, chuyển dữ liệu và kiểm thử; không thực hiện trong đợt này.

Không có thay đổi schema hoặc tích hợp bên ngoài nào được coi là đã được duyệt chỉ vì tài liệu nêu ở mục này.

## 14. Kết quả xác minh kỹ thuật của đợt cập nhật

Kiểm tra TypeScript, bộ kiểm thử logic/API giả lập và production build đều đạt. Bộ kiểm thử HTTP trên CSDL riêng gồm 61 kiểm tra, đã chạy trên bản production build cục bộ. Script so sánh hash CSDL gốc, schema và .env trước/sau: không đổi.

Đã kiểm tra trực quan màn hình đăng nhập, chưa nghiệm thu mọi form với tài khoản vận hành. Chi tiết và giới hạn kiểm thử nằm trong `KET_QUA_KIEM_THU_2026-10-12.md`. Chức năng chỉ được coi là nghiệm thu nghiệp vụ sau khi người dùng kiểm tra và duyệt.
