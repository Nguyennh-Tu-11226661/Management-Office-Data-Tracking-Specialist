export function validMonth(value: unknown): value is string {
  return typeof value === "string" && /^T(0[1-9]|1[0-2])\.\d{4}$/.test(value);
}
export function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
export function canTransition(from: string, to: string): boolean {
  return (
    ((from === "DRAFT" || from === "REVIEWED") && to === "APPROVED") ||
    (from === "APPROVED" && to === "LOCKED")
  );
}
// No trusted bank verification provider is connected. Legacy flags are not evidence.
export function paymentIssue(record: {
  status: string;
  totalBonus: number | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  worker: {
    bankAccounts: unknown[];
  };
}): string | null {
  if (!["APPROVED", "LOCKED"].includes(record.status))
    return "Thưởng chưa được duyệt";
  if (!record.approvedBy?.trim() || !record.approvedAt)
    return "Thiếu thông tin phê duyệt";
  if (!validAmount(record.totalBonus) || record.totalBonus === 0)
    return "Số tiền không hợp lệ";
  if (!record.worker.bankAccounts.length) return "Chưa có tài khoản nhận";
  if (record.worker.bankAccounts.length > 1)
    return "Chưa xác định tài khoản nhận giữa nhiều tài khoản";
  return "Chưa có bằng chứng xác minh ngân hàng và ủy quyền nhận thay (nếu có)";
}
