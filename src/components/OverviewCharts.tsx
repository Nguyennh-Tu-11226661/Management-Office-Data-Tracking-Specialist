"use client";

import React, { useState } from "react";
import { Card, Empty, Tabs, Select, Tag, Progress, Badge, Tooltip } from "antd";
import {
  Users,
  UserCheck,
  Briefcase,
  RotateCcw,
  Building2,
  Calendar,
  Award,
  Target,
  Layers,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  Percent,
} from "lucide-react";

const pct = (n: number | null | undefined) =>
  n == null ? "Chưa có mẫu số" : `${n}%`;
const money = (n: number) => (n || 0).toLocaleString("vi-VN") + " ₫";

interface OverviewChartsProps {
  data: any;
}

export default function OverviewCharts({ data }: { data: any }) {
  const r = data?.recruitment || {};
  const b = data?.rewards || {};
  const summary = r.summary || {};
  const sourcePaid = data?.sourcePaid;
  const sourcePaidTotal = sourcePaid?.total || 0;

  const rewardSummary = {
    ...b.summary,
    paid: (b.summary?.paid || 0) > 0 ? b.summary.paid : sourcePaidTotal,
    earned: (b.summary?.earned || 0) > 0 ? b.summary.earned : sourcePaidTotal,
  };

  const rewardCompanies = (b.companies || []).length > 0
    ? b.companies
    : (sourcePaid?.companies || []).map((c: any) => ({
        name: c.name,
        earned: c.paid,
        paid: c.paid,
        outstanding: 0,
      }));

  const [demoFactory, setDemoFactory] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<string>("funnel-factories");

  const demographics =
    demoFactory === "ALL"
      ? r.demographics || { people: 0, genders: [], provinces: [], ages: [] }
      : r.companyDemographics?.find((d: any) => d.factory === demoFactory) || {
          people: 0,
          genders: [],
          provinces: [],
          ages: [],
        };

  // Funnel calculations
  const totalRecruits = summary.total || 0;
  const passed = summary.passed || 0;
  const working = summary.working || 0;
  const returning = summary.returning || 0;
  const passRate = summary.passRate ?? (totalRecruits ? Math.round((passed / totalRecruits) * 100) : 0);
  const workingRate = passed ? Math.round((working / passed) * 100) : 0;
  const returnRate = summary.returnRate ?? (totalRecruits ? Math.round((returning / totalRecruits) * 100) : 0);

  // Sort factories by total recruits descending
  const sortedFactories = [...(r.factories || [])].sort(
    (a, b) => (b.total || 0) - (a.total || 0)
  );

  // Sort months chronologically
  const sortedMonths = [...(r.months || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Find max values for visual scaling
  const maxFactoryTotal = Math.max(1, ...sortedFactories.map((f) => f.total || 0));
  const maxMonthTotal = Math.max(1, ...sortedMonths.map((m) => m.total || 0));

  // Sort demographics ages & provinces
  const sortedProvinces = [...(demographics.provinces || [])]
    .sort((a, b) => b.count - a.count)
    .filter((p) => p.name !== "Chưa xác định" || demographics.provinces.length === 1);
  const maxProvince = Math.max(1, ...sortedProvinces.map((p) => p.count || 0));

  // Gender calculation
  const maleCount = demographics.genders?.find((g: any) => g.name === "Nam")?.count || 0;
  const femaleCount = demographics.genders?.find((g: any) => g.name === "Nữ")?.count || 0;
  const totalGender = maleCount + femaleCount || 1;
  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = 100 - malePercent;

  return (
    <div className="space-y-6">
      {/* 1. PHỄU CHUYỂN ĐỔI TUYỂN DỤNG TRỰC QUAN (CONVERSION FUNNEL) */}
      <Card
        className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20"
        title={
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-800">
                  Phễu Chuyển Đổi Tuyển Dụng Toàn Hệ Thống
                </span>
                <p className="text-xs font-normal text-slate-500">
                  Theo dõi từng chặng từ Tiếp nhận ứng viên ➔ Phỏng vấn ➔ Đi làm thực tế ➔ Tái tuyển dụng
                </p>
              </div>
            </div>
            <Tag color="blue" className="rounded-full px-3 py-0.5 text-xs font-medium">
              Tỷ lệ đỗ chung: {passRate}%
            </Tag>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Bước 1: Tiếp nhận */}
          <div className="relative p-4 rounded-xl bg-white border border-blue-100 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> 1. Tiếp nhận
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                100%
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {totalRecruits.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-500 ml-1">lượt</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ứng viên đăng ký ({summary.people || 0} người)
            </p>
            <div className="mt-3">
              <Progress percent={100} strokeColor="#2563eb" showInfo={false} size="small" />
            </div>
          </div>

          {/* Bước 2: Đỗ Phỏng Vấn */}
          <div className="relative p-4 rounded-xl bg-white border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2. Đỗ Phỏng Vấn
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                {passRate}%
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {passed.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-500 ml-1">lượt</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đạt tiêu chuẩn PV nhà máy
            </p>
            <div className="mt-3">
              <Progress percent={passRate} strokeColor="#16a34a" showInfo={false} size="small" />
            </div>
          </div>

          {/* Bước 3: Đi Làm Thực Tế */}
          <div className="relative p-4 rounded-xl bg-white border border-indigo-100 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> 3. Đi Làm Thực Tế
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                {workingRate}% đỗ
              </span>
            </div>
            <div className="text-2xl font-black text-indigo-700 tracking-tight">
              {working.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-500 ml-1">lao động</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đang làm việc tại các nhà máy
            </p>
            <div className="mt-3">
              <Progress
                percent={totalRecruits ? Math.round((working / totalRecruits) * 100) : 0}
                strokeColor="#4f46e5"
                showInfo={false}
                size="small"
              />
            </div>
          </div>

          {/* Bước 4: Tái Tuyển / Quay Lại */}
          <div className="relative p-4 rounded-xl bg-white border border-cyan-100 shadow-xs hover:border-cyan-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> 4. Lao Động Quay Lại
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-semibold">
                {returnRate}%
              </span>
            </div>
            <div className="text-2xl font-black text-cyan-700 tracking-tight">
              {returning.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-500 ml-1">lượt</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ứng viên có lịch sử làm việc cũ
            </p>
            <div className="mt-3">
              <Progress percent={returnRate} strokeColor="#0891b2" showInfo={false} size="small" />
            </div>
          </div>
        </div>

        {/* Thanh cảnh báo hao hụt / phân loại nhanh */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Đỗ PV: <strong className="text-slate-800">{passed}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Trượt PV: <strong className="text-slate-800">{summary.failed || 0}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Bỏ PV: <strong className="text-slate-800">{summary.abandoned || 0}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              Chưa xác định PV: <strong className="text-slate-800">{summary.unknownInterview || 0}</strong>
            </span>
          </div>
          <span className="text-slate-400">
            Dữ liệu được tổng hợp thời gian thực theo bộ lọc áp dụng
          </span>
        </div>
      </Card>

      {/* 2. KHU VỰC PHÂN TÍCH CHUYÊN SÂU (TABBED ANALYTICS) */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="overview-charts-tabs"
        items={[
          {
            key: "funnel-factories",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <Building2 className="w-4 h-4 text-blue-600" />
                Phân Tích Nhà Máy & Đơn Hàng
              </span>
            ),
            children: (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2.1 Bảng xếp hạng Top Nhà máy */}
                <Card
                  title={
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Top Nhà Máy Tiếp Nhận Lao Động
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        {sortedFactories.length} nhà máy
                      </span>
                    </div>
                  }
                  className="border-slate-200/80 shadow-sm rounded-xl h-full"
                >
                  {!sortedFactories.length ? (
                    <Empty description="Chưa có dữ liệu nhà máy" />
                  ) : (
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      {sortedFactories.map((factory, index) => {
                        const total = factory.total || 0;
                        const fPassed = factory.passed || 0;
                        const fWorking = factory.working || 0;
                        const fPassRate = factory.passRate ?? Math.round((fPassed / (total || 1)) * 100);
                        const percentOfMax = Math.round((total / maxFactoryTotal) * 100);

                        return (
                          <div
                            key={factory.name}
                            className="p-3 rounded-lg bg-slate-50/70 hover:bg-blue-50/40 border border-slate-100 transition-all"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                                    index === 0
                                      ? "bg-amber-100 text-amber-700"
                                      : index === 1
                                      ? "bg-slate-200 text-slate-700"
                                      : index === 2
                                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                <span className="font-semibold text-slate-800 text-sm">
                                  {factory.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag color="green" className="text-xs font-medium">
                                  Đỗ: {fPassed} ({fPassRate}%)
                                </Tag>
                                <Tag color="blue" className="text-xs font-medium">
                                  Làm việc: {fWorking}
                                </Tag>
                                <span className="font-bold text-slate-900 text-sm">
                                  {total} <span className="text-xs font-normal text-slate-500">lượt</span>
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${percentOfMax}%` }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                title={`Quy mô: ${total} lượt`}
                              />
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
                              <span>Số người riêng biệt: {factory.people || total}</span>
                              <span>Tái ký / quay lại: {factory.returning || 0}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* 2.2 Tiến độ Đơn hàng & Mục tiêu */}
                <Card
                  title={
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Tiến Độ Đơn Hàng & Chỉ Tiêu Tuyển
                      </span>
                      <span className="text-xs font-normal text-slate-500">
                        {r.orders?.length || 0} đơn hàng
                      </span>
                    </div>
                  }
                  className="border-slate-200/80 shadow-sm rounded-xl h-full"
                >
                  {!(r.orders || []).length ? (
                    <Empty description="Chưa có dữ liệu đơn hàng" />
                  ) : (
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      {(r.orders || []).map((order: any) => {
                        const target = order.target;
                        const oPassed = order.passed || 0;
                        const oTotal = order.total || 0;
                        const hasTarget = target != null && target > 0;
                        const targetProgress = hasTarget ? Math.min(100, Math.round((oPassed / target) * 100)) : null;

                        return (
                          <div
                            key={order.id || order.name}
                            className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 hover:border-slate-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-slate-800 text-sm">
                                  {order.name}
                                </div>
                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  {order.factory || "Chưa xác định nhà máy"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 text-sm">
                                  {oPassed}
                                  {hasTarget && (
                                    <span className="text-slate-500 text-xs font-normal"> / {target}</span>
                                  )}
                                </span>
                                <span className="block text-[11px] text-slate-500">
                                  {hasTarget ? `Đạt ${targetProgress}% chỉ tiêu` : `${oTotal} lượt tuyển`}
                                </span>
                              </div>
                            </div>

                            {hasTarget ? (
                              <div>
                                <Progress
                                  percent={targetProgress || 0}
                                  status={targetProgress && targetProgress >= 100 ? "success" : "active"}
                                  strokeColor={
                                    targetProgress && targetProgress >= 100
                                      ? "#16a34a"
                                      : targetProgress && targetProgress >= 60
                                      ? "#2563eb"
                                      : "#d97706"
                                  }
                                  size="small"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                                <span>Đỗ PV: <strong className="text-emerald-600">{oPassed}</strong></span>
                                <span>Làm việc: <strong className="text-indigo-600">{order.working || 0}</strong></span>
                                <span>Tỷ lệ đỗ: <strong>{order.passRate ?? "—"}%</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: "demographics",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <Users className="w-4 h-4 text-indigo-600" />
                Chân Dung Ứng Viên (Demographics)
              </span>
            ),
            children: (
              <div className="space-y-4">
                {/* Lọc nhà máy cho chân dung */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Phạm vi thống kê nhân sự:</span>
                    <Select
                      className="w-56"
                      value={demoFactory}
                      onChange={setDemoFactory}
                      options={[
                        { value: "ALL", label: "Toàn bộ công ty (Tất cả)" },
                        ...((r.companyDemographics || []).map((d: any) => ({
                          value: d.factory,
                          label: d.factory,
                        }))),
                      ]}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    Tổng cộng: <strong className="text-slate-800">{demographics.people || 0}</strong> người lao động riêng biệt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 1. Giới tính */}
                  <Card
                    title={<span className="font-bold text-slate-800 text-sm">Cơ Cấu Giới Tính</span>}
                    className="border-slate-200/80 shadow-sm rounded-xl"
                  >
                    <div className="space-y-4">
                      {/* Split Bar */}
                      <div className="h-6 w-full rounded-lg overflow-hidden flex shadow-xs border border-slate-200">
                        <div
                          style={{ width: `${malePercent}%` }}
                          className="bg-blue-600 flex items-center justify-center text-white text-xs font-bold transition-all"
                          title={`Nam: ${maleCount} (${malePercent}%)`}
                        >
                          {malePercent > 15 ? `Nam ${malePercent}%` : ""}
                        </div>
                        <div
                          style={{ width: `${femalePercent}%` }}
                          className="bg-pink-500 flex items-center justify-center text-white text-xs font-bold transition-all"
                          title={`Nữ: ${femaleCount} (${femalePercent}%)`}
                        >
                          {femalePercent > 15 ? `Nữ ${femalePercent}%` : ""}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-center">
                          <span className="text-xs font-medium text-blue-600">Nam</span>
                          <div className="text-xl font-bold text-blue-900 mt-0.5">{maleCount}</div>
                          <span className="text-[11px] text-blue-500">{malePercent}% tổng số</span>
                        </div>
                        <div className="p-3 rounded-lg bg-pink-50/70 border border-pink-100 text-center">
                          <span className="text-xs font-medium text-pink-600">Nữ</span>
                          <div className="text-xl font-bold text-pink-900 mt-0.5">{femaleCount}</div>
                          <span className="text-[11px] text-pink-500">{femalePercent}% tổng số</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 2. Nhóm Độ Tuổi */}
                  <Card
                    title={<span className="font-bold text-slate-800 text-sm">Phân Bổ Độ Tuổi (Tại Ngày PV)</span>}
                    className="border-slate-200/80 shadow-sm rounded-xl"
                  >
                    {!(demographics.ages || []).length ? (
                      <Empty description="Chưa có dữ liệu độ tuổi" />
                    ) : (
                      <div className="space-y-3">
                        {(demographics.ages || []).map((age: any) => {
                          const count = age.count || 0;
                          const agePercent = demographics.people
                            ? Math.round((count / demographics.people) * 100)
                            : 0;

                          return (
                            <div key={age.name} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-700">{age.name}</span>
                                <span className="text-slate-500">
                                  <strong>{count}</strong> ({agePercent}%)
                                </span>
                              </div>
                              <Progress
                                percent={agePercent}
                                strokeColor={
                                  age.name === "18–24"
                                    ? "#10b981"
                                    : age.name === "25–34"
                                    ? "#3b82f6"
                                    : age.name === "35–44"
                                    ? "#8b5cf6"
                                    : "#f59e0b"
                                }
                                size="small"
                                showInfo={false}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* 3. Tỉnh Thành / Quê Quán */}
                  <Card
                    title={<span className="font-bold text-slate-800 text-sm">Quê Quán / Tỉnh Thành</span>}
                    className="border-slate-200/80 shadow-sm rounded-xl"
                  >
                    {!sortedProvinces.length ? (
                      <Empty description="Chưa có thông tin quê quán" />
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {sortedProvinces.slice(0, 8).map((p: any) => {
                          const count = p.count || 0;
                          const percent = Math.round((count / maxProvince) * 100);

                          return (
                            <div key={p.name} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-slate-700 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {p.name}
                                </span>
                                <span className="font-bold text-slate-800">{count} người</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className="h-full bg-indigo-500 rounded-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: "monthly-trend",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Xu Hướng Theo Tháng Tuyển
              </span>
            ),
            children: (
              <Card
                title={<span className="font-bold text-slate-800">Nhịp Tuyển Dụng Qua Các Tháng Phỏng Vấn</span>}
                className="border-slate-200/80 shadow-sm rounded-xl"
              >
                {!sortedMonths.length ? (
                  <Empty description="Chưa có dữ liệu tháng phỏng vấn" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedMonths.map((m) => {
                        const total = m.total || 0;
                        const mPassed = m.passed || 0;
                        const mWorking = m.working || 0;
                        const mRate = m.passRate ?? Math.round((mPassed / (total || 1)) * 100);

                        return (
                          <div
                            key={m.name}
                            className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                Tháng {m.name}
                              </span>
                              <Tag color={mRate >= 80 ? "green" : "orange"} className="font-bold">
                                {mRate}% Đỗ
                              </Tag>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-2 text-center border-y border-slate-200/60 my-2">
                              <div>
                                <span className="text-[11px] text-slate-500">Lượt tuyển</span>
                                <div className="text-base font-bold text-slate-900">{total}</div>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-500">Đỗ PV</span>
                                <div className="text-base font-bold text-emerald-600">{mPassed}</div>
                              </div>
                              <div>
                                <span className="text-[11px] text-slate-500">Đi làm</span>
                                <div className="text-base font-bold text-indigo-600">{mWorking}</div>
                              </div>
                            </div>

                            <div className="mt-2">
                              <Progress
                                percent={Math.round((total / maxMonthTotal) * 100)}
                                showInfo={false}
                                strokeColor="#10b981"
                                size="small"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: "rewards-financials",
            label: (
              <span className="flex items-center gap-2 font-medium">
                <Coins className="w-4 h-4 text-amber-600" />
                Tiến Độ & Dòng Tiền Thưởng
              </span>
            ),
            children: (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Đồng hồ giải ngân */}
                <Card
                  title={<span className="font-bold text-slate-800 text-sm">Tỷ Lệ Giải Ngân Tiền Thưởng</span>}
                  className="border-slate-200/80 shadow-sm rounded-xl text-center flex flex-col justify-between"
                >
                  <div className="py-4">
                    <Progress
                      type="dashboard"
                      percent={
                        rewardSummary.earned
                          ? Math.min(100, Math.round(((rewardSummary.paid || 0) / rewardSummary.earned) * 100))
                          : 0
                      }
                      strokeColor={{
                        "0%": "#10b981",
                        "100%": "#059669",
                      }}
                      size={180}
                      format={(percent) => (
                        <div>
                          <div className="text-2xl font-black text-slate-900">{percent}%</div>
                          <span className="text-xs text-slate-500 font-normal">Đã chi trả</span>
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-left text-xs">
                    <div>
                      <span className="text-slate-500 block">Đạt mốc:</span>
                      <strong className="text-purple-700 text-sm">{money(rewardSummary.earned)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Đã thanh toán:</span>
                      <strong className="text-emerald-700 text-sm">{money(rewardSummary.paid)}</strong>
                    </div>
                  </div>
                </Card>

                {/* 2. Thưởng theo công ty / nhà máy */}
                <Card
                  title={<span className="font-bold text-slate-800 text-sm">Tiến Độ Thưởng Theo Công Ty</span>}
                  className="border-slate-200/80 shadow-sm rounded-xl lg:col-span-2"
                >
                  {!rewardCompanies.length ? (
                    <Empty description="Chưa có dữ liệu thưởng theo công ty" />
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {rewardCompanies.map((comp: any) => {
                        const earned = comp.earned || 0;
                        const paid = comp.paid || 0;
                        const outstanding = comp.outstanding || 0;
                        const compRate = earned ? Math.round((paid / earned) * 100) : 0;

                        return (
                          <div
                            key={comp.name}
                            className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-slate-800 text-sm">{comp.name}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span>Đạt mốc: <strong className="text-purple-700">{money(earned)}</strong></span>
                                <span>Đã trả: <strong className="text-emerald-700">{money(paid)}</strong></span>
                                {outstanding > 0 && (
                                  <span>Còn nợ: <strong className="text-amber-700">{money(outstanding)}</strong></span>
                                )}
                              </div>
                            </div>
                            <Progress
                              percent={compRate}
                              size="small"
                              strokeColor={compRate >= 100 ? "#16a34a" : "#3b82f6"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
