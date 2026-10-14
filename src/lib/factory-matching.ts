/**
 * Module chuẩn hóa và đối soát thông minh tên Nhà máy / Công ty
 */

export function cleanFactory(s?: string | null): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/nhà máy|công ty|tnhh|vina|kcn|khkt|tập đoàn/g, "")
    .trim();
}

export function matchFactory(f1?: string | null, f2?: string | null): boolean {
  if (!f1 || !f2) return false;
  const s1 = f1.trim().toLowerCase();
  const s2 = f2.trim().toLowerCase();
  if (s1 === s2) return true;
  const c1 = cleanFactory(s1);
  const c2 = cleanFactory(s2);
  if (c1 && c2 && (c1 === c2 || c1.includes(c2) || c2.includes(c1)))
    return true;
  return false;
}
