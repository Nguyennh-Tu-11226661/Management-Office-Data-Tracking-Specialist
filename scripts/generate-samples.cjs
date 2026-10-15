const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = 'D:\\Data mẫu';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Danh mục thực tế hỗ trợ sinh dữ liệu
const HO_TEN_LIST = [
  'Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Minh Tuấn', 'Vũ Thị Lan',
  'Đỗ Tuấn Anh', 'Bùi Thị Hằng', 'Hoàng Văn Hưng', 'Ngô Thu Trang', 'Đặng Quốc Bảo',
  'Dương Thị Mai', 'Lý Văn Cường', 'Mai Thị Kim', 'Phan Thanh Hải', 'Trịnh Văn Long',
  'Lương Thị Thảo', 'Hà Văn Dũng', 'Tạ Thị Huệ', 'Hồ Đức Thắng', 'Võ Thị Yến'
];

const PROVINCES = ['Bắc Ninh', 'Bắc Giang', 'Thái Nguyên', 'Hải Dương', 'Hà Nội', 'Phú Thọ', 'Nam Định', 'Ninh Bình', 'Thanh Hóa', 'Nghệ An'];
const RECRUITERS = ['Đỗ Tuấn Anh', 'Lê Thanh Mai', 'Nguyễn Thu Trang', 'Hoàng Văn Hưng', 'Trần Văn Nam'];
const TEAMS = ['Team A1 (Ép nhựa)', 'Team B2 (Lắp ráp)', 'Team SMT (Điện tử)', 'Team QC (Kiểm hàng)', 'Team Kho vận'];
const BANKS = ['Vietcombank', 'MB Bank', 'Techcombank', 'BIDV', 'Agribank', 'VPBank'];

function pad0(num, len = 2) {
  return String(num).padStart(len, '0');
}

function generateCCCD(index, prefix = '001') {
  return `${prefix}${pad0(Math.floor(index / 100), 3)}${pad0(index % 100, 3)}${pad0(index * 7 % 1000, 3)}`;
}

function generatePhone(index) {
  return `098${pad0(index, 3)}${pad0((index * 13) % 10000, 4)}`;
}

function generateSTK(index) {
  return `10${pad0(index, 4)}${pad0((index * 37) % 1000000, 6)}`;
}

function saveWorkbook(filename, sheetName, dataRows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(dataRows);

  // Tự căn chỉnh độ rộng cột cơ bản
  const colWidths = [];
  dataRows.forEach(row => {
    row.forEach((cell, colIdx) => {
      const len = cell ? String(cell).length : 5;
      colWidths[colIdx] = Math.max(colWidths[colIdx] || 10, len + 3);
    });
  });
  ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 35) }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const filePath = path.join(OUTPUT_DIR, filename);
  XLSX.writeFile(wb, filePath);
  console.log(`Đã tạo: ${filename}`);
}

// -------------------------------------------------------------
// NHÓM 1: 10 FILE DS_TONG
// -------------------------------------------------------------
const DS_TONG_HEADERS_FULL = [
  'STT', 'Nhà máy PV', 'Nhà máy làm việc', 'Loại HD', 'Tình trạng',
  'Ngày NH', 'Lý do', 'Mã NV', 'Họ và tên', 'Ngày sinh',
  'Giới tính', 'số CCCD', 'Ngày cấp', 'Địa chỉ', 'SĐT',
  'Tuyển dụng', 'Đón xe - KTX', 'Ngày PV', 'Ngày Đào tạo dự kiến',
  'Tình trạng Đào tạo dự kiến', 'Ngày đào tạo chuẩn', 'Tháng nhận việc', 'Nguồn',
  'STK', 'Ngân hàng'
];

// File 1: Đầy đủ - Luxshare QC T01.2026 (15 công nhân)
function create_01_DS_TONG_DayDu_Luxshare() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 15; i++) {
    rows.push([
      i, 'Luxshare QC', 'Luxshare QC', 'Thời vụ', 'Đang làm việc',
      '', '', `LX-01${pad0(i)}`, HO_TEN_LIST[i - 1], `1${i}/05/200${i % 5}`,
      i % 2 === 0 ? 'Nữ' : 'Nam', generateCCCD(i, '038'), '10/05/2021', PROVINCES[i % PROVINCES.length], generatePhone(i),
      RECRUITERS[i % RECRUITERS.length], 'Có xe đón', '05/01/2026', '07/01/2026',
      'Đã đào tạo', '08/01/2026', 'T01.2026', 'Tuyển dụng trực tiếp',
      generateSTK(i), BANKS[i % BANKS.length]
    ]);
  }
  saveWorkbook('01_DS_TONG_DayDu_Luxshare_T01.xlsx', 'DS_TONG', rows);
}

// File 2: Đầy đủ - Foxconn Đình Trám T02.2026 (15 công nhân)
function create_02_DS_TONG_DayDu_Foxconn() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 15; i++) {
    const idx = i + 15;
    rows.push([
      i, 'Foxconn', 'Foxconn Đình Trám', 'Thời vụ', 'Đang làm việc',
      '', '', `FX-02${pad0(i)}`, HO_TEN_LIST[(i + 3) % HO_TEN_LIST.length], `2${i % 8}/08/199${i % 8}`,
      i % 2 === 1 ? 'Nữ' : 'Nam', generateCCCD(idx, '024'), '15/06/2020', PROVINCES[(i + 2) % PROVINCES.length], generatePhone(idx),
      RECRUITERS[(i + 1) % RECRUITERS.length], 'Tự túc', '10/02/2026', '12/02/2026',
      'Đã đào tạo', '13/02/2026', 'T02.2026', 'Người quen giới thiệu',
      generateSTK(idx), BANKS[(i + 1) % BANKS.length]
    ]);
  }
  saveWorkbook('02_DS_TONG_DayDu_Foxconn_T02.xlsx', 'DS_TONG', rows);
}

// File 3: Đầy đủ - Canon Quế Võ T03.2026 (12 công nhân)
function create_03_DS_TONG_DayDu_Canon() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 12; i++) {
    const idx = i + 30;
    rows.push([
      i, 'Canon', 'Canon Quế Võ', 'Chính thức', 'Đang làm việc',
      '', '', `CN-03${pad0(i)}`, HO_TEN_LIST[(i + 5) % HO_TEN_LIST.length], `1${i % 9}/11/199${i % 7}`,
      i % 3 === 0 ? 'Nam' : 'Nữ', generateCCCD(idx, '027'), '20/07/2019', PROVINCES[(i + 4) % PROVINCES.length], generatePhone(idx),
      RECRUITERS[(i + 2) % RECRUITERS.length], 'Có xe đón', '15/03/2026', '17/03/2026',
      'Đã đào tạo', '18/03/2026', 'T03.2026', 'Fanpage tuyển dụng',
      generateSTK(idx), BANKS[(i + 2) % BANKS.length]
    ]);
  }
  saveWorkbook('03_DS_TONG_DayDu_Canon_T03.xlsx', 'DS_TONG', rows);
}

// File 4: Đầy đủ - Goertek Vina T04.2026 (12 công nhân)
function create_04_DS_TONG_DayDu_Goertek() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 12; i++) {
    const idx = i + 45;
    rows.push([
      i, 'Goertek', 'Goertek Vina', 'Thời vụ', 'Đang làm việc',
      '', '', `GT-04${pad0(i)}`, HO_TEN_LIST[(i + 7) % HO_TEN_LIST.length], `0${(i % 8) + 1}/04/200${i % 4}`,
      i % 2 === 0 ? 'Nam' : 'Nữ', generateCCCD(idx, '030'), '18/08/2021', PROVINCES[(i + 1) % PROVINCES.length], generatePhone(idx),
      RECRUITERS[(i + 3) % RECRUITERS.length], 'KTX công ty', '02/04/2026', '04/04/2026',
      'Đã đào tạo', '05/04/2026', 'T04.2026', 'Tuyển dụng trực tiếp',
      generateSTK(idx), BANKS[(i + 3) % BANKS.length]
    ]);
  }
  saveWorkbook('04_DS_TONG_DayDu_Goertek_T04.xlsx', 'DS_TONG', rows);
}

// File 5: Đầy đủ - Fushan & Amphenol T05.2026 (14 công nhân)
function create_05_DS_TONG_DayDu_FushanAmphenol() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 14; i++) {
    const idx = i + 60;
    const factory = i <= 7 ? 'Fushan' : 'Amphenol';
    rows.push([
      i, factory, factory, 'Thời vụ', 'Đang làm việc',
      '', '', `FA-05${pad0(i)}`, HO_TEN_LIST[(i + 9) % HO_TEN_LIST.length], `1${i % 9}/12/200${i % 3}`,
      i % 2 === 1 ? 'Nữ' : 'Nam', generateCCCD(idx, '035'), '25/09/2022', PROVINCES[(i + 3) % PROVINCES.length], generatePhone(idx),
      RECRUITERS[(i + 4) % RECRUITERS.length], 'Tự túc', '12/05/2026', '14/05/2026',
      'Đã đào tạo', '15/05/2026', 'T05.2026', 'Cộng tác viên',
      generateSTK(idx), BANKS[(i + 4) % BANKS.length]
    ]);
  }
  saveWorkbook('05_DS_TONG_DayDu_Amphenol_Fushan_T05.xlsx', 'DS_TONG', rows);
}

// File 6: Không đầy đủ - DS Phỏng vấn sơ bộ đợt 1 (Chỉ có Họ tên, CCCD, Ngày PV, Nhà máy PV)
// 10 công nhân này sẽ được cập nhật bổ sung ở File 7!
const PHONG_VAN_SO_BO_CCCDS = [
  '001099000101', '001099000102', '001099000103', '001099000104', '001099000105',
  '001099000106', '001099000107', '001099000108', '001099000109', '001099000110'
];

function create_06_DS_TONG_Thieu_SoBoPhongVan() {
  const headers = ['STT', 'Họ và tên', 'số CCCD', 'Nhà máy PV', 'Ngày PV', 'Tình trạng'];
  const rows = [headers];
  for (let i = 0; i < 10; i++) {
    rows.push([
      i + 1,
      HO_TEN_LIST[i],
      PHONG_VAN_SO_BO_CCCDS[i],
      'Luxshare QC',
      '20/06/2026',
      'Đang chờ phỏng vấn'
    ]);
  }
  saveWorkbook('06_DS_TONG_Thieu_SoBoPhongVan.xlsx', 'DS_TONG', rows);
}

// File 7: Cập nhật bổ sung (Test Smart Merge) cho 10 công nhân của File 6
// Bổ sung: SĐT, Mã NV, Ngày bắt đầu làm, Team, STK, Ngân hàng, Tình trạng 'Đang làm việc'
function create_07_DS_TONG_CapNhat_DienBoSung() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 0; i < 10; i++) {
    rows.push([
      i + 1,
      'Luxshare QC',
      'Luxshare QC',
      'Thời vụ',
      'Đang làm việc',
      '',
      '',
      `LX-SMART-${pad0(i + 1)}`,
      HO_TEN_LIST[i],
      `1${i}/02/199${i % 8}`,
      i % 2 === 0 ? 'Nam' : 'Nữ',
      PHONG_VAN_SO_BO_CCCDS[i],
      '15/01/2021',
      PROVINCES[i % PROVINCES.length],
      `09778899${pad0(i, 2)}`,
      'Đỗ Tuấn Anh',
      'Có xe đón',
      '20/06/2026',
      '22/06/2026',
      'Đã đào tạo',
      '23/06/2026',
      'T06.2026',
      'Tuyển dụng trực tiếp',
      `88990011${pad0(i, 4)}`,
      'Vietcombank'
    ]);
  }
  saveWorkbook('07_DS_TONG_CapNhat_DienBoSung_SmartMerge.xlsx', 'DS_TONG', rows);
}

// File 8: Không đầy đủ - Thiếu hoàn toàn SĐT và Địa chỉ quê quán (10 công nhân)
function create_08_DS_TONG_Thieu_SDT_DiaChi() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const idx = i + 100;
    rows.push([
      i, 'Canon', 'Canon Quế Võ', 'Thời vụ', 'Đang làm việc',
      '', '', `CN-NOSDT-${pad0(i)}`, HO_TEN_LIST[(i + 2) % HO_TEN_LIST.length], `1${i % 8}/03/200${i % 5}`,
      i % 2 === 0 ? 'Nữ' : 'Nam', generateCCCD(idx, '034'), '10/10/2021', '', '', // Địa chỉ và SĐT để trống!
      'Lê Thanh Mai', 'Tự túc', '05/07/2026', '07/07/2026',
      'Đã đào tạo', '08/07/2026', 'T07.2026', 'Fanpage',
      generateSTK(idx), 'BIDV'
    ]);
  }
  saveWorkbook('08_DS_TONG_Thieu_SDT_Va_DiaChi.xlsx', 'DS_TONG', rows);
}

// File 9: Không đầy đủ / Cảnh báo - Có người nghỉ việc nhưng cột Lý do nghỉ bị trống (10 công nhân)
function create_09_DS_TONG_CanhBao_NghiViec_ThieuLyDo() {
  const rows = [DS_TONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const idx = i + 120;
    const isLeaved = i % 2 === 1;
    rows.push([
      i, 'Goertek', 'Goertek Vina', 'Thời vụ',
      isLeaved ? 'Đã nghỉ việc' : 'Đang làm việc',
      isLeaved ? '15/08/2026' : '',
      isLeaved ? '' : '', // Lý do nghỉ để trống để kích hoạt cảnh báo nghiệp vụ!
      `GT-LV-${pad0(i)}`, HO_TEN_LIST[(i + 4) % HO_TEN_LIST.length], `2${i % 8}/07/199${i % 7}`,
      i % 2 === 1 ? 'Nữ' : 'Nam', generateCCCD(idx, '036'), '20/04/2020', PROVINCES[(i + 3) % PROVINCES.length], generatePhone(idx),
      'Nguyễn Thu Trang', 'Có xe đón', '01/08/2026', '03/08/2026',
      'Đã đào tạo', '04/08/2026', 'T08.2026', 'Trực tiếp',
      generateSTK(idx), 'MB Bank'
    ]);
  }
  saveWorkbook('09_DS_TONG_CanhBao_NghiViec_ThieuLyDo.xlsx', 'DS_TONG', rows);
}

// File 10: File kiểm thử Trùng lặp nội bộ (cùng CCCD xuất hiện 2 lần trong file) và lệch Họ tên
function create_10_DS_TONG_Test_TrungLap() {
  const rows = [DS_TONG_HEADERS_FULL];
  // 5 công nhân bình thường
  for (let i = 1; i <= 5; i++) {
    const idx = i + 150;
    rows.push([
      i, 'Foxconn', 'Foxconn Vân Trung', 'Thời vụ', 'Đang làm việc',
      '', '', `FX-DUP-${pad0(i)}`, HO_TEN_LIST[i], `1${i}/09/200${i % 4}`,
      'Nam', generateCCCD(idx, '031'), '15/08/2021', 'Bắc Giang', generatePhone(idx),
      'Đỗ Tuấn Anh', 'Có xe đón', '10/09/2026', '12/09/2026',
      'Đã đào tạo', '13/09/2026', 'T09.2026', 'Trực tiếp',
      generateSTK(idx), 'Techcombank'
    ]);
  }
  // Dòng 6: Trùng lặp nội bộ với Dòng 2 (cùng CCCD và cùng đợt PV)
  rows.push([
    6, 'Foxconn', 'Foxconn Vân Trung', 'Thời vụ', 'Đang làm việc',
    '', '', 'FX-DUP-02-B', HO_TEN_LIST[2], '12/09/2002',
    'Nam', generateCCCD(152, '031'), '15/08/2021', 'Bắc Giang', generatePhone(152),
    'Đỗ Tuấn Anh', 'Có xe đón', '10/09/2026', '12/09/2026',
    'Đã đào tạo', '13/09/2026', 'T09.2026', 'Trực tiếp',
    generateSTK(152), 'Techcombank'
  ]);
  // Dòng 7: Trùng lặp nội bộ với Dòng 3 nhưng cố tình đổi họ tên để test Sai lệch danh tính
  rows.push([
    7, 'Foxconn', 'Foxconn Vân Trung', 'Thời vụ', 'Đang làm việc',
    '', '', 'FX-DUP-03-WRONG', 'Tên Bị Sai Lệch', '13/09/2003',
    'Nam', generateCCCD(153, '031'), '15/08/2021', 'Bắc Giang', generatePhone(153),
    'Đỗ Tuấn Anh', 'Có xe đón', '10/09/2026', '12/09/2026',
    'Đã đào tạo', '13/09/2026', 'T09.2026', 'Trực tiếp',
    generateSTK(153), 'Techcombank'
  ]);
  saveWorkbook('10_DS_TONG_Test_TrungLap_Va_SaiDanhTinh.xlsx', 'DS_TONG', rows);
}

// -------------------------------------------------------------
// NHÓM 2: 10 FILE DS_THUONG
// -------------------------------------------------------------
const DS_THUONG_HEADERS_FULL = [
  'STT', 'Công ty', 'Tháng', 'Ngày PV', 'Chính sách', 'Mã nhân viên',
  'Họ tên', 'Số CCCD', 'STK', 'Ngân hàng',
  'Thưởng lần 1', 'Thưởng lần 2', 'Thưởng lần 3', 'Thưởng lần 4',
  'Thưởng lần 5', 'Thưởng lần 6', 'Thưởng lần 7', 'Tổng thưởng'
];

// File 11: Đầy đủ - Luxshare QC T01.2026 (Khớp CCCD với File 1)
function create_11_DS_THUONG_DayDu_Luxshare() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 15; i++) {
    const b1 = 500000;
    const b2 = 1000000;
    const b3 = 1000000;
    const total = b1 + b2 + b3;
    rows.push([
      i, 'Luxshare QC', 'T01.2026', '05/01/2026', 'Chính sách Tết 2026', `LX-01${pad0(i)}`,
      HO_TEN_LIST[i - 1], generateCCCD(i, '038'), generateSTK(i), BANKS[i % BANKS.length],
      b1, b2, b3, 0, 0, 0, 0, total
    ]);
  }
  saveWorkbook('11_DS_THUONG_DayDu_Luxshare_T01.xlsx', 'DS_THUONG', rows);
}

// File 12: Đầy đủ - Foxconn Đình Trám T02.2026 (Khớp CCCD với File 2)
function create_12_DS_THUONG_DayDu_Foxconn() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 15; i++) {
    const idx = i + 15;
    const b1 = 800000;
    const b2 = 1200000;
    const b3 = 1500000;
    const total = b1 + b2 + b3;
    rows.push([
      i, 'Foxconn', 'T02.2026', '10/02/2026', 'Chính sách Mùa Vụ Foxconn', `FX-02${pad0(i)}`,
      HO_TEN_LIST[(i + 3) % HO_TEN_LIST.length], generateCCCD(idx, '024'), generateSTK(idx), BANKS[(i + 1) % BANKS.length],
      b1, b2, b3, 0, 0, 0, 0, total
    ]);
  }
  saveWorkbook('12_DS_THUONG_DayDu_Foxconn_T02.xlsx', 'DS_THUONG', rows);
}

// File 13: Đầy đủ - Canon Quế Võ T03.2026 (Khớp CCCD với File 3)
function create_13_DS_THUONG_DayDu_Canon() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 12; i++) {
    const idx = i + 30;
    const b1 = 600000;
    const b2 = 800000;
    const total = b1 + b2;
    rows.push([
      i, 'Canon', 'T03.2026', '15/03/2026', 'Chính sách Canon 2026', `CN-03${pad0(i)}`,
      HO_TEN_LIST[(i + 5) % HO_TEN_LIST.length], generateCCCD(idx, '027'), generateSTK(idx), BANKS[(i + 2) % BANKS.length],
      b1, b2, 0, 0, 0, 0, 0, total
    ]);
  }
  saveWorkbook('13_DS_THUONG_DayDu_Canon_T03.xlsx', 'DS_THUONG', rows);
}

// File 14: Đầy đủ - Goertek Vina T04.2026 (Khớp CCCD với File 4)
function create_14_DS_THUONG_DayDu_Goertek() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 12; i++) {
    const idx = i + 45;
    const b1 = 500000;
    const b2 = 500000;
    const b3 = 500000;
    const b4 = 500000;
    const total = b1 + b2 + b3 + b4;
    rows.push([
      i, 'Goertek', 'T04.2026', '02/04/2026', 'Chính sách 4 Mốc Goertek', `GT-04${pad0(i)}`,
      HO_TEN_LIST[(i + 7) % HO_TEN_LIST.length], generateCCCD(idx, '030'), generateSTK(idx), BANKS[(i + 3) % BANKS.length],
      b1, b2, b3, b4, 0, 0, 0, total
    ]);
  }
  saveWorkbook('14_DS_THUONG_DayDu_Goertek_T04.xlsx', 'DS_THUONG', rows);
}

// File 15: Đầy đủ - Bảng thưởng tổng hợp các xưởng T05.2026 (Khớp CCCD File 5)
function create_15_DS_THUONG_DayDu_TongHop() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 14; i++) {
    const idx = i + 60;
    const factory = i <= 7 ? 'Fushan' : 'Amphenol';
    const b1 = 1000000;
    const b2 = 1500000;
    const total = b1 + b2;
    rows.push([
      i, factory, 'T05.2026', '12/05/2026', 'Chính sách Cao Điểm', `FA-05${pad0(i)}`,
      HO_TEN_LIST[(i + 9) % HO_TEN_LIST.length], generateCCCD(idx, '035'), generateSTK(idx), BANKS[(i + 4) % BANKS.length],
      b1, b2, 0, 0, 0, 0, 0, total
    ]);
  }
  saveWorkbook('15_DS_THUONG_DayDu_TongHop_T05.xlsx', 'DS_THUONG', rows);
}

// File 16: Không đầy đủ - Thiếu STK và Ngân hàng (Để test cảnh báo chưa có thông tin nhận tiền)
function create_16_DS_THUONG_Thieu_STK_NganHang() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const idx = i + 30; // Trùng công nhân Canon (File 3)
    const b1 = 500000;
    rows.push([
      i, 'Canon', 'T04.2026', '15/03/2026', 'Chính sách Thưởng Tháng 2', `CN-03${pad0(i)}`,
      HO_TEN_LIST[(i + 5) % HO_TEN_LIST.length], generateCCCD(idx, '027'),
      '', '', // STK và Ngân hàng để trống!
      b1, 0, 0, 0, 0, 0, 0, b1
    ]);
  }
  saveWorkbook('16_DS_THUONG_Thieu_STK_NganHang.xlsx', 'DS_THUONG', rows);
}

// File 17: Không đầy đủ - Chỉ chi trả mốc thưởng lần 1 và lần 2
function create_17_DS_THUONG_Thieu_ChiThuongDotDau() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const idx = i + 45; // Trùng công nhân Goertek (File 4)
    const b1 = 400000;
    const b2 = 600000;
    rows.push([
      i, 'Goertek', 'T05.2026', '02/04/2026', 'Chính sách Tạm Ứng Đợt 1-2', `GT-04${pad0(i)}`,
      HO_TEN_LIST[(i + 7) % HO_TEN_LIST.length], generateCCCD(idx, '030'), generateSTK(idx), 'Vietcombank',
      b1, b2, 0, 0, 0, 0, 0, b1 + b2
    ]);
  }
  saveWorkbook('17_DS_THUONG_Thieu_ChiThuongDotDau_Lan1_2.xlsx', 'DS_THUONG', rows);
}

// File 18: Không đầy đủ - Bị thiếu Mã nhân viên và tên Chính sách
function create_18_DS_THUONG_Thieu_MaNV_ChinhSach() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const b1 = 700000;
    rows.push([
      i, 'Luxshare QC', 'T02.2026', '05/01/2026',
      '', '', // Chính sách và Mã nhân viên để trống!
      HO_TEN_LIST[i - 1], generateCCCD(i, '038'), generateSTK(i), 'MB Bank',
      b1, 0, 0, 0, 0, 0, 0, b1
    ]);
  }
  saveWorkbook('18_DS_THUONG_Thieu_MaNV_ChinhSach.xlsx', 'DS_THUONG', rows);
}

// File 19: Lệch Ngày PV hoặc Lệch Công ty (Để test phát hiện sai lệch ở trang Đối Soát /import-review)
function create_19_DS_THUONG_CanhBao_LechNgayPV() {
  const rows = [DS_THUONG_HEADERS_FULL];
  for (let i = 1; i <= 10; i++) {
    const idx = i + 15; // Công nhân Foxconn ngày PV chuẩn là 10/02/2026
    const b1 = 500000;
    rows.push([
      i,
      i <= 5 ? 'Foxconn' : 'Công ty Khác (Lệch xưởng)', // Lệch tên xưởng
      'T03.2026',
      i <= 5 ? '25/02/2026' : '10/02/2026', // Lệch ngày PV (chuẩn là 10/02/2026)
      'Chính sách Thưởng Quý 1', `FX-02${pad0(i)}`,
      HO_TEN_LIST[(i + 3) % HO_TEN_LIST.length], generateCCCD(idx, '024'), generateSTK(idx), 'Techcombank',
      b1, 0, 0, 0, 0, 0, 0, b1
    ]);
  }
  saveWorkbook('19_DS_THUONG_CanhBao_LechNgayPV_CongTy.xlsx', 'DS_THUONG', rows);
}

// File 20: Test Trùng bản ghi thưởng (Bản thưởng đã có trong CSDL, hệ thống chặn không chi trùng 2 lần)
function create_20_DS_THUONG_Test_TrungLap() {
  const rows = [DS_THUONG_HEADERS_FULL];
  // Dùng lại đúng thông tin của File 11 (Luxshare QC, tháng T01.2026, ngày PV 05/01/2026)
  for (let i = 1; i <= 10; i++) {
    const b1 = 500000;
    const b2 = 1000000;
    const b3 = 1000000;
    rows.push([
      i, 'Luxshare QC', 'T01.2026', '05/01/2026', 'Chính sách Tết 2026', `LX-01${pad0(i)}`,
      HO_TEN_LIST[i - 1], generateCCCD(i, '038'), generateSTK(i), 'Vietcombank',
      b1, b2, b3, 0, 0, 0, 0, b1 + b2 + b3
    ]);
  }
  saveWorkbook('20_DS_THUONG_Test_TrungLap_DaTonTai.xlsx', 'DS_THUONG', rows);
}

// -------------------------------------------------------------
// CHẠY TẠO TẤT CẢ 20 FILE
// -------------------------------------------------------------
console.log('--- Đang tạo 10 mẫu DS_TONG ---');
create_01_DS_TONG_DayDu_Luxshare();
create_02_DS_TONG_DayDu_Foxconn();
create_03_DS_TONG_DayDu_Canon();
create_04_DS_TONG_DayDu_Goertek();
create_05_DS_TONG_DayDu_FushanAmphenol();
create_06_DS_TONG_Thieu_SoBoPhongVan();
create_07_DS_TONG_CapNhat_DienBoSung();
create_08_DS_TONG_Thieu_SDT_DiaChi();
create_09_DS_TONG_CanhBao_NghiViec_ThieuLyDo();
create_10_DS_TONG_Test_TrungLap();

console.log('\n--- Đang tạo 10 mẫu DS_THUONG ---');
create_11_DS_THUONG_DayDu_Luxshare();
create_12_DS_THUONG_DayDu_Foxconn();
create_13_DS_THUONG_DayDu_Canon();
create_14_DS_THUONG_DayDu_Goertek();
create_15_DS_THUONG_DayDu_TongHop();
create_16_DS_THUONG_Thieu_STK_NganHang();
create_17_DS_THUONG_Thieu_ChiThuongDotDau();
create_18_DS_THUONG_Thieu_MaNV_ChinhSach();
create_19_DS_THUONG_CanhBao_LechNgayPV();
create_20_DS_THUONG_Test_TrungLap();

console.log('\n✅ Đã tạo thành công toàn bộ 20 file mẫu chuẩn tại "D:\\Data mẫu"');
