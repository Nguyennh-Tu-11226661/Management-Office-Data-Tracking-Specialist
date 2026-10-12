'use client';
import { useEffect, useState } from 'react';
import { Card, Table, Select, Input, Button, message } from 'antd';
export default function AuditPage() {
    const [rows, setRows] = useState<any[]>([]), [total, setTotal] = useState(0), [page, setPage] = useState(1), [module, setModule] = useState(''), [operator, setOperator] = useState(''), [busy, setBusy] = useState(false);
    async function load() { setBusy(true); try {
        const r = await fetch(`/api/audit?${new URLSearchParams({ page: String(page), module, operator })}`);
        const j = await r.json();
        if (j.success) {
            setRows(j.data);
            setTotal(j.total);
        }
        else
            message.error(j.message);
    }
    catch {
        message.error('Không thể tải lịch sử');
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => { load(); }, [page, module]);
    return <Card title="Lịch sử thay đổi"><div className="flex flex-wrap gap-3 mb-4"><Select className="w-48" value={module} onChange={v => { setModule(v); setPage(1); }} options={['', 'WORKER', 'BONUS', 'BANK', 'SYSTEM', 'AUTH'].map(v => ({ value: v, label: v || 'Tất cả phân hệ' }))}/><Input className="max-w-xs" value={operator} onChange={e => setOperator(e.target.value)} placeholder="Người thao tác" onPressEnter={load}/><Button onClick={load}>Lọc / làm mới</Button></div><Table rowKey="id" loading={busy} dataSource={rows} pagination={{ current: page, total, pageSize: 20, onChange: setPage }} columns={[{ title: 'Thời gian', dataIndex: 'createdAt', render: v => new Date(v).toLocaleString('vi-VN') }, { title: 'Người thao tác', dataIndex: 'operator' }, { title: 'Phân hệ', dataIndex: 'module' }, { title: 'Hành động', dataIndex: 'action' }, { title: 'Nội dung', dataIndex: 'details' }]} scroll={{ x: 800 }}/></Card>;
}
