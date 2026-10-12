import * as XLSX from 'xlsx';
import { cleanFields, WORKER_FIELDS, ASSIGNMENT_FIELDS, validateWorker } from '@/lib/worker-validation';
const mappings: Record<string, string[]> = {
    fullName: ['Họ và tên', 'Họ tên'], idCard: ['số CCCD', 'Số CCCD', 'CCCD', 'CMT/CCCD'], phone: ['SĐT', 'Số điện thoại'], code: ['Mã NV'], dob: ['Ngày sinh'], gender: ['Giới tính'], idCardDate: ['Ngày cấp'], idCardPlace: ['Nơi cấp'], address: ['Địa chỉ'], province: ['Tỉnh/Thành'], team: ['Đội nhóm'], recruiter: ['Tuyển dụng', 'Tuyển Dụng'], source: ['Nguồn'], interviewFactory: ['Nhà máy PV', 'Công ty'], workingFactory: ['Nhà máy làm việc'], contractType: ['Loại HD'], status: ['Tình trạng', 'TT'], leaveDate: ['Ngày NH'], leaveReason: ['Lý do'], shuttleBusKtx: ['Đón xe - KTX'], interviewDate: ['Ngày PV'], expectedTrainingDate: ['Ngày Đào tạo dự kiến'], expectedTrainingStatus: ['Tình trạng Đào tạo dự kiến'], standardTrainingDate: ['Ngày đào tạo chuẩn'], onboardingMonth: ['Tháng nhận việc', 'Tháng']
};
const dates = ['dob', 'idCardDate', 'leaveDate', 'interviewDate', 'expectedTrainingDate', 'standardTrainingDate'];
export function parseImportRow(raw: Record<string, unknown>) {
    const row = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim(), v]));
    const body: Record<string, string> = {};
    for (const [field, headers] of Object.entries(mappings)) {
        let v = headers.map(h => row[h]).find(v => v !== undefined && v !== null && v !== '');
        if (v === undefined)
            continue;
        if (['idCard', 'phone'].includes(field) && typeof v === 'number')
            throw new Error(`${field === 'idCard' ? 'CCCD' : 'SĐT'} phải lưu dạng Text để bảo toàn số 0 đầu; không tự khôi phục số thiếu`);
        if (dates.includes(field) && typeof v === 'number') {
            const d = XLSX.SSF.parse_date_code(v);
            if (!d)
                throw new Error(`Ngày ${field} không hợp lệ`);
            v = `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`;
        }
        body[field] = String(v).trim();
    }
    const worker = cleanFields(body, WORKER_FIELDS);
    worker.idCard = body.idCard || '';
    const assignment = cleanFields(body, ASSIGNMENT_FIELDS);
    assignment.status ||= 'Đang chờ phỏng vấn';
    validateWorker(worker, assignment);
    if (assignment.status !== 'Đã nghỉ việc') {
        assignment.leaveDate = '';
        assignment.leaveReason = '';
    }
    return { worker, assignment };
}
