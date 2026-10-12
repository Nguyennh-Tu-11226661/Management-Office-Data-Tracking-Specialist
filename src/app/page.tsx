'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserCheck, UserX, TrendingUp, Coins, AlertTriangle, Building2, FileSpreadsheet, Download, PlusCircle, RefreshCw } from 'lucide-react';
import { Table, Tag, Progress, Button, message, Spin } from 'antd';
export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard');
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
            else {
                message.error('Không thể tải dữ liệu dashboard: ' + json.message);
            }
        }
        catch (err: any) {
            message.error('Lỗi kết nối máy chủ');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const matrixColumns = [
        {
            title: 'Nhà Máy Tiếp Nhận',
            dataIndex: 'factory',
            key: 'factory',
            render: (text: string) => (<span className="font-semibold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600"/>
          {text}
        </span>),
        },
        {
            title: 'Tổng Hồ Sơ',
            dataIndex: 'total',
            key: 'total',
            align: 'center' as const,
            sorter: (a: any, b: any) => a.total - b.total,
            render: (val: number) => <span className="font-bold text-slate-700">{val}</span>,
        },
        {
            title: 'Đang Làm Việc (Còn LV)',
            dataIndex: 'working',
            key: 'working',
            align: 'center' as const,
            render: (val: number) => (<Tag color="success" className="font-semibold">
          {val} người
        </Tag>),
        },
        {
            title: 'Đã Nghỉ Việc',
            dataIndex: 'resigned',
            key: 'resigned',
            align: 'center' as const,
            render: (val: number) => (<Tag color="error" className="font-semibold">
          {val} người
        </Tag>),
        },
        {
            title: 'Đạt Phỏng Vấn',
            dataIndex: 'passed',
            key: 'passed',
            align: 'center' as const,
            render: (val: number) => (<Tag color="processing" className="font-semibold">
          {val} người
        </Tag>),
        },
        {
            title: 'Tỷ Lệ Đang Làm Việc',
            dataIndex: 'retention',
            key: 'retention',
            render: (val: number) => (<div className="flex items-center gap-3">
          <Progress percent={val} size="small" status={val >= 70 ? 'success' : val >= 40 ? 'normal' : 'exception'} className="w-28 mb-0"/>
          <span className="text-xs font-bold text-slate-600">{val}%</span>
        </div>),
        },
    ];
    if (loading && !data) {
        return (<div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spin size="large"/>
        <p className="text-sm text-slate-500">Đang tổng hợp số liệu ma trận 9 nhà máy...</p>
      </div>);
    }
    const s = data?.summary || {
        totalWorkers: 0,
        workingCount: 0,
        resignedCount: 0,
        retentionRate: 0,
        totalBonusAmount: 0,
        bankMismatches: 0,
    };
    return (<div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Báo Cáo Quản Trị & Dashboard BI 2026
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi thời gian thực tình hình lao động, tiến độ đơn hàng và ngân sách chi trả thưởng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4"/>} onClick={fetchDashboardData} loading={loading}>
            Làm mới
          </Button>
          <Link href="/excel-tools">
            <Button type="primary" icon={<FileSpreadsheet className="w-4 h-4"/>}>
              Nạp / Xuất Excel
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Hồ Sơ</span>
            <Users className="w-4 h-4 text-blue-600"/>
          </div>
          <div className="text-2xl font-black text-slate-900">{s.totalWorkers}</div>
          <p className="text-[11px] text-slate-400 mt-1">Ứng viên đã ghi nhận</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang Làm Việc</span>
            <UserCheck className="w-4 h-4 text-emerald-600"/>
          </div>
          <div className="text-2xl font-black text-emerald-700">{s.workingCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Còn LV tại nhà máy</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã Nghỉ Việc</span>
            <UserX className="w-4 h-4 text-rose-600"/>
          </div>
          <div className="text-2xl font-black text-rose-700">{s.resignedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">Đã chốt Ngày NH</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-100 bg-indigo-50/20 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Giữ Chân</span>
            <TrendingUp className="w-4 h-4 text-indigo-600"/>
          </div>
          <div className="text-2xl font-black text-indigo-700">{s.retentionRate}%</div>
          <p className="text-[11px] text-indigo-600 font-medium mt-1">Tỷ lệ Retention</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ngân Sách Thưởng</span>
            <Coins className="w-4 h-4 text-amber-600"/>
          </div>
          <div className="text-xl font-black text-amber-700">
            {(s.totalBonusAmount || 0).toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Thưởng 7 mốc công</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-100 bg-orange-50/20 shadow-sm">
          <div className="flex items-center justify-between text-orange-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cảnh Báo STK</span>
            <AlertTriangle className="w-4 h-4 text-orange-600"/>
          </div>
          <div className="text-2xl font-black text-orange-700">{s.bankMismatches}</div>
          <p className="text-[11px] text-orange-600 font-medium mt-1">Lệch tên thẻ CCCD</p>
        </div>
      </div>

      {/* Main Section: Ma trận 9 Nhà Máy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ma Trận Tuyển Dụng & Giữ Chân Lao Động (9 Nhà Máy 2026)
            </h2>
            <p className="text-xs text-slate-500">
              Đối soát tình trạng tuyển dụng thực tế theo Luxshare QC, Canon, Goertek, Fushan, Amphenol, Foxconn, Luxshare VT, LG, Bảo vệ
            </p>
          </div>
          <Link href="/api/excel-engine/export?type=WORKERS">
            <Button size="small" icon={<Download className="w-3.5 h-3.5"/>}>
              Xuất File DS_TONG
            </Button>
          </Link>
        </div>

        <Table columns={matrixColumns} dataSource={data?.matrix || []} rowKey="factory" pagination={false} bordered size="middle"/>
      </div>

      {/* Bottom Grid: Recruiter KPI & Nguồn lao động */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruiter Leaderboard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Bảng Xếp Hạng Hiệu Suất Tuyển Dụng (Recruiter KPI)</span>
            <span className="text-xs font-normal text-slate-500">Đo lường sản lượng & chất lượng</span>
          </h3>
          <div className="space-y-4">
            {(data?.recruiters || []).map((r: any, idx: number) => (<div key={r.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{r.name}</h4>
                    <p className="text-xs text-slate-500">
                      Tuyển: <span className="font-semibold text-slate-700">{r.total}</span> | Còn làm: <span className="font-semibold text-emerald-600">{r.working}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-600">{r.retention}% giữ chân</span>
                </div>
              </div>))}
          </div>
        </div>

        {/* Nguồn Quê Quán */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
            <span>Phân Bố Nguồn Lao Động Theo Tỉnh Thành</span>
            <span className="text-xs font-normal text-slate-500">Bản đồ nguồn cung ứng</span>
          </h3>
          <div className="space-y-3">
            {(data?.provinces || []).map((p: any) => (<div key={p.province} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{p.province}</span>
                  <span className="font-bold">{p.count} người ({Math.round((p.count / (s.totalWorkers || 1)) * 100)}%)</span>
                </div>
                <Progress percent={Math.round((p.count / (s.totalWorkers || 1)) * 100)} showInfo={false} strokeColor="#3b82f6" size="small"/>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
