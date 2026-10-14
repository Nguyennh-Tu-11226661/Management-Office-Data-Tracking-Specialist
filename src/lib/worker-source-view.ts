import { sourceHeader } from "@/lib/source-format";
export const workerSourceColumns = [
  "STT",
  "Nhà máy PV",
  "Nhà máy làm việc",
  "Loại HĐ",
  "Tình trạng",
  "Ngày NH",
  "Lý do",
  "Mã NV",
  "Họ và tên",
  "Ngày sinh",
  "Giới tính",
  "Số CCCD",
  "Ngày cấp",
  "Địa chỉ",
  "SĐT",
  "Tuyển dụng",
  "Đón xe + KTX",
  "Ngày PV",
  "Ngày Đào tạo dự kiến",
  "Tình trạng đào tạo",
  "Ngày đào tạo chuẩn",
  "Tháng nhận việc",
];
const fields: Record<string, string> = {
  "Nhà máy PV": "interviewFactory",
  "Nhà máy làm việc": "workingFactory",
  "Loại HĐ": "contractType",
  "Tình trạng": "status",
  "Ngày NH": "leaveDate",
  "Lý do": "leaveReason",
  "Mã NV": "employeeCode",
  "Họ và tên": "fullName",
  "Ngày sinh": "dob",
  "Giới tính": "gender",
  "Số CCCD": "idCard",
  "Ngày cấp": "idCardDate",
  "Địa chỉ": "address",
  SĐT: "phone",
  "Tuyển dụng": "recruiter",
  "Đón xe + KTX": "shuttleBusKtx",
  "Ngày PV": "interviewDate",
  "Ngày Đào tạo dự kiến": "expectedTrainingDate",
  "Tình trạng đào tạo": "expectedTrainingStatus",
  "Ngày đào tạo chuẩn": "standardTrainingDate",
  "Tháng nhận việc": "onboardingMonth",
};
export function workerSourceView(worker: any, assignment: any) {
  const result: Record<string, unknown> = {};
  for (const [name, key] of Object.entries(fields))
    result[name] = assignment[key] ?? worker[key] ?? "";
  let warnings: string[] = [];
  let hasSource = false;
  for (const event of assignment.events || []) {
    if (!event.note?.startsWith("Import Excel — source:")) continue;
    try {
      const snapshot = JSON.parse(
        event.note.slice("Import Excel — source:".length),
      );
      for (const [k, v] of Object.entries(snapshot.values || {}))
        result[sourceHeader(k)] = v;
      warnings = snapshot.warnings || [];
      hasSource = true;
      break;
    } catch {}
  }
  return { values: result, warnings, hasSource };
}
