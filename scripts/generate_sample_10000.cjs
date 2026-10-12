const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FACTORIES = [
  'Luxshare QC',
  'Canon',
  'Goertek',
  'Fushan',
  'Amphenol',
  'Bảo vệ',
  'Foxconn',
  'Luxshare VT',
  'LG',
];

const RECRUITERS = [
  'Nguyễn Thu Trang',
  'Lê Hoàng Nam',
  'Trần Minh Đức',
  'Phạm Quỳnh Anh',
  'Đỗ Tuấn Anh',
  'Vũ Thị Mai',
  'Hoàng Văn Khang',
  'Bùi Thảo Linh',
  'Đinh Quốc Tuấn',
  'Mai Phương Thảo',
  'Vũ Đức Thịnh',
  'Nguyễn Hồng Hạnh',
];

const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Phan', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đoàn', 'Trịnh'];
const MID_NAMES_MALE = ['Văn', 'Đình', 'Đức', 'Hữu', 'Minh', 'Quang', 'Hải', 'Tuấn', 'Ngọc', 'Công', 'Bảo', 'Thế', 'Anh', 'Trọng'];
const MID_NAMES_FEMALE = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Phương', 'Kim', 'Mai', 'Thùy', 'Hải', 'Ánh', 'Diệu', 'Yến'];
const FIRST_NAMES_MALE = ['An', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hiếu', 'Hoàng', 'Huy', 'Hùng', 'Khánh', 'Long', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Thắng', 'Thịnh', 'Tiến', 'Trung', 'Tuấn', 'Tùng', 'Vinh', 'Khoa', 'Kiên', 'Hậu', 'Bách'];
const FIRST_NAMES_FEMALE = ['An', 'Bình', 'Hà', 'Hạnh', 'Hoa', 'Hương', 'Lan', 'Linh', 'Mai', 'Nga', 'Ngọc', 'Nhung', 'Tâm', 'Thảo', 'Thu', 'Thủy', 'Trang', 'Tuyết', 'Vy', 'Yến', 'Trâm', 'My', 'Hằng', 'Giang', 'Huyền', 'Phương'];

const PROVINCES = [
  { name: 'Nghệ An', code: '038' },
  { name: 'Thanh Hóa', code: '037' },
  { name: 'Bắc Giang', code: '024' },
  { name: 'Thái Nguyên', code: '019' },
  { name: 'Nam Định', code: '035' },
  { name: 'Ninh Bình', code: '030' },
  { name: 'Hải Dương', code: '031' },
  { name: 'Hà Nội', code: '001' },
  { name: 'Phú Thọ', code: '025' },
  { name: 'Vĩnh Phúc', code: '026' },
  { name: 'Hà Tĩnh', code: '042' },
  { name: 'Quảng Bình', code: '044' },
  { name: 'Lạng Sơn', code: '020' },
  { name: 'Tuyên Quang', code: '008' },
  { name: 'Yên Bái', code: '015' },
  { name: 'Hòa Bình', code: '017' },
];

const BANKS = ['Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'VietinBank', 'Agribank', 'VPBank', 'ACB'];

const LEAVE_REASONS = [
  'Việc gia đình',
  'Lương thưởng không phù hợp',
  'Sức khỏe không đảm bảo',
  'Vi phạm nội quy xưởng',
  'Hết hạn hợp đồng thời vụ',
  'Chuyển nơi cư trú',
  'Tìm được công việc gần nhà hơn',
  'Đi học / ôn thi tiếp',
];

const SOURCES = ['Facebook Tuyển dụng', 'Zalo Tìm việc', 'Người quen giới thiệu', 'Tự do ứng tuyển', 'Đội xe đón công nhân', 'Cổng việc làm KCN', 'TikTok Tuyển dụng'];

function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase();
}

function pad(num, size = 2) {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateData(count = 10000) {
  const dsTongRows = [];
  const dsThuongRows = [];
  const stkRows = [];
  const duplicateAlertRows = [];

  const usedPhones = [];

  for (let i = 1; i <= count; i++) {
    const isMale = Math.random() > 0.45;
    const gender = isMale ? 'Nam' : 'Nữ';
    const lastName = getRandomItem(LAST_NAMES);
    const midName = isMale ? getRandomItem(MID_NAMES_MALE) : getRandomItem(MID_NAMES_FEMALE);
    const firstName = isMale ? getRandomItem(FIRST_NAMES_MALE) : getRandomItem(FIRST_NAMES_FEMALE);
    const fullName = `${lastName} ${midName} ${firstName}`;

    // Ngày sinh: 1985 -> 2007 (độ tuổi 18 - 41)
    const birthYear = 1985 + Math.floor(Math.random() * 23);
    const birthMonth = 1 + Math.floor(Math.random() * 12);
    const birthDay = 1 + Math.floor(Math.random() * 28);
    const dob = `${pad(birthDay)}/${pad(birthMonth)}/${birthYear}`;

    // Tỉnh và CCCD 12 số chuẩn
    const provinceObj = getRandomItem(PROVINCES);
    const centuryGenderCode = birthYear >= 2000 ? (isMale ? '2' : '3') : (isMale ? '0' : '1');
    const yearCode = birthYear.toString().slice(-2);
    const randomSeq = pad(i, 6);
    const idCard = `${provinceObj.code}${centuryGenderCode}${yearCode}${randomSeq}`;

    // SĐT 10 số
    let phone = `09${pad(Math.floor(Math.random() * 100), 2)}${pad(Math.floor(Math.random() * 1000000), 6)}`;
    // Tạo khoảng 150 trường hợp trùng SĐT có chủ đích để kiểm thử cảnh báo
    if (i > 500 && i <= 650) {
      phone = usedPhones[i - 500];
    } else {
      usedPhones.push(phone);
    }

    const factory = getRandomItem(FACTORIES);
    const recruiter = getRandomItem(RECRUITERS);
    const source = getRandomItem(SOURCES);

    // Ngày PV: Tháng 01 đến Tháng 10 năm 2026 (T01.2026 -> T10.2026)
    const pvMonth = 1 + Math.floor(Math.random() * 10);
    const pvDay = 1 + Math.floor(Math.random() * 28);
    const interviewDate = `${pad(pvDay)}/${pad(pvMonth)}/2026`;
    const onboardingMonth = pvMonth < 10 ? `T0${pvMonth}.2026` : `T${pvMonth}.2026`;

    // Tình trạng lao động
    const statusRand = Math.random();
    let status = 'Đang làm việc';
    let leaveDate = '';
    let leaveReason = '';

    if (statusRand < 0.15) {
      status = 'Đã nghỉ việc';
      const leaveDay = Math.min(28, pvDay + 5 + Math.floor(Math.random() * 15));
      leaveDate = `${pad(leaveDay)}/${pad(pvMonth)}/2026`;
      leaveReason = getRandomItem(LEAVE_REASONS);
    } else if (statusRand < 0.25) {
      status = 'Đạt phỏng vấn';
    } else if (statusRand < 0.30) {
      status = 'Đang chờ phỏng vấn';
    }

    // Ghi nhận sheet Cảnh báo trùng nếu bị trùng SĐT hoặc nghỉ việc quay lại
    if (i > 500 && i <= 650) {
      duplicateAlertRows.push({
        'CCCD': idCard,
        'Họ và Tên': fullName,
        'Nhà máy PV': factory,
        'Tình Trạng': status,
        'Ngày PV': interviewDate,
      });
    }

    // 1. Dòng DS_TONG
    dsTongRows.push({
      'STT': i,
      'Nhà máy PV': factory,
      'Nhà máy làm việc': factory,
      'Loại HD': 'Thời vụ',
      'Tình trạng ': status,
      'Ngày NH ': leaveDate,
      'Lý do': leaveReason,
      'Mã NV': idCard.slice(-6),
      'Họ và tên ': fullName,
      'Ngày sinh': dob,
      'Giới tính ': gender,
      'số CCCD': idCard,
      'Ngày cấp': `15/05/${birthYear + 18}`,
      'Địa chỉ': `${provinceObj.name}`,
      'SĐT': phone,
      'Tuyển dụng': recruiter,
      'Đón xe - KTX': Math.random() > 0.5 ? 'Có xe đón' : 'Tự túc',
      'Ngày PV': interviewDate,
      'Ngày Đào tạo dự kiến ': `${pad(Math.min(28, pvDay + 2))}/${pad(pvMonth)}/2026`,
      'Tình trạng Đào tạo dự kiến ': 'Đã hoàn thành',
      'Ngày đào tạo chuẩn': `${pad(Math.min(28, pvDay + 2))}/${pad(pvMonth)}/2026`,
      'Tháng nhận việc ': onboardingMonth,
      'Nguồn ': source,
    });

    // 2. Tài khoản Ngân hàng
    const bank = getRandomItem(BANKS);
    const accNum = `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const isMismatch = Math.random() < 0.05; // 5% lệch tên
    const isAuth = !isMismatch && Math.random() < 0.10; // 10% mượn thẻ

    let accountHolder = removeAccents(fullName);
    let bankStatus = 'Hợp lệ';
    let warningBank = '';
    let bankCheckResult = 'Khớp tên 100%';

    if (isMismatch) {
      accountHolder = 'NGUYEN VAN KHAC';
      bankStatus = 'Cảnh báo sai STK';
      warningBank = 'Lệch tên CCCD';
      bankCheckResult = 'Tên không khớp với hồ sơ';
    } else if (isAuth) {
      accountHolder = removeAccents(`${lastName} ${midName} HÙNG`);
      bankStatus = 'Ủy quyền';
      warningBank = 'Mượn tài khoản người thân';
      bankCheckResult = 'Ủy quyền hợp lệ';
    }

    stkRows.push({
      'STT': i,
      'Công ty': factory,
      'TT': i,
      'Kết Quả PV': status === 'Đang chờ phỏng vấn' ? 'Chờ' : 'Đỗ',
      'Họ và tên': fullName,
      'Ngày sinh': dob,
      'SĐT': phone,
      'CMT/CCCD': idCard,
      'Ngày PV': interviewDate,
      'Tuyển Dụng': recruiter,
      'Tình trạng STK': bankStatus,
      'Cảnh báo': warningBank,
      ' STK': accNum,
      'Tình trạng STK_1': bankStatus,
      'Người check': 'Kế toán Thu Phương',
      'Kết Quả': bankCheckResult,
      'Cảnh báo sai STK': isMismatch ? 'CẢNH BÁO' : '',
      ' STK_1': accNum,
      'Ngân hàng check': bank,
      'Người check_1': 'Kế toán Thu Phương',
      'Kết Quả_1': bankCheckResult,
    });

    // 3. Bảng Thưởng DS_THUONG
    let b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, b7 = 0;
    if (status === 'Đang làm việc') {
      b1 = 300000;
      b2 = 500000;
      b3 = 500000;
      b4 = Math.random() > 0.3 ? 1000000 : 0;
      b5 = Math.random() > 0.6 ? 1000000 : 0;
      b6 = Math.random() > 0.8 ? 1500000 : 0;
      b7 = Math.random() > 0.9 ? 2000000 : 0;
    } else if (status === 'Đã nghỉ việc') {
      b1 = Math.random() > 0.3 ? 300000 : 0;
      b2 = Math.random() > 0.7 ? 500000 : 0;
    }

    dsThuongRows.push({
      'STT': i,
      'Công ty': factory,
      'Tháng': onboardingMonth,
      'Ngày PV': interviewDate,
      'Chính sách': 'Chính sách Mùa Vụ 2026',
      'Mã nhân viên': idCard.slice(-6),
      'Họ tên': fullName,
      'Số CCCD': idCard,
      'STK': accNum,
      'Ngân hàng': bank,
      'Thưởng lần 1': b1,
      'Thưởng lần 2': b2,
      'Thưởng lần 3': b3,
      'Thưởng lần 4': b4,
      'Thưởng lần 5': b5,
      'Thưởng lần 6': b6,
      'Thưởng lần 7': b7,
    });
  }

  return { dsTongRows, dsThuongRows, stkRows, duplicateAlertRows };
}

async function main() {
  console.log('🔄 Đang tạo dữ liệu mẫu 10.000 người lao động chuẩn 2026 (T01 - T10)...');
  const startTime = Date.now();
  const { dsTongRows, dsThuongRows, stkRows, duplicateAlertRows } = generateData(10000);

  // Tạo workbook với 4 sheet chuẩn
  const workbook = XLSX.utils.book_new();

  const wsTong = XLSX.utils.json_to_sheet(dsTongRows);
  XLSX.utils.book_append_sheet(workbook, wsTong, 'DS_TONG');

  const wsThuong = XLSX.utils.json_to_sheet(dsThuongRows);
  XLSX.utils.book_append_sheet(workbook, wsThuong, 'DS_THUONG');

  const wsSTK = XLSX.utils.json_to_sheet(stkRows);
  XLSX.utils.book_append_sheet(workbook, wsSTK, 'STK ngân hàng 2026');

  const wsTrung = XLSX.utils.json_to_sheet(duplicateAlertRows);
  XLSX.utils.book_append_sheet(workbook, wsTrung, 'Cảnh báo trùng');

  const fileName = 'Mau_Du_Lieu_10000_LaoDong_2026.xlsx';

  // 1. Lưu vào thư mục Downloads của người dùng
  const userDownloadsDir = 'C:\\Users\\nguye\\Downloads';
  const downloadFilePath = path.join(userDownloadsDir, fileName);
  XLSX.writeFile(workbook, downloadFilePath);
  console.log(`✅ Đã lưu file tại thư mục Tải Xuống (Downloads): ${downloadFilePath}`);

  // 2. Lưu vào thư mục public của dự án để đồng bộ tải trực tiếp từ web
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicFilePath = path.join(publicDir, fileName);
  XLSX.writeFile(workbook, publicFilePath);
  console.log(`✅ Đã lưu bản sao trên web public: ${publicFilePath}`);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🎉 Hoàn thành trong ${durationSec}s!`);
}

main().catch(console.error);
