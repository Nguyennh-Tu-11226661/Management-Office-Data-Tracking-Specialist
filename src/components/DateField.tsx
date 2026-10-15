"use client";

import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { DATE_DISPLAY_FORMAT, formatDate } from "@/lib/date-format";

type DateFieldProps = {
  value?: unknown;
  onChange?: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
};

function pickerValue(value: unknown): Dayjs | null {
  if (value == null || value === "") return null;
  const formatted = formatDate(value);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const validDate = new Date(Date.UTC(year, month - 1, day));
  if (
    validDate.getUTCFullYear() !== year ||
    validDate.getUTCMonth() !== month - 1 ||
    validDate.getUTCDate() !== day
  )
    return null;

  return dayjs(new Date(year, month - 1, day));
}

export default function DateField({
  value,
  onChange,
  id,
  placeholder = DATE_DISPLAY_FORMAT,
  className = "w-full",
}: DateFieldProps) {
  return (
    <DatePicker
      id={id}
      value={pickerValue(value)}
      format={DATE_DISPLAY_FORMAT}
      placeholder={placeholder}
      className={className}
      onChange={(date) => onChange?.(date?.format("YYYY-MM-DD") || "")}
    />
  );
}