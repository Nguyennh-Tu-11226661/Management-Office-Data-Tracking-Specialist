"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Tag,
  Card,
  message,
  Alert,
  Select,
  Input,
  Badge,
} from "antd";
import {
  ShieldAlert,
  Download,
  RefreshCw,
  UserCheck,
  AlertOctagon,
  Search,
  AlertTriangle,
  PhoneCall,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/lib/date-format";

interface DuplicateAlert {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "WARNING" | "INFO";
  phone?: string;
  idCard: string;
  fullName: string;
  currentFactory: string;
  currentStatus: string;
  currentInterviewDate?: string;
  newFactory: string;
  newStatus: string;
  newInterviewDate?: string;
  recruiter: string;
  newRecruiter?: string;
  warning: string;
  actionRequired: string;
}

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicateAlert[]>([]);
  const [counts, setCounts] = useState<{
    activeFactoryCount: number;
    activePhoneCount: number;
    generalPhoneCount: number;
    rehireCount: number;
  }>({
    activeFactoryCount: 0,
    activePhoneCount: 0,
    generalPhoneCount: 0,
    rehireCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/duplicates");
      const json = await res.json();
      if (json.success) {
        setDuplicates(json.data || []);
        if (json.counts) {
          setCounts(json.counts);
        }
      } else {
        message.error(json.message || "Lỗi tải danh sách cảnh báo trùng");
      }
    } catch {
      message.error("Lỗi tải danh sách cảnh báo trùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  // Lọc dữ liệu hiển thị
  const filteredDuplicates = useMemo(() => {
    return duplicates.filter((item) => {
      if (typeFilter !== "ALL") {
        if (
          typeFilter === "ACTIVE_FACTORY" &&
          item.type !== "ĐANG LÀM XƯỞNG KHÁC (CHƯA BÁO NGHỈ)"
        )
          return false;
        if (
          typeFilter === "ACTIVE_PHONE" &&
          item.type !== "SĐT ĐANG HOẠT ĐỘNG XƯỞNG KHÁC"
        )
          return false;
        if (typeFilter === "PHONE_DUP" && item.type !== "TRÙNG SĐT")
          return false;
        if (typeFilter === "REHIRE" && !item.type.includes("TÁI TUYỂN DỤNG"))
          return false;
      }

      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const target =
          `${item.fullName || ""} ${item.idCard || ""} ${item.phone || ""} ${item.currentFactory || ""} ${item.newFactory || ""} ${item.recruiter || ""} ${item.warning || ""}`.toLowerCase();
        if (!target.includes(kw)) return false;
      }

      return true;
    });
  }, [duplicates, typeFilter, searchKeyword]);

  const handleExportExcel = async () => {
    try {
      const r = await fetch("/api/excel-engine/export?type=DUPLICATES");
      if (!r.ok) {
        const j = await r.json();
        message.error(j.message);
        return;
      }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "CanhBaoTrung_TriThucViet.xlsx";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      message.error("Không thể xuất cảnh báo");
    }
  };

  const columns: ColumnsType<DuplicateAlert> = [
    {
      title: "STT",
      key: "stt",
      width: 55,
      align: "center",
      render: (_, __, idx) => (
        <span className="font-semibold text-slate-500 text-xs">
          {(currentPage - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      title: "Người lao động",
      key: "worker",
      width: 210,
      render: (_, r) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-xs">{r.fullName}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              {r.idCard}
            </span>
            {r.phone && (
              <span className="text-[11px] text-slate-600 font-mono">
                {r.phone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Phân loại cảnh báo",
      key: "type",
      width: 220,
      render: (_, r) => {
        if (r.type === "ĐANG LÀM XƯỞNG KHÁC (CHƯA BÁO NGHỈ)") {
          return (
            <div className="space-y-1">
              <Tag
                color="red"
                className="font-bold text-[11px] m-0 flex items-center gap-1 w-fit"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>CHƯA BÁO NGHỈ XƯỞNG CŨ</span>
              </Tag>
              <div className="text-[10px] text-red-600 font-medium">
                🚨 Ưu tiên xác minh khẩn cấp
              </div>
            </div>
          );
        }
        if (r.type === "SĐT ĐANG HOẠT ĐỘNG XƯỞNG KHÁC") {
          return (
            <div className="space-y-1">
              <Tag
                color="volcano"
                className="font-bold text-[11px] m-0 flex items-center gap-1 w-fit"
              >
                <PhoneCall className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>SĐT ĐANG HOẠT ĐỘNG XƯỞNG KHÁC</span>
              </Tag>
              <div className="text-[10px] text-orange-600 font-medium">
                ⚠️ Trùng số người đang đi làm
              </div>
            </div>
          );
        }
        if (r.type === "TRÙNG SĐT") {
          return (
            <Tag color="orange" className="font-semibold text-[11px] m-0">
              TRÙNG SỐ ĐIỆN THOẠI
            </Tag>
          );
        }
        return (
          <Tag
            color="cyan"
            className="font-semibold text-[11px] m-0 flex items-center gap-1 w-fit"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span>TÁI TUYỂN DỤNG (RE-HIRE)</span>
          </Tag>
        );
      },
    },
    {
      title: "Xưởng hiện tại (Chưa nghỉ)",
      key: "currentFactory",
      width: 190,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800">{r.currentFactory}</div>
          <div className="text-[11px] text-slate-500">
            Trạng thái:{" "}
            <strong className="text-slate-700">{r.currentStatus}</strong>
          </div>
          {r.recruiter && (
            <div className="text-[10px] text-slate-400">
              Tuyển dụng: {r.recruiter}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Xưởng mới phát sinh",
      key: "newFactory",
      width: 190,
      render: (_, r) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-slate-800">{r.newFactory}</div>
          <div className="text-[11px] text-slate-500">
            {r.newInterviewDate && r.newInterviewDate !== "—"
              ? `Ngày PV: ${formatDate(r.newInterviewDate)}`
              : ""}
            {r.newStatus && r.newStatus !== "—" ? ` (${r.newStatus})` : ""}
          </div>
          {r.newRecruiter && r.newRecruiter !== "—" && (
            <div className="text-[10px] text-slate-400">
              TD mới: {r.newRecruiter}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Chi tiết & Hướng xử lý đề xuất",
      key: "warningDetail",
      render: (_, r) => {
        const isCritical =
          r.type.includes("CHƯA BÁO NGHỈ") || r.type.includes("ĐANG HOẠT ĐỘNG");
        return (
          <div
            className={`p-2 rounded-lg text-xs space-y-1 ${isCritical ? "bg-rose-50/80 border border-rose-200" : "bg-slate-50 border border-slate-200"}`}
          >
            <div
              className={`font-semibold ${isCritical ? "text-rose-900" : "text-slate-800"}`}
            >
              {r.warning}
            </div>
            <div
              className={`text-[11px] flex items-start gap-1 ${isCritical ? "text-rose-700 font-medium" : "text-slate-600"}`}
            >
              <span className="shrink-0 font-bold">👉 Hướng xử lý:</span>
              <span>{r.actionRequired}</span>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Cảnh báo Trùng lặp & Nhảy xưởng chưa báo nghỉ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phát hiện tức thì công nhân chưa hoàn tất thủ tục nghỉ việc tại
            xưởng cũ nhưng đã đăng ký xưởng mới.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            }
            onClick={fetchDuplicates}
          >
            Quét lại
          </Button>
          <Button
            type="primary"
            danger
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportExcel}
          >
            Xuất Excel Cảnh báo
          </Button>
        </div>
      </div>

      {/* KPI Cards: 4 Thẻ phân loại cảnh báo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          size="small"
          className={`cursor-pointer transition-all border-rose-300 bg-rose-50/50 hover:shadow-sm ${typeFilter === "ACTIVE_FACTORY" ? "ring-2 ring-rose-500" : ""}`}
          onClick={() => {
            setTypeFilter(
              typeFilter === "ACTIVE_FACTORY" ? "ALL" : "ACTIVE_FACTORY",
            );
            setCurrentPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Chưa báo nghỉ xưởng cũ
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-700">
            {counts.activeFactoryCount}
            <span className="text-xs font-normal text-slate-500 ml-1">
              hồ sơ
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-rose-600 font-medium truncate">
            🚨 Ưu tiên gọi xác minh trước khi xếp xe
          </p>
        </Card>

        <Card
          size="small"
          className={`cursor-pointer transition-all border-orange-300 bg-orange-50/50 hover:shadow-sm ${typeFilter === "ACTIVE_PHONE" ? "ring-2 ring-orange-500" : ""}`}
          onClick={() => {
            setTypeFilter(
              typeFilter === "ACTIVE_PHONE" ? "ALL" : "ACTIVE_PHONE",
            );
            setCurrentPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700">
              SĐT đang hoạt động
            </span>
            <PhoneCall className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-orange-700">
            {counts.activePhoneCount}
            <span className="text-xs font-normal text-slate-500 ml-1">
              trường hợp
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-orange-600 font-medium truncate">
            ⚠️ SĐT của công nhân đang làm xưởng khác
          </p>
        </Card>

        <Card
          size="small"
          className={`cursor-pointer transition-all border-amber-300 bg-amber-50/50 hover:shadow-sm ${typeFilter === "PHONE_DUP" ? "ring-2 ring-amber-500" : ""}`}
          onClick={() => {
            setTypeFilter(typeFilter === "PHONE_DUP" ? "ALL" : "PHONE_DUP");
            setCurrentPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Trùng số điện thoại
            </span>
            <AlertOctagon className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {counts.generalPhoneCount}
            <span className="text-xs font-normal text-slate-500 ml-1">
              trường hợp
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-600 truncate">
            Dùng chung SĐT người thân hoặc nhầm số
          </p>
        </Card>

        <Card
          size="small"
          className={`cursor-pointer transition-all border-cyan-300 bg-cyan-50/50 hover:shadow-sm ${typeFilter === "REHIRE" ? "ring-2 ring-cyan-500" : ""}`}
          onClick={() => {
            setTypeFilter(typeFilter === "REHIRE" ? "ALL" : "REHIRE");
            setCurrentPage(1);
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
              Tái tuyển dụng (Re-hire)
            </span>
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {counts.rehireCount}
            <span className="text-xs font-normal text-slate-500 ml-1">
              lao động
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-600 truncate">
            Lao động đã báo nghỉ quay lại làm việc
          </p>
        </Card>
      </div>

      {/* Alert hướng dẫn nghiệp vụ */}
      <Alert
        message="Nguyên tắc xử lý Cảnh báo Khẩn cấp tại xưởng"
        description="Khi xuất hiện cảnh báo 'CHƯA BÁO NGHỈ XƯỞNG CŨ', nhân sự hoặc trưởng nhóm tuyển dụng cần gọi điện ngay cho công nhân và liên hệ xưởng cũ để cập nhật ngày nghỉ việc trước khi đưa ứng viên vào danh sách xe đưa đón hoặc trình danh sách nhận việc mới."
        type="warning"
        showIcon
        className="border-amber-200 bg-amber-50/60 text-xs"
      />

      {/* Filter Bar */}
      <Card size="small" className="shadow-xs border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <Input
              className="w-full sm:w-64"
              placeholder="Tìm tên, CCCD, SĐT, nhà máy..."
              prefix={<Search className="w-3.5 h-3.5 text-slate-400" />}
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
            />

            <Select
              className="w-full sm:w-72"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
              options={[
                {
                  label: `Tất cả loại cảnh báo (${duplicates.length})`,
                  value: "ALL",
                },
                {
                  label: `🚨 Đang làm xưởng khác (Chưa báo nghỉ) (${counts.activeFactoryCount})`,
                  value: "ACTIVE_FACTORY",
                },
                {
                  label: `📱 SĐT đang hoạt động xưởng khác (${counts.activePhoneCount})`,
                  value: "ACTIVE_PHONE",
                },
                {
                  label: `⚠️ Trùng số điện thoại (${counts.generalPhoneCount})`,
                  value: "PHONE_DUP",
                },
                {
                  label: `🔄 Tái tuyển dụng (Đã báo nghỉ) (${counts.rehireCount})`,
                  value: "REHIRE",
                },
              ]}
            />

            {(typeFilter !== "ALL" || searchKeyword) && (
              <Button
                size="middle"
                onClick={() => {
                  setTypeFilter("ALL");
                  setSearchKeyword("");
                  setCurrentPage(1);
                }}
                className="text-xs"
              >
                Đặt lại
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredDuplicates.length}</strong> /{" "}
            {duplicates.length} cảnh báo
          </div>
        </div>
      </Card>

      {/* Bảng Cảnh báo */}
      <Card size="small" className="shadow-xs border-slate-200 overflow-hidden">
        <Table<DuplicateAlert>
          columns={columns}
          dataSource={filteredDuplicates}
          rowKey={(r) => r.id}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showTotal: (total, range) =>
              `${range[0]} - ${range[1]} / ${total} cảnh báo`,
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}
