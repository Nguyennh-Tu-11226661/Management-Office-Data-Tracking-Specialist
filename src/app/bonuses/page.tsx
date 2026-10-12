'use client';
import { useIdentity } from '@/components/AuthGate';
import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Card, Modal, Form, InputNumber, Input, message, Popconfirm, Space } from 'antd';
import { Coins, Download, CheckCircle, Lock, PlusCircle, FileCheck, Building, CreditCard } from 'lucide-react';
const MONTHS = [
    'T01.2026',
    'T02.2026',
    'T03.2026',
    'T04.2026',
    'T05.2026',
    'T06.2026',
    'T07.2026',
    'T08.2026',
    'T09.2026',
    'T10.2026',
    'T11.2026',
    'T12.2026',
];
const FACTORIES = [
    'Luxshare QC',
    'Canon',
    'Goertek',
    'Fushan',
    'Amphenol',
    'Foxconn',
    'Luxshare VT',
    'LG',
    'Bảo vệ',
];
export default function BonusesPage() {
    const user = useIdentity();
    const canWrite = user?.permissions.includes('bonus:write');
    const canApprove = user?.permissions.includes('bonus:approve');
    const [editing, setEditing] = useState<any>(null);
    const [policies, setPolicies] = useState<any[]>([]);
    const [bonuses, setBonuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('T01.2026');
    const [selectedCompany, setSelectedCompany] = useState('');
    // Modal thêm thưởng
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [workersList, setWorkersList] = useState<any[]>([]);
    const [addForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const fetchBonuses = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedMonth)
                params.append('month', selectedMonth);
            if (selectedCompany)
                params.append('company', selectedCompany);
            const res = await fetch(`/api/bonuses?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setBonuses(json.data);
            }
        }
        catch (err) {
            message.error('Lỗi tải danh sách thưởng');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchWorkers = async () => {
        try {
            const res = await fetch('/api/workers');
            const json = await res.json();
            if (json.success) {
                setWorkersList(json.data);
            }
        }
        catch (err) {
            console.error(err);
        }
    };
    useEffect(() => {
        fetchBonuses();
        fetchWorkers();
        fetch('/api/policies').then(r => r.json()).then(j => { if (j.success)
            setPolicies(j.data.filter((p: any) => p.isActive)); }).catch(() => message.error('Không thể tải chính sách'));
    }, [selectedMonth, selectedCompany]);
    // Duyệt thưởng
    const handleApprove = async (id: string, newStatus: string) => {
        if (!window.confirm(newStatus === 'LOCKED' ? 'Khóa sổ bản ghi này? Sau khi khóa không thể chuyển trạng thái lại.' : 'Xác nhận duyệt số tiền thưởng của bản ghi này?'))
            return;
        try {
            const res = await fetch('/api/bonuses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            const json = await res.json();
            if (json.success) {
                message.success(`Đã cập nhật trạng thái thưởng sang ${newStatus}`);
                fetchBonuses();
            }
            else {
                message.error(json.message || "Không thể cập nhật trạng thái");
            }
        }
        catch (err) {
            message.error('Lỗi phê duyệt');
        }
    };
    // Thêm thưởng mới
    const handleAddBonus = async (values: any) => {
        try {
            setSubmitting(true);
            const res = await fetch('/api/bonuses', {
                method: editing ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, id: editing?.id, updatedAt: editing?.updatedAt, assignmentId: workersList.find(w => w.id === values.workerId)?.assignments?.[0]?.id }),
            });
            const json = await res.json();
            if (json.success) {
                message.success('Đã tạo bản ghi thưởng thành công');
                setIsAddModalOpen(false);
                addForm.resetFields();
                fetchBonuses();
            }
            else {
                message.error(json.message);
            }
        }
        catch (err) {
            message.error('Lỗi tạo thưởng');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleExport = async () => {
        try {
            const res = await fetch(`/api/excel-engine/export?type=PAYMENT_BATCH&month=${encodeURIComponent(selectedMonth)}`);
            if (!res.ok) {
                const json = await res.json();
                message.error(json.message || 'Không thể xuất lệnh chi');
                return;
            }
            const url = URL.createObjectURL(await res.blob());
            const link = document.createElement('a');
            link.href = url;
            link.download = `LenhChi_${selectedMonth}.xlsx`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch {
            message.error('Lỗi xuất lệnh chi');
        }
    };
    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 50,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Công Ty / Nhà Máy',
            dataIndex: 'company',
            key: 'company',
            render: (text: string) => <span className="font-semibold text-slate-700">{text || 'N/A'}</span>,
        },
        {
            title: 'Tháng',
            dataIndex: 'month',
            key: 'month',
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'Họ và Tên',
            key: 'workerName',
            render: (_: any, record: any) => (<div>
          <div className="font-bold text-slate-900">{record.worker?.fullName}</div>
          <div className="text-[11px] text-slate-500 font-mono">CCCD: {record.worker?.idCard}</div>
        </div>),
        },
        {
            title: 'Tài Khoản Nhận',
            key: 'bank',
            render: (_: any, record: any) => {
                const bank = record.worker?.bankAccounts?.[0];
                if (!bank)
                    return <span className="text-xs text-rose-500 font-medium">Chưa có STK</span>;
                return (<div className="text-xs">
            <span className="font-mono font-bold text-slate-800">{bank.accountNumber}</span>
            <div className="text-[10px] text-slate-500">{bank.bankName} - {bank.accountHolderName}</div>
          </div>);
            },
        },
        {
            title: 'Thưởng 1 (3c)',
            dataIndex: 'bonus1',
            key: 'bonus1',
            align: 'right' as const,
            render: (v: number) => <span>{(v || 0).toLocaleString()} đ</span>,
        },
        {
            title: 'Thưởng 2 (7c)',
            dataIndex: 'bonus2',
            key: 'bonus2',
            align: 'right' as const,
            render: (v: number) => <span>{(v || 0).toLocaleString()} đ</span>,
        },
        {
            title: 'Thưởng 3 (15c)',
            dataIndex: 'bonus3',
            key: 'bonus3',
            align: 'right' as const,
            render: (v: number) => <span>{(v || 0).toLocaleString()} đ</span>,
        },
        {
            title: 'Thưởng 4 (30c)',
            dataIndex: 'bonus4',
            key: 'bonus4',
            align: 'right' as const,
            render: (v: number) => <span>{(v || 0).toLocaleString()} đ</span>,
        },
        {
            title: 'Tổng Thưởng',
            dataIndex: 'totalBonus',
            key: 'totalBonus',
            align: 'right' as const,
            render: (v: number) => (<span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          {(v || 0).toLocaleString('vi-VN')} đ
        </span>),
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                if (status === 'APPROVED')
                    return <Tag color="success">Đã Duyệt</Tag>;
                if (status === 'LOCKED')
                    return <Tag color="purple">Đã Khóa Sổ</Tag>;
                if (status === 'REVIEWED')
                    return <Tag color="blue">Đã rà soát (cũ)</Tag>;
                return <Tag color="warning">Dự Thảo</Tag>;
            },
        },
        {
            title: 'Thao Tác',
            key: 'actions',
            render: (_: any, record: any) => (<Space size="small">
          {canWrite && record.status === 'DRAFT' && <Button size="small" onClick={() => { setEditing(record); addForm.resetFields(); addForm.setFieldsValue({ ...record, bonus1: record.bonus1 ?? 0, bonus2: record.bonus2 ?? 0, bonus3: record.bonus3 ?? 0, bonus4: record.bonus4 ?? 0, bonus5: record.bonus5 ?? 0, bonus6: record.bonus6 ?? 0, bonus7: record.bonus7 ?? 0, policy: record.policy || '' }); setIsAddModalOpen(true); }}>Sửa dự thảo</Button>}
          {canApprove && ['DRAFT', 'REVIEWED'].includes(record.status) && (<Button size="small" type="primary" icon={<CheckCircle className="w-3.5 h-3.5"/>} onClick={() => handleApprove(record.id, 'APPROVED')}>
              Duyệt
            </Button>)}
          {canApprove && record.status === 'APPROVED' && (<Button size="small" type="dashed" icon={<Lock className="w-3.5 h-3.5"/>} onClick={() => handleApprove(record.id, 'LOCKED')}>
              Khóa
            </Button>)}
        </Space>),
        },
    ];
    const totalMonthAmount = bonuses.reduce((sum, b) => sum + (b.totalBonus || 0), 0);
    return (<div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản Lý Tiền Thưởng & Định Mức Công (`DS_THUONG`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận 7 khoản thưởng theo chính sách đã xác nhận; chưa tự tính từ ngày công. Duyệt và khóa sổ không xác nhận tiền đã chuyển.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span>
            <Button type="primary" onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-500" icon={<Download className="w-4 h-4"/>}>
              Xuất File Chi Ngân Hàng ({selectedMonth})
            </Button>
          </span>
          <Button disabled={!canWrite} icon={<PlusCircle className="w-4 h-4"/>} onClick={() => {
            setEditing(null);
            addForm.resetFields();
            setIsAddModalOpen(true);
        }}>
            Thêm Bản Ghi Thưởng
          </Button>
        </div>
      </div>

      {/* Filter & Summary Bar */}
      <Card className="shadow-sm border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Chọn Kỳ Tháng:</span>
            <Select value={selectedMonth} onChange={setSelectedMonth} className="w-36" options={MONTHS.map((m) => ({ label: m, value: m }))}/>
            <Select placeholder="Tất cả Nhà máy" allowClear value={selectedCompany || undefined} onChange={(v) => setSelectedCompany(v || '')} className="w-48" options={FACTORIES.map((f) => ({ label: f, value: f }))}/>
          </div>

          <div className="flex items-center gap-4 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
            <Coins className="w-5 h-5 text-amber-600"/>
            <div>
              <div className="text-[11px] text-amber-700 font-semibold uppercase">
                Tổng Tiền Thưởng Kỳ {selectedMonth}
              </div>
              <div className="text-lg font-black text-amber-800">
                {totalMonthAmount.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bonus Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <Table columns={columns} dataSource={bonuses} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} bordered size="middle"/>
      </Card>

      {/* Modal Thêm Thưởng */}
      <Modal title={editing ? "Sửa dự thảo thưởng" : "Thêm Bản Ghi Thưởng Mới"} open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} footer={null} width={650}>
        <Form form={addForm} layout="vertical" onFinish={handleAddBonus} initialValues={{
            month: selectedMonth,
            company: 'Luxshare QC',
            bonus1: 0, bonus2: 0, bonus3: 0, bonus4: 0, bonus5: 0, bonus6: 0, bonus7: 0,
        }} className="mt-4">
          <Form.Item name="workerId" label="Chọn Lao Động" rules={[{ required: true, message: 'Vui lòng chọn lao động' }]}>
            <Select disabled={!!editing} showSearch placeholder="Tìm theo họ tên hoặc số CCCD" optionFilterProp="label" options={workersList.map((w) => ({
            label: `${w.fullName} - CCCD: ${w.idCard} (${w.assignments?.[0]?.interviewFactory || 'N/A'})`,
            value: w.id,
        }))}/>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="month" label="Kỳ Tháng">
              <Select disabled={!!editing} options={MONTHS.map((m) => ({ label: m, value: m }))}/>
            </Form.Item>

            <Form.Item name="company" label="Nhà Máy / Công Ty">
              <Select disabled={!!editing} options={FACTORIES.map((f) => ({ label: f, value: f }))}/>
            </Form.Item>

            <Form.Item name="bonus1" label="Thưởng Lần 1 (3 công)">
              <InputNumber className="w-full" min={0} precision={0} step={50000}/>
            </Form.Item>

            <Form.Item name="bonus2" label="Thưởng Lần 2 (7 công)">
              <InputNumber className="w-full" min={0} precision={0} step={50000}/>
            </Form.Item>

            <Form.Item name="bonus3" label="Thưởng Lần 3 (15 công - tiền xe)">
              <InputNumber className="w-full" min={0} precision={0} step={50000}/>
            </Form.Item>

            <Form.Item name="bonus4" label="Thưởng Lần 4 (30 công)">
              <InputNumber className="w-full" min={0} precision={0} step={50000}/>
            </Form.Item>
            {[5, 6, 7].map(n => <Form.Item key={n} name={`bonus${n}`} label={`Thưởng lần ${n}`}><InputNumber className="w-full" min={0} precision={0} step={50000}/></Form.Item>)}
            <Form.Item name="policyId" label="Chọn chính sách tham chiếu"><Select allowClear options={policies.map(p => ({ value: p.id, label: `${p.name} (${p.factory})` }))} onChange={id => { const p = policies.find(p => p.id === id); if (p) {
        try {
            const rules = JSON.parse(p.rulesJson);
            addForm.setFieldsValue({ policy: p.name, company: p.factory });
            message.info('Đã chọn căn cứ. Chỉ nhập số tiền cho các mốc đã xác nhận đủ điều kiện.');
        }
        catch {
            message.error('Chính sách không hợp lệ');
        }
    } }}/></Form.Item><Form.Item name="policy" label="Căn cứ tính thưởng"><Input placeholder="Nhập chính sách đã xác nhận"/></Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Lưu Bản Ghi Thưởng
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);
}
