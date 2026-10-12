'use client';
import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Card, message, Alert } from 'antd';
import { ShieldAlert, Download, RefreshCw, UserCheck, AlertOctagon } from 'lucide-react';
import * as XLSX from 'xlsx';
export default function DuplicatesPage() {
    const [duplicates, setDuplicates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const fetchDuplicates = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/duplicates');
            const json = await res.json();
            if (json.success) {
                setDuplicates(json.data);
            }
        }
        catch (err) {
            message.error('Lỗi tải danh sách cảnh báo trùng');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDuplicates();
    }, []);
    // Xuất file Excel chuẩn đúng sheet Cảnh báo trùng của người dùng:
    // CCCD, Họ và Tên, Nhà máy PV, Tình Trạng, Ngày PV
    const handleExportExcel = async () => {
        try {
            const r = await fetch('/api/excel-engine/export?type=DUPLICATES');
            if (!r.ok) {
                const j = await r.json();
                message.error(j.message);
                return;
            }
            const url = URL.createObjectURL(await r.blob());
            const a = document.createElement('a');
            a.href = url;
            a.download = 'CanhBaoTrung.xlsx';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch {
            message.error('Không thể xuất cảnh báo');
        }
    };
    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 50,
            align: 'center' as const,
            render: (_: any, __: any, idx: number) => idx + 1,
        },
        {
            title: 'Số CCCD',
            dataIndex: 'idCard',
            key: 'idCard',
            render: (text: string) => (<span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {text}
        </span>),
        },
        {
            title: 'Họ và Tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string) => <span className="font-bold text-slate-800">{text}</span>,
        },
        {
            title: 'Số Điện Thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => <span className="font-medium text-slate-600">{text || '-'}</span>,
        },
        {
            title: 'Nhà Máy PV',
            dataIndex: 'factory',
            key: 'factory',
            render: (text: string) => <span className="font-semibold text-slate-700">{text}</span>,
        },
        {
            title: 'Tình Trạng',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                if (status === 'Đang làm việc')
                    return <Tag color="success">Còn LV</Tag>;
                if (status === 'Đã nghỉ việc')
                    return <Tag color="error">Đã nghỉ việc</Tag>;
                return <Tag color="default">{status}</Tag>;
            },
        },
        {
            title: 'Ngày PV',
            dataIndex: 'interviewDate',
            key: 'interviewDate',
            render: (text: string) => <span className="text-xs text-slate-600">{text || '-'}</span>,
        },
        {
            title: 'Loại Cảnh Báo',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
                if (type.includes('TRÙNG SĐT')) {
                    return (<Tag color="volcano" icon={<AlertOctagon className="w-3 h-3 inline mr-1"/>}>
              TRÙNG SĐT
            </Tag>);
                }
                return (<Tag color="cyan" icon={<UserCheck className="w-3 h-3 inline mr-1"/>}>
            LAO ĐỘNG QUAY LẠI (RE-HIRE)
          </Tag>);
            },
        },
        {
            title: 'Chi Tiết Cảnh Báo',
            dataIndex: 'warning',
            key: 'warning',
            render: (text: string) => <span className="text-xs text-rose-600 font-medium">{text}</span>,
        },
        {
            title: 'Tuyển Dụng',
            dataIndex: 'recruiter',
            key: 'recruiter',
            render: (text: string) => <span className="text-xs font-semibold text-slate-700">{text}</span>,
        },
    ];
    return (<div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600"/>
            Bộ Lọc & Cảnh Báo Trùng Lặp (Sheet `Cảnh báo trùng`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            CCCD trùng bị chặn khi nhập. Màn hình liệt kê SĐT dùng chung và lịch sử tái tuyển dụng.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<RefreshCw className="w-4 h-4"/>} onClick={fetchDuplicates}>
            Quét Lại
          </Button>
          <Button type="primary" danger icon={<Download className="w-4 h-4"/>} onClick={handleExportExcel}>
            Xuất File Excel Cảnh Báo Trùng
          </Button>
        </div>
      </div>

      <Alert message="Cơ chế Chặn Trùng Lặp 3 Tầng Thông Minh" description="1. Trùng cứng CCCD: Hệ thống chặn ngay khi thêm mới hồ sơ. 2. Trùng SĐT: Gắn cờ cảnh báo để xác minh danh tính. 3. Lao động tái tuyển dụng (Re-hire): Hệ thống tự động phân loại lao động quay lại thay vì báo trùng lỗi." type="info" showIcon className="border-blue-200 bg-blue-50/50"/>

      {/* Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <Table columns={columns} dataSource={duplicates} rowKey={(r) => `${r.idCard}-${r.factory}-${r.type}`} loading={loading} pagination={{ pageSize: 10 }} bordered size="middle"/>
      </Card>
    </div>);
}
