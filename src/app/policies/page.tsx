'use client';
import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Switch, message, Tag } from 'antd';
import { useIdentity } from '@/components/AuthGate';
export default function PoliciesPage() {
    const user = useIdentity(), canWrite = user?.permissions.includes('bonus:write');
    const [rows, setRows] = useState<any[]>([]), [edit, setEdit] = useState<any>(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
    const [form] = Form.useForm();
    async function load() { const r = await fetch('/api/policies'), j = await r.json(); if (j.success)
        setRows(j.data);
    else
        message.error(j.message); }
    useEffect(() => { load().catch(() => message.error('Không thể tải chính sách')); }, []);
    function show(row: any) { setEdit(row); form.resetFields(); let rules = []; try {
        rules = JSON.parse(row?.rulesJson || '[]');
    }
    catch { } form.setFieldsValue({ ...row, isActive: row?.isActive ?? true, rules: Array.from({ length: 7 }, (_, i) => ({ step: i + 1, milestone: rules[i]?.milestone || '', amount: rules[i]?.amount || 0 })) }); setOpen(true); }
    async function save(values: any) { if (!window.confirm('Lưu chính sách này? Thưởng đã tạo sẽ giữ nguyên số tiền.'))
        return; setBusy(true); try {
        const r = await fetch('/api/policies', { method: edit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, id: edit?.id, updatedAt: edit?.updatedAt, rules: values.rules.map((x: any, i: number) => ({ ...x, step: i + 1 })) }) }), j = await r.json();
        if (j.success) {
            setOpen(false);
            await load();
        }
        else
            message.error(j.message);
    }
    catch {
        message.error('Không thể lưu');
    }
    finally {
        setBusy(false);
    } }
    return <Card title="Chính sách thưởng"><p className="mb-4">Cấu hình 7 mốc và số tiền. Chọn chính sách khi tạo dự thảo; chưa tự xác định mốc đủ điều kiện từ ngày công.</p><Button disabled={!canWrite} type="primary" onClick={() => show(null)}>Thêm chính sách</Button><Table className="mt-4" rowKey="id" dataSource={rows} columns={[{ title: 'Tên', dataIndex: 'name' }, { title: 'Nhà máy', dataIndex: 'factory' }, { title: 'Áp dụng', dataIndex: 'isActive', render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Đang dùng' : 'Ngừng dùng'}</Tag> }, { title: 'Thao tác', render: (_, r) => <Button disabled={!canWrite} onClick={() => show(r)}>Sửa</Button> }]}/><Modal title={edit ? 'Sửa chính sách' : 'Thêm chính sách'} open={open} onCancel={() => setOpen(false)} footer={null}><Form form={form} layout="vertical" onFinish={save}><Form.Item name="name" label="Tên chính sách" rules={[{ required: true }]}><Input maxLength={200}/></Form.Item><Form.Item name="factory" label="Nhà máy" rules={[{ required: true }]}><Input maxLength={200}/></Form.Item><Form.Item name="description" label="Ghi chú"><Input.TextArea /></Form.Item><Form.Item name="isActive" label="Áp dụng" valuePropName="checked"><Switch /></Form.Item>{Array.from({ length: 7 }, (_, i) => <div key={i} className="grid grid-cols-2 gap-3"><Form.Item name={['rules', i, 'milestone']} label={`Mốc ${i + 1}`} rules={[{ required: true }]}><Input maxLength={200}/></Form.Item><Form.Item name={['rules', i, 'amount']} label="Số tiền (VND)" rules={[{ required: true }]}><InputNumber min={0} precision={0} className="w-full"/></Form.Item></div>)}<Button type="primary" htmlType="submit" loading={busy}>Lưu chính sách</Button></Form></Modal></Card>;
}
