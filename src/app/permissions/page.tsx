'use client';
import { Card, Table, Alert, Button, Modal, Form, Input, Select, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import { useIdentity } from '@/components/AuthGate';
const rows = [{ role: 'ADMIN', name: 'Quản trị', workers: 'Có', bank: 'Có', bonuses: 'Có', approve: 'Có', export: 'Có', audit: 'Có' }, { role: 'HR', name: 'Nhân sự', workers: 'Có', bank: 'Không', bonuses: 'Không', approve: 'Không', export: 'Hồ sơ / cảnh báo', audit: 'Không' }, { role: 'FINANCE', name: 'Tài chính', workers: 'Không', bank: 'Có', bonuses: 'Có', approve: 'Có', export: 'Có', audit: 'Không' }, { role: 'VIEWER', name: 'Chỉ xem', workers: 'Không', bank: 'Không', bonuses: 'Không', approve: 'Không', export: 'Không', audit: 'Không' }];
export default function PermissionsPage() {
    const user = useIdentity();
    const [users, setUsers] = useState<any[]>([]), [open, setOpen] = useState(false), [selected, setSelected] = useState<any>(null), [busy, setBusy] = useState(false);
    const [form] = Form.useForm();
    async function load() { const r = await fetch('/api/users'), j = await r.json(); if (j.success)
        setUsers(j.data);
    else
        message.error(j.message); }
    useEffect(() => { if (user?.role === 'ADMIN')
        load().catch(() => message.error('Không thể tải tài khoản')); }, [user?.role]);
    function show(row: any) { setSelected(row); form.resetFields(); form.setFieldsValue(row || { role: 'VIEWER', isActive: true }); setOpen(true); }
    async function save(values: any) { if (!window.confirm('Lưu tài khoản và quyền này? Các phiên cũ của tài khoản được cập nhật sẽ hết hiệu lực.'))
        return; setBusy(true); try {
        const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, password: values.password || undefined, mode: selected ? 'update' : 'create' }) }), j = await r.json();
        if (j.success) {
            setOpen(false);
            if (values.username === user?.username)
                window.location.assign('/login');
            else
                await load();
        }
        else
            message.error(j.message);
    }
    catch {
        message.error('Không thể lưu tài khoản');
    }
    finally {
        setBusy(false);
    } }
    return <Card title="Phân quyền"><Alert type="info" message={`Tài khoản: ${user?.username || ''} — Vai trò: ${user?.role || ''}`} description="Mọi vai trò đã đăng nhập có quyền đọc nội bộ. ADMIN tạo thêm, đổi quyền hoặc tạm khóa tài khoản ngay trên màn hình này. API kiểm tra quyền độc lập với giao diện." className="mb-4"/><Table pagination={false} rowKey="role" dataSource={rows} scroll={{ x: 800 }} columns={[{ title: 'Vai trò', dataIndex: 'name' }, { title: 'Sửa hồ sơ', dataIndex: 'workers' }, { title: 'Sửa ngân hàng', dataIndex: 'bank' }, { title: 'Tạo thưởng', dataIndex: 'bonuses' }, { title: 'Duyệt / khóa', dataIndex: 'approve' }, { title: 'Xuất Excel', dataIndex: 'export' }, { title: 'Lịch sử', dataIndex: 'audit' }]}/>{user?.role === 'ADMIN' && <div className="mt-6"><Button type="primary" onClick={() => show(null)}>Tạo tài khoản</Button><Table className="mt-3" rowKey="username" dataSource={users} pagination={false} columns={[{ title: 'Tên đăng nhập', dataIndex: 'username' }, { title: 'Vai trò', dataIndex: 'role' }, { title: 'Trạng thái', dataIndex: 'isActive', render: v => v ? 'Hoạt động' : 'Tạm khóa' }, { title: 'Thao tác', render: (_, r) => <Button onClick={() => show(r)}>Đổi quyền / mật khẩu</Button> }]}/></div>}
 <Modal title={selected ? 'Cập nhật tài khoản' : 'Tạo tài khoản'} open={open} onCancel={() => setOpen(false)} footer={null}><Form form={form} layout="vertical" onFinish={save}><Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }, { pattern: /^[a-zA-Z0-9_.-]{3,64}$/ }]}><Input readOnly={!!selected} autoComplete="off"/></Form.Item><Form.Item name="role" label="Vai trò" rules={[{ required: true }]}><Select options={['ADMIN', 'HR', 'FINANCE', 'VIEWER'].map(v => ({ value: v, label: v }))}/></Form.Item><Form.Item name="isActive" label="Cho phép đăng nhập" valuePropName="checked"><Switch /></Form.Item><Form.Item name="password" label={selected ? 'Mật khẩu mới (để trống để giữ nguyên)' : 'Mật khẩu'} rules={selected ? [] : [{ required: true }, { min: 12 }]}><Input.Password autoComplete="new-password" maxLength={128}/></Form.Item><Button type="primary" htmlType="submit" loading={busy}>Lưu</Button></Form></Modal>
 <p className="mt-4 text-slate-500">Quyền trong phiên hiện tại: {user?.permissions.join(', ')}</p></Card>;
}
