"use client";
import { Card, Empty, Tabs, Select, Statistic } from "antd";

import { useState } from "react";

type Series = { key: string; label: string; color: string };
const recruitment: Series[] = [
  { key: "total", label: "Lượt tuyển", color: "#2563eb" },
  { key: "passed", label: "Đỗ phỏng vấn", color: "#15803d" },
  { key: "failed", label: "Trượt phỏng vấn", color: "#b91c1c" },
  { key: "abandoned", label: "Bỏ", color: "#b45309" },
];
const rewards: Series[] = [
  { key: "earned", label: "Tiền đạt mốc", color: "#2563eb" },
  { key: "paid", label: "Thực tế đã trả", color: "#15803d" },
  { key: "outstanding", label: "Còn phải trả", color: "#b45309" },
];

function Bars({
  title,
  description,
  rows,
  series,
  unit = "lượt",
}: {
  title: string;
  description: string;
  rows: any[];
  series: Series[];
  unit?: string;
}) {
  const max =
    unit === "%"
      ? 100
      : Math.max(
          0,
          ...rows.flatMap((row) => series.map((s) => Number(row[s.key]) || 0)),
        );
  const format = (value: number) => `${value.toLocaleString("vi-VN")} ${unit}`;
  return (
    <Card title={title} className="h-full">
      <p className="text-slate-600 mb-4">{description}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              style={{
                background: s.color,
                width: 12,
                height: 12,
                display: "inline-block",
                borderRadius: 2,
              }}
            />
            {s.label}
          </span>
        ))}
      </div>
      {!rows.length ? (
        <Empty description="Chưa có dữ liệu trong bộ lọc này" />
      ) : (
        <div className="space-y-5 max-h-[420px] overflow-auto pr-2">
          {rows.map((row, index) => (
            <div key={`${row.name}-${index}`}>
              <div className="font-semibold text-slate-900 mb-2 break-words">
                {row.name}
              </div>
              {series.map((s) => {
                const missing = row[s.key] == null;
                const value = Number(row[s.key]) || 0;
                return (
                  <div
                    key={s.key}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-1.5"
                    title={`${row.name} · ${s.label}: ${format(value)}`}
                  >
                    <div className="h-3 bg-slate-100 rounded-sm">
                      <div
                        style={{
                          width: max ? `${(value / max) * 100}%` : "0%",
                          background: s.color,
                          height: "100%",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: s.color }}
                    >
                      <span className="sr-only">{s.label}: </span>
                      {missing ? "Chưa có mẫu số" : format(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-600 mt-4">
        Thanh dài hơn tương ứng số lớn hơn; cùng thang đo trong mỗi biểu đồ. Các
        nhóm có thể chồng lặp, không cộng các thanh với nhau.
      </p>
    </Card>
  );
}

export default function OverviewCharts({ data }: { data: any }) {
  const r = data.recruitment,
    b = data.rewards;
  const [company, setCompany] = useState("ALL");
  const demographic =
    company === "ALL"
      ? r.demographics
      : r.companyDemographics.find((d: any) => d.factory === company);
  const compare = (title: string, rows: any[]) => (
    <Bars
      title={title}
      description="So sánh tổng lượt tuyển và kết quả; các trạng thái hiện tại xem ở bảng chi tiết."
      rows={rows}
      series={recruitment}
    />
  );
  const rate = (title: string, rows: any[], key: string, label: string) => (
    <Bars
      title={title}
      description={
        key === "returnRate"
          ? "Lượt quay lại / tổng lượt tuyển. Quay lại khi có đợt làm việc trước ngày phỏng vấn."
          : "Mốc đã xác nhận đạt / mốc đã xác nhận đủ điều kiện xét. Không có mẫu số được ghi rõ."
      }
      rows={rows}
      series={[{ key, label, color: "#15803d" }]}
      unit="%"
    />
  );
  const reward = (title: string, rows: any[]) => (
    <Bars
      title={title}
      description="Đơn vị đồng; tháng được tính theo ngày phỏng vấn. Tiền đạt mốc và tiền thực tế đã trả được tách riêng."
      rows={rows}
      series={rewards}
      unit="₫"
    />
  );
  return (
    <section aria-label="Biểu đồ tuyển dụng và thưởng" className="space-y-4">
      <h2 className="text-xl font-bold">Biểu đồ tổng quan</h2>
      <p className="text-sm text-slate-600">
        Tất cả biểu đồ theo bộ lọc đã áp dụng · ngày phỏng vấn
      </p>
      <Tabs
        items={[
          {
            key: "total",
            label: "DS Tổng",
            children: (
              <div className="grid xl:grid-cols-2 gap-4">
                {compare(
                  "Theo tháng phỏng vấn",
                  [...r.months].sort((a, b) => a.name.localeCompare(b.name)),
                )}
                {compare("Theo nhà máy phỏng vấn", r.factories)}
                <Bars
                  title="Tình trạng lao động"
                  description="Tình trạng hiện tại của từng lượt tuyển."
                  rows={r.statuses}
                  series={[
                    { key: "total", label: "Số lượt", color: "#2563eb" },
                  ]}
                />
                {compare("So sánh đơn hàng", r.orders)}
                {compare("Theo chuyên viên tuyển dụng", r.recruiters)}
                {compare("Theo team tuyển dụng", r.teams)}
                <Card title="Tỷ lệ lao động quay lại — toàn bộ">
                  <Statistic
                    title="Lượt quay lại / tổng lượt tuyển"
                    value={r.summary.returnRate}
                    suffix={r.summary.returnRate == null ? "" : "%"}
                    formatter={(v) =>
                      r.summary.returnRate == null
                        ? "Chưa có mẫu số"
                        : String(v)
                    }
                    valueStyle={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: "#15803d",
                    }}
                  />
                  <p className="mt-3">
                    {r.summary.returning.toLocaleString("vi-VN")} /{" "}
                    {r.summary.total.toLocaleString("vi-VN")} lượt tuyển
                  </p>
                  <p className="text-slate-600 mt-2">
                    Quay lại khi có đợt làm việc trước ngày phỏng vấn của lượt
                    tuyển này.
                  </p>
                </Card>
                {rate(
                  "Tỷ lệ quay lại theo đơn hàng",
                  r.orders,
                  "returnRate",
                  "Tỷ lệ quay lại",
                )}
              </div>
            ),
          },
          {
            key: "demographics",
            label: "Giới tính · Quê quán · Độ tuổi",
            children: (
              <>
                <label
                  htmlFor="chart-company"
                  className="block font-semibold mb-2"
                >
                  Phạm vi thống kê NLĐ
                </label>
                <Select
                  id="chart-company"
                  className="w-full sm:w-80 mb-5"
                  value={company}
                  onChange={setCompany}
                  options={[
                    { value: "ALL", label: "Toàn bộ công ty" },
                    ...r.companyDemographics.map((d: any) => ({
                      value: d.factory,
                      label: d.factory,
                    })),
                  ]}
                />
                <p className="text-slate-600 mb-4">
                  Đếm người riêng biệt; tuổi tại ngày phỏng vấn. Toàn bộ chọn
                  lượt gần nhất của mỗi người; theo công ty chọn lượt gần nhất
                  tại công ty đó.
                </p>
                <div className="grid xl:grid-cols-3 gap-4">
                  {[
                    ["genders", "Giới tính"],
                    ["provinces", "Quê quán / tỉnh thành"],
                    ["ages", "Độ tuổi"],
                  ].map(([key, title]) => (
                    <Bars
                      key={key}
                      title={title}
                      description="Dữ liệu thiếu được giữ ở nhóm chưa xác định."
                      rows={demographic?.[key] || []}
                      series={[
                        { key: "count", label: "Số người", color: "#2563eb" },
                      ]}
                      unit="người"
                    />
                  ))}
                </div>
              </>
            ),
          },
          {
            key: "rewards",
            label: "DS Thưởng",
            children: (
              <div className="grid xl:grid-cols-2 gap-4">
                {reward("Tổng thưởng theo tháng phỏng vấn", b.months)}
                {reward("Tổng thưởng theo đơn hàng", b.orders)}
                {reward("Tổng thưởng theo chính sách", b.policies)}
                {reward("Thưởng theo mốc công / nội dung", b.milestones || [])}
                {rate(
                  "Tỷ lệ đạt theo tháng",
                  b.months,
                  "achieveRate",
                  "Tỷ lệ đạt",
                )}
                {rate(
                  "Tỷ lệ đạt theo công ty",
                  b.companies,
                  "achieveRate",
                  "Tỷ lệ đạt",
                )}
                {rate(
                  "Tỷ lệ đạt theo giai đoạn thưởng",
                  b.stages,
                  "achieveRate",
                  "Tỷ lệ đạt",
                )}
                {rate(
                  "Tỷ lệ đạt theo chính sách",
                  b.policies,
                  "achieveRate",
                  "Tỷ lệ đạt",
                )}
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}
