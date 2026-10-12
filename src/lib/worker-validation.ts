export const STATUSES = ['Đang chờ phỏng vấn', 'Đạt phỏng vấn', 'Đang làm việc', 'Đã nghỉ việc'];
export const WORKER_FIELDS = ['code', 'fullName', 'dob', 'gender', 'idCardDate', 'idCardPlace', 'phone', 'address', 'province', 'recruiter', 'team', 'source'] as const;
export const ASSIGNMENT_FIELDS = ['interviewFactory', 'workingFactory', 'contractType', 'status', 'leaveDate', 'leaveReason', 'shuttleBusKtx', 'interviewDate', 'expectedTrainingDate', 'expectedTrainingStatus', 'standardTrainingDate', 'onboardingMonth', 'recruiter', 'source'] as const;
export function phoneKey(value: string) {
    const digits = value.replace(/[\s().-]/g, '');
    return digits.startsWith('+84') ? '0' + digits.slice(3) : digits;
}
export function cleanFields(body: any, fields: readonly string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const field of fields)
        if (body[field] !== undefined) {
            if(body[field]===null){result[field]='';continue;}
            if (typeof body[field] !== 'string' || body[field].length > 1000)
                throw new Error(`Trường ${field} không hợp lệ`);
            result[field] = body[field].trim();
        }
    if (result.phone)
        result.phone = phoneKey(result.phone);
    return result;
}
export function dateKey(value: string): string | null {
    if (!value)
        return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const vn = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!iso && !vn)
        return null;
    const y = Number(iso ? iso[1] : vn![3]), m = Number(iso ? iso[2] : vn![2]), d = Number(iso ? iso[3] : vn![1]);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (y < 1900 || y > 2100 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
        return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
export function validateWorker(worker: Record<string, any>, assignment: Record<string, any>, requireIdentity = true) {
    if (requireIdentity && (!worker.fullName || typeof worker.idCard !== 'string' || !/^(\d{9}|\d{12})$/.test(worker.idCard)))
        throw new Error('Họ tên và CCCD 12 số hoặc CMT cũ 9 số là bắt buộc');
    if (worker.phone && !/^0\d{9,10}$/.test(worker.phone))
        throw new Error('Số điện thoại không hợp lệ');
    if (!assignment.interviewFactory)
        throw new Error('Cần chọn nhà máy phỏng vấn');
    if (!STATUSES.includes(assignment.status))
        throw new Error('Tình trạng không hợp lệ');
    if (assignment.onboardingMonth && !/^T(0[1-9]|1[0-2])\.\d{4}$/.test(assignment.onboardingMonth))
        throw new Error('Kỳ nhận việc không hợp lệ');
    for (const field of ['dob', 'idCardDate'])
        if (worker[field] && !dateKey(worker[field]))
            throw new Error(`Ngày ${field} không hợp lệ (dd/mm/yyyy hoặc yyyy-mm-dd)`);
    for (const field of ['leaveDate', 'interviewDate', 'expectedTrainingDate', 'standardTrainingDate'])
        if (assignment[field] && !dateKey(assignment[field]))
            throw new Error(`Ngày ${field} không hợp lệ (dd/mm/yyyy hoặc yyyy-mm-dd)`);
    if (assignment.status === 'Đã nghỉ việc' && (!assignment.leaveDate || !assignment.leaveReason))
        throw new Error('Cần ngày nghỉ và lý do nghỉ việc');
    if (assignment.leaveDate && assignment.interviewDate && dateKey(assignment.leaveDate)! < dateKey(assignment.interviewDate)!)
        throw new Error('Ngày nghỉ không được trước ngày phỏng vấn');
}
