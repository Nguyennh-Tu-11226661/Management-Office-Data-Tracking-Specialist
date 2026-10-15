"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Statistic,
  Tabs,
  Space,
  message,
} from "antd";
import OverviewCharts from "@/components/OverviewCharts";
import { useIdentity } from "@/components/AuthGate";
import { Calendar, Building2, Target, Filter, RotateCcw } from "lucide-react";

const pct = (n: number | null) => (n == null ? "Chưa có mẫu số" : `${n}%`);
const money = (n: number) => n.toLocaleString("vi-VN");

const recruitColumns = [
  { title: "Nhóm / Phân loại", dataIndex: "name" },
  { title: "Lượt tuyển", dataIndex: "total" },
  { title: "Số người", dataIndex: "people" },
  { title: "Đỗ PV", dataIndex: "passed" },
  { title: "Trượt PV", dataIndex: "failed" },
  { title: "Bỏ", dataIndex: "abandoned" },
  {
    title: "Chi tiết tình trạng",
    dataIndex: "statusCounts",
    render: (counts: Record<string, number>) =>
      Object.entries(counts || {})
        .map(([name, count]) => `${name}: ${count}`)
        .join(" · "),
  },
  { title: "Đang đào tạo", dataIndex: "training" },
  { title: "Đang làm việc", dataIndex: "working" },
  { title: "Quay lại", dataIndex: "returning" },
  { title: "Tỷ lệ đỗ", dataIndex: "passRate", render: pct },
  { title: "Tỷ lệ quay lại", dataIndex: "returnRate", render: pct },
];

const rewardColumns = [
  { title: "Nhóm / Đơn vị", dataIndex: "name" },
  { title: "Số hồ sơ áp dụng", dataIndex: "applications" },
  { title: "Đủ điều kiện xét", dataIndex: "eligible" },
  { title: "Đạt mốc", dataIndex: "achieved" },
  { title: "Tỷ lệ đạt", dataIndex: "achieveRate", render: pct },
  { title: "Tiền đạt mốc (₫)", dataIndex: "earned", render: money },
  { title: "Thực tế đã trả (₫)", dataIndex: "paid", render: money },
  { title: "Còn phải trả (₫)", dataIndex: "outstanding", render: money },
];

export default function OverviewPage() {
  const user = useIdentity();
  const [data, setData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const j = await (
        await fetch("/api/reports?" + new URLSearchParams(filters))
      ).json();
      if (j.success) setData(j.data);
      else message.error(j.message);
    } catch {
      message.error("Không tải được báo cáo");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/catalogs").then((r) => r.json()),
    ])
      .then(([o, c]) => {
        setOrders(o.data || []);
        setCatalogs(c.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => load(), 60000);
    return () => clearInterval(timer);
  }, [filters]);

  const set = (key: string, value: string) =>
    setFilters((old) => ({ ...old, [key]: value || "" }));

  const factoryNames = [
    ...new Set([
      ...orders.map((o) => o.factory),
      ...catalogs.map((c: any) => c.name),
    ]),
  ].filter(Boolean);

  const table = (rows: any[], columns: any[]) => (
    <Table<any>
      size="small"
      className="overview-table"
      tableLayout="fixed"
      rowKey={(r, i) => r.id || `${r.name}-${i}`}
      loading={busy}
      dataSource={rows || []}
      columns={columns.slice(0, 4).map((column, index) => ({
        ...column,
        responsive: index > 1 ? ["md"] : undefined,
      }))}
      expandable={{
        columnTitle: "Chi tiết",
        columnWidth: 88,
        expandIcon: ({ expanded, onExpand, record }) => (
          <Button
            size="small"
            type="link"
            aria-expanded={expanded}
            onClick={(event) => onExpand(record, event)}
          >
            {expanded ? "Thu gọn" : "Xem"}
          </Button>
        ),
        expandedRowRender: (record) => (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-3">
            {columns.map((column) => (
              <div key={column.dataIndex} className="min-w-0">
                <dt className="text-sm font-semibold text-slate-600 mb-1">
                  {column.title}
                </dt>
                <dd className="whitespace-pre-wrap break-words text-slate-900">
                  {column.render
                    ? column.render(record[column.dataIndex], record)
                    : (record[column.dataIndex] ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
        ),
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50, 100],
        showTotal: (total, range) => `${range[0]}–${range[1]} / ${total} dòng`,
      }}
    />
  );

  return (
    <div className="overview-page min-w-0 space-y-6">
      {/* 1. BỘ LỌC TỔNG QUÁT CẤP CAO (EXECUTIVE FILTERS) */}
      <Card className="shadow-xs border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-sm text-slate-800">
              Bộ Lọc Tổng Quan & Phân Tích
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Mốc thời gian tính theo ngày phỏng vấn (PV)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mt-4 items-start">
          {/* 1. Tháng PV */}
          <div>
            <label
              htmlFor="filter-month"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Tháng phỏng vấn
            </label>
            <Input
              id="filter-month"
              type="month"
              value={filters.month || ""}
              onChange={(e) => set("month", e.target.value)}
              className="w-full rounded-lg"
            />
          </div>

          {/* 2. Từ ngày */}
          <div>
            <label
              htmlFor="filter-from"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Từ ngày PV
            </label>
            <Input
              id="filter-from"
              type="date"
              value={filters.from || ""}
              onChange={(e) => set("from", e.target.value)}
              className="w-full rounded-lg"
            />
          </div>

          {/* 3. Đến ngày */}
          <div>
            <label
              htmlFor="filter-to"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Đến ngày PV
            </label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to || ""}
              onChange={(e) => set("to", e.target.value)}
              className="w-full rounded-lg"
            />
          </div>

          {/* 4. Nhà máy */}
          <div>
            <label
              htmlFor="filter-factory"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Nhà máy phỏng vấn
            </label>
            <Select
              id="filter-factory"
              className="w-full"
              allowClear
              placeholder="Tất cả nhà máy"
              value={filters.interviewFactory || undefined}
              onChange={(v) => set("interviewFactory", v)}
              options={factoryNames.map((f) => ({ value: f, label: f }))}
            />
          </div>

          {/* 5. Đơn hàng */}
          <div>
            <label
              htmlFor="filter-order"
              className="block text-xs font-semibold text-slate-600 mb-1.5"
            >
              Đơn hàng tuyển dụng
            </label>
            <Select
              id="filter-order"
              className="w-full"
              allowClear
              popupMatchSelectWidth={false}
              placeholder="Tất cả đơn hàng"
              value={filters.orderId || undefined}
              onChange={(v) => {
                set("orderId", v);
                set("batchId", "");
              }}
              options={orders.map((o) => ({ value: o.id, label: o.name }))}
            />
          </div>
        </div>

        {/* Hàng phụ: Đợt tuyển (chỉ hiện khi có hoặc chọn tất cả) và Nút thao tác */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="w-full sm:max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 shrink-0">
                Đợt tuyển:
              </span>
              <Select
                id="filter-batch"
                className="w-full"
                allowClear
                popupMatchSelectWidth={false}
                placeholder="Tất cả đợt tuyển (T01 - T10)"
                value={filters.batchId || undefined}
                onChange={(v) => set("batchId", v)}
                options={orders
                  .filter((o) => !filters.orderId || o.id === filters.orderId)
                  .flatMap((o) =>
                    o.batches.map((b: any) => ({
                      value: b.id,
                      label: filters.orderId
                        ? `${b.periodMonth || b.name} (Chỉ tiêu: ${b.target ? b.target.toLocaleString("vi-VN") : "N/A"})`
                        : `${o.factory} · ${b.periodMonth || b.name} (Chỉ tiêu: ${b.target ? b.target.toLocaleString("vi-VN") : "N/A"})`,
                    })),
                  )}
              />
            </div>
          </div>

          <Space>
            <Button
              type="primary"
              loading={busy}
              onClick={load}
              icon={<Filter className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Áp Dụng Bộ Lọc
            </Button>
            <Button
              onClick={() => {
                setFilters({});
              }}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Xóa Bộ Lọc
            </Button>
          </Space>
        </div>
      </Card>

      {/* 2. KHUNG CHỈ SỐ KPI VĨ MÔ */}
      {data?.sourcePaid && (
        <Card title="Thưởng đã trả theo file Excel gốc">
          <Statistic
            title="Tiền đã trả — nguồn Excel"
            value={data.sourcePaid.total}
            suffix="₫"
          />
          <p className="text-slate-600 my-3">
            Theo xác nhận của chủ dữ liệu. Chưa có ngày chi/chứng từ; hiện vật
            giữ nguyên mô tả, không quy đổi thành tiền. Không cộng trùng với
            bảng mốc thưởng nội bộ. Lọc nhà máy tại đây theo Công ty trong nguồn
            thưởng; tháng/khoảng ngày theo Ngày PV của dòng nguồn.
          </p>
          <p className="text-sm text-amber-800 mb-3">
            {data.sourcePaid.unlinked} dòng chưa liên kết đợt;{" "}
            {data.sourcePaid.pending} dòng có số tiền chưa rõ hoặc xung đột,
            chưa cộng vào tổng.
          </p>
          {table(data.sourcePaid.companies, [
            { title: "Công ty nguồn", dataIndex: "name" },
            { title: "Số dòng", dataIndex: "rows" },
            { title: "Đã trả (₫)", dataIndex: "paid", render: money },
            { title: "Chưa liên kết", dataIndex: "unlinked" },
            { title: "Chờ đối chiếu", dataIndex: "pending" },
          ])}
          {table(data.sourcePaid.rows, [
            { title: "Người lao động", dataIndex: "name" },
            { title: "Công ty", dataIndex: "company" },
            { title: "Tháng nguồn", dataIndex: "month" },
            { title: "Đã trả (₫)", dataIndex: "paid", render: money },
            { title: "Ngày PV nguồn", dataIndex: "interviewDate" },
            { title: "Chính sách nguồn", dataIndex: "policy" },
            { title: "Đối chiếu", dataIndex: "status" },
            { title: "Nội dung gốc từng mốc", dataIndex: "sourceRewards" },
          ])}
        </Card>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              ["Lượt tuyển", data.recruitment.summary.total, "#2563eb"],
              ["Người lao động", data.recruitment.summary.people, "#4f46e5"],
              ["Đỗ PV", data.recruitment.summary.passed, "#16a34a"],
              ["Trượt PV", data.recruitment.summary.failed, "#dc2626"],
              ["Bỏ PV", data.recruitment.summary.abandoned, "#ea580c"],
              ["Quay lại", data.recruitment.summary.returning, "#0284c7"],
              ["Tỷ lệ đỗ (%)", data.recruitment.summary.passRate, "#15803d"],
              ["Tiền đạt mốc (₫)", data.rewards.summary.earned, "#2563eb"],
              ["Thực tế đã trả (₫)", data.rewards.summary.paid, "#16a34a"],
              ["Còn phải trả (₫)", data.rewards.summary.outstanding, "#d97706"],
            ].map(([title, value, color]) => (
              <Card
                key={String(title)}
                size="small"
                className="hover:shadow-md transition-shadow"
              >
                <Statistic
                  title={
                    <span className="text-xs font-semibold text-slate-500">
                      {title}
                    </span>
                  }
                  value={value as number}
                  valueStyle={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: color as string,
                  }}
                  formatter={(v) =>
                    value == null
                      ? "Chưa xác định"
                      : Number(v).toLocaleString("vi-VN")
                  }
                />
              </Card>
            ))}
          </div>

          {/* 3. BIỂU ĐỒ PHỄU & XU HƯỚNG */}
          <OverviewCharts data={data} />

          {/* 4. BẢNG TỔNG HỢP VĨ MÔ THEO NHÀ MÁY & TIẾN ĐỘ THƯỞNG */}
          <Card title="Bảng Tổng Hợp Số Liệu Vĩ Mô">
            <Tabs
              items={[
                {
                  key: "recruit",
                  label: "Tuyển dụng & Đơn hàng",
                  children: (
                    <Tabs
                      type="card"
                      items={[
                        {
                          key: "factories",
                          label: "Theo Nhà máy PV",
                          children: table(
                            data.recruitment.factories,
                            recruitColumns,
                          ),
                        },
                        {
                          key: "months",
                          label: "Theo Tháng PV",
                          children: table(
                            data.recruitment.months,
                            recruitColumns,
                          ),
                        },
                        {
                          key: "statuses",
                          label: "Theo Tình trạng",
                          children: table(
                            data.recruitment.statuses,
                            recruitColumns,
                          ),
                        },
                        {
                          key: "orders",
                          label: "Theo Đơn hàng & Chỉ tiêu",
                          children: table(data.recruitment.orders, [
                            ...recruitColumns,
                            { title: "Chỉ tiêu", dataIndex: "target" },
                            {
                              title: "Đỗ / Mục tiêu",
                              dataIndex: "targetPassRate",
                              render: pct,
                            },
                          ]),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: "bonus",
                  label: "Tiến độ Thưởng theo Nhà máy",
                  children: (
                    <Tabs
                      type="card"
                      items={[
                        {
                          key: "companies",
                          label: "Theo Công ty / Nhà máy",
                          children: table(
                            data.rewards.companies,
                            rewardColumns,
                          ),
                        },
                        {
                          key: "months",
                          label: "Theo Tháng",
                          children: table(data.rewards.months, rewardColumns),
                        },
                        {
                          key: "policies",
                          label: "Theo Chính sách thưởng",
                          children: table(data.rewards.policies, rewardColumns),
                        },
                        {
                          key: "milestones",
                          label: "Theo Mốc công đạt",
                          children: table(
                            data.rewards.milestones,
                            rewardColumns,
                          ),
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
