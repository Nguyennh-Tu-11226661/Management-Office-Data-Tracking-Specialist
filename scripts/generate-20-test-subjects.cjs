const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const OUTPUT_DIR = 'D:\\Data mẫu';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 20 Đối tượng thử nghiệm chuẩn
const SUBJECTS = [
  // Nhóm 1: 5 đối tượng chuẩn đầy đủ (DT01 -> DT05)
  {
    stt: 1, id: 'DT01', name: 'Nguyễn Văn An', cccd: '038096000001', phone: '0987654321',
    factory: 'Luxshare QC', date: '05/01/2026', code: 'LX-001', team: 'Team A1 (Ép nhựa)',
    status: 'Đang làm việc', dob: '15/05/2000', gender: 'Nam', province: 'Bắc Ninh',
    stk: '1022334455', bank: 'Vietcombank', recruiter: 'Đỗ Tuấn Anh',
    bonus1: 500000, bonus2: 1000000, bonus3: 1500000, note: 'Chuẩn 100% đầy đủ mọi trường'
  },
  {
    stt: 2, id: 'DT02', name: 'Trần Thị Bích', cccd: '024197000002', phone: '0981112233',
    factory: 'Foxconn', date: '10/02/2026', code: 'FX-002', team: 'Team B2 (Lắp ráp)',
    status: 'Đang làm việc', dob: '20/08/1997', gender: 'Nữ', province: 'Bắc Giang',
    stk: '1033445566', bank: 'MB Bank', recruiter: 'Lê Thanh Mai',
    bonus1: 800000, bonus2: 1200000, bonus3: 0, note: 'Chuẩn 100% đầy đủ mọi trường'
  },
  {
    stt: 3, id: 'DT03', name: 'Lê Hoàng Nam', cccd: '027098000003', phone: '0972223344',
    factory: 'Canon', date: '15/03/2026', code: 'CN-003', team: 'Team SMT (Điện tử)',
    status: 'Đang làm việc', dob: '10/11/1998', gender: 'Nam', province: 'Thái Nguyên',
    stk: '1044556677', bank: 'Techcombank', recruiter: 'Nguyễn Thu Trang',
    bonus1: 600000, bonus2: 900000, bonus3: 0, note: 'Chuẩn 100% hợp đồng chính thức'
  },
  {
    stt: 4, id: 'DT04', name: 'Phạm Minh Tuấn', cccd: '030099000004', phone: '0963334455',
    factory: 'Goertek', date: '02/04/2026', code: 'GT-004', team: 'Team QC (Kiểm hàng)',
    status: 'Đang làm việc', dob: '25/03/1999', gender: 'Nam', province: 'Hà Nội',
    stk: '1055667788', bank: 'BIDV', recruiter: 'Hoàng Văn Hưng',
    bonus1: 500000, bonus2: 500000, bonus3: 500000, note: 'Chuẩn 100% Goertek 4 mốc'
  },
  {
    stt: 5, id: 'DT05', name: 'Vũ Thị Lan', cccd: '035100000005', phone: '0914445566',
    factory: 'Fushan', date: '12/05/2026', code: 'FS-005', team: 'Team Kho vận',
    status: 'Đang làm việc', dob: '08/12/2001', gender: 'Nữ', province: 'Hải Dương',
    stk: '1066778899', bank: 'VPBank', recruiter: 'Trần Văn Nam',
    bonus1: 1000000, bonus2: 1500000, bonus3: 0, note: 'Chuẩn 100% Fushan Technology'
  },

  // Nhóm 2: 5 đối tượng test tính năng Smart Merge điền bù thông tin (DT06 -> DT10)
  {
    stt: 6, id: 'DT06', name: 'Đỗ Tuấn Anh', cccd: '001099000006', phone: '0977889901',
    factory: 'Luxshare QC', date: '20/06/2026', code: 'LX-SM-006', team: 'Team Ép nhựa',
    status: 'Đang làm việc', dob: '12/04/1996', gender: 'Nam', province: 'Phú Thọ',
    stk: '1077889901', bank: 'Vietcombank', recruiter: 'Đỗ Tuấn Anh',
    bonus1: 500000, bonus2: 1000000, bonus3: 0,
    note: 'Đợt 1 thiếu SĐT & Mã NV -> Đợt 2 Smart Merge tự động điền bù'
  },
  {
    stt: 7, id: 'DT07', name: 'Bùi Thị Hằng', cccd: '001099000007', phone: '0977889902',
    factory: 'Luxshare QC', date: '20/06/2026', code: 'LX-SM-007', team: 'Team Đóng gói',
    status: 'Đang làm việc', dob: '18/09/2000', gender: 'Nữ', province: 'Nam Định',
    stk: '1077889902', bank: 'MB Bank', recruiter: 'Lê Thanh Mai',
    bonus1: 500000, bonus2: 1000000, bonus3: 0,
    note: 'Đợt 1 Đang chờ PV -> Đợt 2 bổ sung Ngày bắt đầu làm & Team'
  },
  {
    stt: 8, id: 'DT08', name: 'Hoàng Văn Hưng', cccd: '001099000008', phone: '0977889903',
    factory: 'Canon', date: '20/06/2026', code: 'CN-SM-008', team: 'Team SMT',
    status: 'Đang làm việc', dob: '05/06/1995', gender: 'Nam', province: 'Ninh Bình',
    stk: '1077889903', bank: 'Techcombank', recruiter: 'Nguyễn Thu Trang',
    bonus1: 600000, bonus2: 800000, bonus3: 0,
    note: 'Đợt 1 chưa có STK -> Đợt 2 Smart Merge tự liên kết STK vào hồ sơ'
  },
  {
    stt: 9, id: 'DT09', name: 'Ngô Thu Trang', cccd: '001099000009', phone: '0977889904',
    factory: 'Foxconn', date: '20/06/2026', code: 'FX-SM-009', team: 'Team Lắp ráp',
    status: 'Đang làm việc', dob: '22/10/2002', gender: 'Nữ', province: 'Thanh Hóa',
    stk: '1077889904', bank: 'BIDV', recruiter: 'Hoàng Văn Hưng',
    bonus1: 800000, bonus2: 1200000, bonus3: 0,
    note: 'Đợt 1 để trống Quê quán & Ngày cấp -> Đợt 2 Smart Merge điền bù'
  },
  {
    stt: 10, id: 'DT10', name: 'Đặng Quốc Bảo', cccd: '001099000010', phone: '0977889905',
    factory: 'Goertek', date: '20/06/2026', code: 'GT-SM-010', team: 'Team QC',
    status: 'Đang làm việc', dob: '30/01/1998', gender: 'Nam', province: 'Nghệ An',
    stk: '1077889905', bank: 'Vietcombank', recruiter: 'Trần Văn Nam',
    bonus1: 500000, bonus2: 500000, bonus3: 500000,
    note: 'Đợt 1 phỏng vấn sơ bộ (thiếu nhiều trường) -> Đợt 2 hoàn thiện 100%'
  },

  // Nhóm 3: 5 đối tượng test Thiếu thông tin & Cảnh báo nghiệp vụ (DT11 -> DT15)
  {
    stt: 11, id: 'DT11', name: 'Dương Thị Mai', cccd: '001099000011', phone: '', // Thiếu SĐT
    factory: 'Canon', date: '05/07/2026', code: 'CN-011', team: 'Team SMT',
    status: 'Đang làm việc', dob: '14/02/2001', gender: 'Nữ', province: 'Bắc Ninh',
    stk: '1088990011', bank: 'MB Bank', recruiter: 'Đỗ Tuấn Anh',
    bonus1: 500000, bonus2: 500000, bonus3: 0,
    note: 'Cảnh báo thiếu SĐT (hệ thống vẫn giữ dòng nguồn)'
  },
  {
    stt: 12, id: 'DT12', name: 'Lý Văn Cường', cccd: '001099000012', phone: '0983344551',
    factory: 'Goertek', date: '01/08/2026', code: 'GT-012', team: 'Team Kho vận',
    status: 'Đã nghỉ việc', leaveDate: '', leaveReason: '', // Thiếu ngày nghỉ & lý do
    dob: '19/07/1994', gender: 'Nam', province: 'Thái Nguyên',
    stk: '1088990012', bank: 'Vietcombank', recruiter: 'Lê Thanh Mai',
    bonus1: 400000, bonus2: 0, bonus3: 0,
    note: 'Cảnh báo Đã nghỉ việc nhưng thiếu Ngày nghỉ & Lý do'
  },
  {
    stt: 13, id: 'DT13', name: 'Mai Thị Kim', cccd: '001099000013', phone: '0983344552',
    factory: 'Canon', date: '15/08/2026', code: 'CN-013', team: 'Team Ép nhựa',
    status: 'Đang làm việc', dob: '28/05/2000', gender: 'Nữ', province: 'Bắc Giang',
    stk: '1088990013', bank: 'Techcombank', recruiter: 'Nguyễn Thu Trang',
    bonus1: 600000, bonus2: 0, bonus3: 0,
    note: 'Cảnh báo [CHƯA BÁO NGHỈ] nếu đang có đợt làm việc xưởng cũ'
  },
  {
    stt: 14, id: 'DT14', name: 'Phan Thanh Hải', cccd: '001099000014', phone: '0987654321', // Trùng SĐT với DT01!
    factory: 'Foxconn', date: '20/08/2026', code: 'FX-014', team: 'Team Lắp ráp',
    status: 'Đang làm việc', dob: '03/09/1997', gender: 'Nam', province: 'Hà Nội',
    stk: '1088990014', bank: 'Agribank', recruiter: 'Hoàng Văn Hưng',
    bonus1: 800000, bonus2: 0, bonus3: 0,
    note: 'Cảnh báo [CHÚ Ý SĐT] trùng số điện thoại với công nhân DT01'
  },
  {
    stt: 15, id: 'DT15', name: 'Trịnh Văn Long', cccd: '001099000015', phone: '0983344553',
    factory: 'Luxshare QC', date: '25/08/2026', code: 'LX-015', team: 'Team QC',
    status: 'lv', // Mã viết tắt
    dob: '11/12/1999', gender: 'Nam', province: 'Hải Dương',
    stk: '1088990015', bank: 'VPBank', recruiter: 'Trần Văn Nam',
    bonus1: 500000, bonus2: 0, bonus3: 0,
    note: 'Mã tình trạng nguồn viết tắt (hệ thống bảo lưu mã gốc)'
  },

  // Nhóm 4: 5 đối tượng test Trùng lặp & Kiểm soát tài chính Thưởng (DT16 -> DT20)
  {
    stt: 16, id: 'DT16', name: 'Lương Thị Thảo', cccd: '001099000016', phone: '0984455661',
    factory: 'Foxconn', date: '10/09/2026', code: 'FX-016', team: 'Team SMT',
    status: 'Đang làm việc', dob: '16/04/2002', gender: 'Nữ', province: 'Nam Định',
    stk: '1099001122', bank: 'Vietcombank', recruiter: 'Đỗ Tuấn Anh',
    bonus1: 800000, bonus2: 1200000, bonus3: 0,
    note: 'Kiểm thử trùng lặp nội bộ (xuất hiện lặp lại trong file nạp)'
  },
  {
    stt: 17, id: 'DT17', name: 'Hà Văn Dũng', cccd: '001099000017', phone: '0984455662',
    factory: 'Goertek', date: '15/09/2026', code: 'GT-017', team: 'Team Lắp ráp',
    status: 'Đang làm việc', dob: '21/08/1995', gender: 'Nam', province: 'Thanh Hóa',
    stk: '1099001123', bank: 'MB Bank', recruiter: 'Lê Thanh Mai',
    bonus1: 500000, bonus2: 500000, bonus3: 0,
    note: 'Kiểm thử cảnh báo Sai lệch danh tính nếu cùng CCCD nhưng khác tên'
  },
  {
    stt: 18, id: 'DT18', name: 'Tạ Thị Huệ', cccd: '001099000018', phone: '0984455663',
    factory: 'Luxshare QC', date: '01/10/2026', code: 'LX-018', team: 'Team Ép nhựa',
    status: 'Đang làm việc', dob: '09/03/2001', gender: 'Nữ', province: 'Phú Thọ',
    stk: '1099001124', bank: 'Techcombank', recruiter: 'Nguyễn Thu Trang',
    bonus1: 500000, bonus2: 1000000, bonus3: 1000000, bonus4: 1000000, bonus5: 1000000,
    note: 'Kiểm thử Bảng thưởng đầy đủ nhiều đợt chi trả (5 mốc thưởng)'
  },
  {
    stt: 19, id: 'DT19', name: 'Hồ Đức Thắng', cccd: '001099000019', phone: '0984455664',
    factory: 'Canon', date: '05/10/2026', code: 'CN-019', team: 'Team SMT',
    status: 'Đang làm việc', dob: '17/01/1996', gender: 'Nam', province: 'Hà Nội',
    stk: '', bank: '', // Thiếu STK trong bảng thưởng
    bonus1: 1500000, bonus2: 1500000, bonus3: 0,
    note: 'Kiểm thử Bảng thưởng có tiền nhưng thiếu STK -> Chặn lệnh chi'
  },
  {
    stt: 20, id: 'DT20', name: 'Võ Thị Yến', cccd: '001099000020', phone: '0984455665',
    factory: 'Goertek', date: '10/10/2026', code: 'GT-020', team: 'Team QC',
    status: 'Đang làm việc', dob: '24/06/2003', gender: 'Nữ', province: 'Bắc Ninh',
    stk: '1099001126', bank: 'BIDV', recruiter: 'Trần Văn Nam',
    bonus1: 600000, bonus2: 900000, bonus3: 0,
    note: 'Kiểm thử Bảng thưởng lệch ngày PV hoặc lệch công ty với DS_TONG'
  }
];

const DS_TONG_HEADERS = [
  'STT', 'Nhà máy PV', 'Nhà máy làm việc', 'Loại HD', 'Tình trạng',
  'Ngày NH', 'Lý do', 'Mã NV', 'Họ và tên', 'Ngày sinh',
  'Giới tính', 'số CCCD', 'Ngày cấp', 'Địa chỉ', 'SĐT',
  'Tuyển dụng', 'Đón xe - KTX', 'Ngày PV', 'Ngày Đào tạo dự kiến',
  'Tình trạng Đào tạo dự kiến', 'Ngày đào tạo chuẩn', 'Tháng nhận việc', 'Nguồn',
  'STK', 'Ngân hàng'
];

const DS_THUONG_HEADERS = [
  'STT', 'Công ty', 'Tháng', 'Ngày PV', 'Chính sách', 'Mã nhân viên',
  'Họ tên', 'Số CCCD', 'STK', 'Ngân hàng',
  'Thưởng lần 1', 'Thưởng lần 2', 'Thưởng lần 3', 'Thưởng lần 4',
  'Thưởng lần 5', 'Thưởng lần 6', 'Thưởng lần 7', 'Tổng thưởng'
];

function saveXlsx(filename, sheetName, rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = [];
  rows.forEach(r => {
    r.forEach((cell, idx) => {
      const len = cell ? String(cell).length : 5;
      colWidths[idx] = Math.max(colWidths[idx] || 10, len + 3);
    });
  });
  ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 35) }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, path.join(OUTPUT_DIR, filename));
  console.log(`✓ Đã tạo file: ${filename}`);
}

// -----------------------------------------------------------------------------
// FILE 1: 01_DS_TONG_20_Doi_Tuong_Dot1_SoBo_ThieuThongTin.xlsx
// Chứa 20 đối tượng ở trạng thái Đợt 1 (Đối tượng 6->10 thiếu thông tin để chuẩn bị test Smart Merge)
// -----------------------------------------------------------------------------
function makeFile1() {
  const rows = [DS_TONG_HEADERS];
  SUBJECTS.forEach((s, idx) => {
    const isSmartMergeCandidate = s.stt >= 6 && s.stt <= 10;
    const isNoPhone = s.stt === 11;
    const isLeavedWithoutReason = s.stt === 12;

    rows.push([
      s.stt,
      s.factory,
      isSmartMergeCandidate ? '' : s.factory,
      'Thời vụ',
      isSmartMergeCandidate ? 'Đang chờ phỏng vấn' : (isLeavedWithoutReason ? 'Đã nghỉ việc' : s.status),
      isLeavedWithoutReason ? '15/08/2026' : '',
      '', // Thiếu lý do nếu là DT12
      isSmartMergeCandidate ? '' : s.code, // DT6->10 chưa có mã NV
      s.name,
      isSmartMergeCandidate ? '' : s.dob,
      s.gender,
      s.cccd,
      isSmartMergeCandidate ? '' : '15/05/2021',
      isSmartMergeCandidate ? '' : s.province,
      (isSmartMergeCandidate || isNoPhone) ? '' : s.phone, // DT6->10 và DT11 chưa có SĐT
      s.recruiter,
      'Có xe đón',
      s.date,
      '07/01/2026',
      'Đã đào tạo',
      '08/01/2026',
      'T01.2026',
      'Tuyển dụng trực tiếp',
      isSmartMergeCandidate ? '' : s.stk, // DT6->10 chưa có STK
      isSmartMergeCandidate ? '' : s.bank
    ]);
  });
  saveXlsx('01_DS_TONG_20_Doi_Tuong_Dot1_SoBo_ThieuThongTin.xlsx', 'DS_TONG', rows);
}

// -----------------------------------------------------------------------------
// FILE 2: 02_DS_TONG_20_Doi_Tuong_Dot2_CapNhat_SmartMerge.xlsx
// Nạp file này sau File 1 để xem Smart Merge điền bù thông tin cho DT06 -> DT10
// -----------------------------------------------------------------------------
function makeFile2() {
  const rows = [DS_TONG_HEADERS];
  SUBJECTS.forEach((s) => {
    // File này có đầy đủ thông tin của tất cả đối tượng (bao gồm các trường đợt 1 còn thiếu)
    rows.push([
      s.stt,
      s.factory,
      s.factory,
      'Thời vụ',
      s.status,
      s.leaveDate || '',
      s.leaveReason || '',
      s.code,
      s.name,
      s.dob,
      s.gender,
      s.cccd,
      '15/05/2021',
      s.province,
      s.phone || '0988776655',
      s.recruiter,
      'Có xe đón',
      s.date,
      '07/01/2026',
      'Đã đào tạo',
      '08/01/2026',
      'T01.2026',
      'Tuyển dụng trực tiếp',
      s.stk || '1099887766',
      s.bank || 'Vietcombank'
    ]);
  });
  saveXlsx('02_DS_TONG_20_Doi_Tuong_Dot2_CapNhat_SmartMerge.xlsx', 'DS_TONG', rows);
}

// -----------------------------------------------------------------------------
// FILE 3: 03_DS_TONG_20_Doi_Tuong_Chuan_DayDu_100%.xlsx
// Bản chuẩn 100% hoàn hảo của 20 đối tượng
// -----------------------------------------------------------------------------
function makeFile3() {
  const rows = [DS_TONG_HEADERS];
  SUBJECTS.forEach((s) => {
    rows.push([
      s.stt,
      s.factory,
      s.factory,
      'Thời vụ',
      s.status === 'lv' ? 'Đang làm việc' : s.status,
      s.leaveDate || (s.status === 'Đã nghỉ việc' ? '15/08/2026' : ''),
      s.leaveReason || (s.status === 'Đã nghỉ việc' ? 'Hết hạn hợp đồng' : ''),
      s.code,
      s.name,
      s.dob,
      s.gender,
      s.cccd,
      '15/05/2021',
      s.province,
      s.phone || '0981234567',
      s.recruiter,
      'Có xe đón',
      s.date,
      '07/01/2026',
      'Đã đào tạo',
      '08/01/2026',
      'T01.2026',
      'Tuyển dụng trực tiếp',
      s.stk || '1011223344',
      s.bank || 'Vietcombank'
    ]);
  });
  saveXlsx('03_DS_TONG_20_Doi_Tuong_Chuan_DayDu_100%.xlsx', 'DS_TONG', rows);
}

// -----------------------------------------------------------------------------
// FILE 4: 04_DS_THUONG_20_Doi_Tuong_Theo_Doi.xlsx
// Bảng thưởng tương ứng cho 20 đối tượng (kèm kịch bản test thiếu STK, lệch ngày PV)
// -----------------------------------------------------------------------------
function makeFile4() {
  const rows = [DS_THUONG_HEADERS];
  SUBJECTS.forEach((s) => {
    const isLechNgayPV = s.stt === 20; // DT20 ghi lệch ngày PV
    const isThieuSTK = s.stt === 19;   // DT19 thiếu STK
    const b1 = s.bonus1 || 500000;
    const b2 = s.bonus2 || 0;
    const b3 = s.bonus3 || 0;
    const b4 = s.bonus4 || 0;
    const b5 = s.bonus5 || 0;
    const total = b1 + b2 + b3 + b4 + b5;

    rows.push([
      s.stt,
      s.factory,
      'T01.2026',
      isLechNgayPV ? '25/12/2026' : s.date, // DT20 ghi lệch ngày
      'Chính sách Thưởng Mùa Vụ 2026',
      s.code,
      s.name,
      s.cccd,
      isThieuSTK ? '' : (s.stk || '1022334455'),
      isThieuSTK ? '' : (s.bank || 'Vietcombank'),
      b1, b2, b3, b4, b5, 0, 0, total
    ]);
  });
  saveXlsx('04_DS_THUONG_20_Doi_Tuong_Theo_Doi.xlsx', 'DS_THUONG', rows);
}

// -----------------------------------------------------------------------------
// FILE 5: 05_DS_THUONG_20_Doi_Tuong_Chuan_100%.xlsx
// Bảng thưởng chuẩn 100% đầy đủ tiền và STK cho cả 20 đối tượng
// -----------------------------------------------------------------------------
function makeFile5() {
  const rows = [DS_THUONG_HEADERS];
  SUBJECTS.forEach((s) => {
    const b1 = s.bonus1 || 500000;
    const b2 = s.bonus2 || 1000000;
    const b3 = s.bonus3 || 500000;
    const total = b1 + b2 + b3;
    rows.push([
      s.stt,
      s.factory,
      'T01.2026',
      s.date,
      'Chính sách Thưởng Chuẩn 2026',
      s.code,
      s.name,
      s.cccd,
      s.stk || `109900${pad0(s.stt, 4)}`,
      s.bank || 'Vietcombank',
      b1, b2, b3, 0, 0, 0, 0, total
    ]);
  });
  saveXlsx('05_DS_THUONG_20_Doi_Tuong_Chuan_100%.xlsx', 'DS_THUONG', rows);
}

// -----------------------------------------------------------------------------
// FILE 6: HUONG_DAN_CHI_TIET_20_DOI_TUONG_TEST.xlsx
// Bản giải thích chi tiết mục đích và kịch bản test cho từng đối tượng
// -----------------------------------------------------------------------------
function makeGuideFile() {
  const headers = ['STT', 'Mã ĐT', 'Họ và tên', 'Số CCCD', 'Nhà máy', 'Nhóm Test', 'Mô tả kịch bản test', 'Kết quả mong đợi'];
  const rows = [headers];

  SUBJECTS.forEach(s => {
    let group = 'Chuẩn đầy đủ';
    let expected = 'Nạp thành công vào CSDL, đầy đủ hồ sơ và tài chính.';

    if (s.stt >= 6 && s.stt <= 10) {
      group = 'Test Smart Merge';
      expected = 'Đợt 1 nạp sơ bộ. Đợt 2 hệ thống tự động điền bù thông tin còn thiếu vào hồ sơ cũ, không nhân đôi hồ sơ.';
    } else if (s.stt === 11) {
      group = 'Thiếu thông tin';
      expected = 'Vẫn nạp dòng nguồn, hiện cảnh báo thiếu SĐT để nhân sự kiểm tra.';
    } else if (s.stt === 12) {
      group = 'Cảnh báo nghiệp vụ';
      expected = 'Hiện cảnh báo: Đã nghỉ việc nhưng cần Ngày nghỉ và Lý do nghỉ.';
    } else if (s.stt === 13) {
      group = 'Cảnh báo Chưa báo nghỉ';
      expected = 'Hiện cảnh báo [CHƯA BÁO NGHỈ] nếu công nhân đang có đợt làm việc xưởng khác.';
    } else if (s.stt === 14) {
      group = 'Cảnh báo Trùng SĐT';
      expected = 'Hiện cảnh báo [CHÚ Ý SĐT] do trùng SĐT với công nhân DT01.';
    } else if (s.stt === 15) {
      group = 'Mã viết tắt';
      expected = 'Hệ thống bảo lưu nguyên vẹn mã nguồn "lv", không làm mất dữ liệu.';
    } else if (s.stt === 16) {
      group = 'Trùng lặp';
      expected = 'Phát hiện trùng lặp nội bộ trong file, chặn không tạo đợt tuyển kép.';
    } else if (s.stt === 17) {
      group = 'Sai lệch danh tính';
      expected = 'Cảnh báo nếu cùng CCCD nhưng khác họ tên trong hệ thống.';
    } else if (s.stt === 18) {
      group = 'Thưởng đầy đủ';
      expected = 'Bảng thưởng nạp thành công, ghi nhận đủ các mốc thưởng.';
    } else if (s.stt === 19) {
      group = 'Thưởng thiếu STK';
      expected = 'Lưu bản thưởng nhưng cảnh báo chặn lệnh chi tài chính do thiếu STK.';
    } else if (s.stt === 20) {
      group = 'Lệch ngày PV';
      expected = 'Màn hình Đối soát (/import-review) phát hiện ngày PV file Thưởng lệch với DS_TONG.';
    }

    rows.push([s.stt, s.id, s.name, s.cccd, s.factory, group, s.note, expected]);
  });

  saveXlsx('HUONG_DAN_CHI_TIET_20_DOI_TUONG_TEST.xlsx', 'Kich_Ban_Test', rows);
}

function pad0(num, len = 2) {
  return String(num).padStart(len, '0');
}

console.log('--- Đang tạo bộ dữ liệu 20 đối tượng test tính năng tại D:\\Data mẫu ---');
makeFile1();
makeFile2();
makeFile3();
makeFile4();
makeFile5();
makeGuideFile();

console.log('\n✅ Đã tạo hoàn tất trọn bộ test 20 đối tượng tại "D:\\Data mẫu"!');
