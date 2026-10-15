const DATE_ONLY_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DATE_ONLY_VN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
export const DATE_DISPLAY_FORMAT = "DD/MM/YYYY";

function dateParts(value: string) {
  const iso = DATE_ONLY_ISO.exec(value);
  const vietnamese = DATE_ONLY_VN.exec(value);
  const parts = iso
    ? [iso[3], iso[2], iso[1]]
    : vietnamese
      ? [vietnamese[1], vietnamese[2], vietnamese[3]]
      : null;
  if (!parts) return null;

  const [day, month, year] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? parts
    : null;
}

function formatInVietnam(value: Date, includeTime: boolean) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
      : {}),
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  const date = `${get("day")}/${get("month")}/${get("year")}`;
  return includeTime ? `${date} ${get("hour")}:${get("minute")}` : date;
}

export function formatDate(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "—" : formatInVietnam(value, false);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1 || value > 2958465)
      return String(value);
    const serialDate = new Date(
      Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000,
    );
    return formatInVietnam(serialDate, false);
  }

  const text = String(value).trim();
  const parts = dateParts(text);
  if (parts)
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
  if (DATE_ONLY_ISO.test(text) || DATE_ONLY_VN.test(text)) return text;

  const timestamp = new Date(text);
  return Number.isNaN(timestamp.getTime())
    ? text
    : formatInVietnam(timestamp, false);
}

export function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "—" : formatInVietnam(value, true);
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 1 || value > 2958465)
      return String(value);
    const serialDate = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    return formatInVietnam(serialDate, true);
  }

  const text = String(value).trim();
  if (dateParts(text)) return formatDate(text);
  if (DATE_ONLY_ISO.test(text) || DATE_ONLY_VN.test(text)) return text;
  const timestamp = new Date(text);
  return Number.isNaN(timestamp.getTime())
    ? text
    : formatInVietnam(timestamp, true);
}
