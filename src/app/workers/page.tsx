'use client';
import { useIdentity } from '@/components/AuthGate';
import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Modal, Form, message, Popconfirm, Badge, Card, Space } from 'antd';
import { UserPlus, Search, Download, Filter, AlertCircle, Edit3, Trash2, Building, CheckCircle2, XCircle, FileSpreadsheet } from 'lucide-react';
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
export default function WorkersPage() {
    const user = useIdentity();
    const canWrite = user?.permissions.includes('worker:write');
    const [rehire, setRehire] = useState(false);
    const [historyWorker, setHistoryWorker] = useState<any>(null);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [factoryFilter, setFactoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // Modal thêm mới
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    // Modal cập nhật nghỉ việc
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [statusForm] = Form.useForm();
    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search)
                params.append('search', search);
            if (factoryFilter)
                params.append('factory', factoryFilter);
            if (statusFilter)
                params.append('status', statusFilter);
            const res = await fetch(`/api/workers?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setWorkers(json.data);
            }
        }
        catch (err) {
            message.error('Lỗi tải danh sách hồ sơ');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchWorkers();
    }, [factoryFilter, statusFilter]);
    const handleSearch = () => {
        fetchWorkers();
    };
    // Xử lý thêm mới hồ sơ
    const handleAddWorker = async (values: any) => {
        try {
            setSubmitting(true);
            const res = await fetch('/api/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, rehire }),
            });
            const json = await res.json();
            if (json.success) {
                message.success('Đã thêm hồ sơ người lao động thành công!');
                setIsAddModalOpen(false);
                addForm.resetFields();
                fetchWorkers();
            }
            else {
                if (json.duplicateType === 'PHONE') {
                    Modal.confirm({ title: 'Xác nhận dùng chung SĐT sau khi xác minh', content: json.message, onOk: async () => {
                            const response = await fetch('/api/workers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, rehire, confirmPhoneDuplicate: true }) });
                            const result = await response.json();
                            if (!result.success) {
                                message.error(result.message);
                                throw new Error(result.message);
                            }
                            setIsAddModalOpen(false);
                            addForm.resetFields();
                            fetchWorkers();
                        } });
                }
                else if (json.isDuplicate) {
                    Modal.error({
                        title: 'CẢNH BÁO TRÙNG LẶP DỮ LIỆU',
                        content: json.message,
                        okText: 'Đã hiểu',
                    });
                }
                else {
                    message.error(json.message || 'Lỗi thêm hồ sơ');
                }
            }
        }
        catch (err: any) {
            message.error('Lỗi gửi dữ liệu lên máy chủ');
        }
        finally {
            setSubmitting(false);
        }
    };
    // Mở modal cập nhật trạng thái
    const handleOpenStatusModal = (worker: any) => {
        setSelectedWorker(worker);
        const assignment = worker.assignments[0];
        statusForm.resetFields();
        statusForm.setFieldsValue({
            ...worker,
            ...assignment,
            status: assignment?.status || 'Đang làm việc',
            leaveDate: assignment?.leaveDate || '',
            leaveReason: assignment?.leaveReason || '',
            workingFactory: assignment?.workingFactory || assignment?.interviewFactory,
        });
        setIsStatusModalOpen(true);
    };
    // Lưu cập nhật trạng thái
    const handleUpdateStatus = async (values: any) => {
        if (!selectedWorker)
            return;
        try {
            const res = await fetch(`/api/workers/${selectedWorker.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, assignmentId: selectedWorker.assignments[0]?.id, updatedAt: selectedWorker.updatedAt, assignmentUpdatedAt: selectedWorker.assignments[0]?.updatedAt }),
            });
            const json = await res.json();
            if (json.success) {
                message.success('Đã cập nhật trạng thái hồ sơ');
                setIsStatusModalOpen(false);
                fetchWorkers();
            }
            else {
                message.error(json.message);
            }
        }
        catch (err) {
            message.error('Lỗi cập nhật');
        }
    };
    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 60,
            align: 'center' as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'Họ và Tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text: string, record: any) => (<div>
          <span className="font-bold text-slate-800">{text}</span>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>{record.gender || 'N/A'}</span> • <span>{record.dob || 'N/A'}</span>
          </div>
        </div>),
        },
        {
            title: 'Số CCCD',
            dataIndex: 'idCard',
            key: 'idCard',
            render: (text: string) => (<span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {text}
        </span>),
        },
        {
            title: 'Số Điện Thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => <span className="text-xs font-medium text-slate-600">{text || 'N/A'}</span>,
        },
        {
            title: 'Nhà Máy PV',
            key: 'factory',
            render: (_: any, record: any) => {
                const a = record.assignments[0];
                return (<span className="font-medium text-slate-700 flex items-center gap-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400"/>
            {a?.interviewFactory || 'N/A'}
          </span>);
            },
        },
        {
            title: 'Tình Trạng (Còn LV / Nghỉ)',
            key: 'status',
            render: (_: any, record: any) => {
                const a = record.assignments[0];
                const status = a?.status || 'Chưa rõ';
                if (status === 'Đang làm việc') {
                    return <Tag color="success">Còn LV</Tag>;
                }
                if (status === 'Đã nghỉ việc') {
                    return (<div>
              <Tag color="error">Đã nghỉ việc</Tag>
              {a?.leaveDate && (<div className="text-[10px] text-rose-500 mt-0.5">Ngày NH: {a.leaveDate}</div>)}
            </div>);
                }
                if (status === 'Đạt phỏng vấn') {
                    return <Tag color="processing">Đạt PV</Tag>;
                }
                return <Tag color="default">{status}</Tag>;
            },
        },
        {
            title: 'Lý Do Nghỉ',
            key: 'leaveReason',
            render: (_: any, record: any) => {
                const a = record.assignments[0];
                return <span className="text-xs text-slate-500">{a?.leaveReason || '-'}</span>;
            },
        },
        {
            title: 'Ngày Đào Tạo',
            key: 'standardTrainingDate',
            render: (_: any, record: any) => {
                const a = record.assignments[0];
                return <span className="text-xs text-slate-600">{a?.standardTrainingDate || a?.interviewDate || '-'}</span>;
            },
        },
        {
            title: 'Tuyển Dụng (Recruiter)',
            dataIndex: 'recruiter',
            key: 'recruiter',
            render: (text: string) => <span className="text-xs font-semibold text-slate-700">{text || '-'}</span>,
        },
        {
            title: 'Thao Tác',
            key: 'actions',
            width: 230,
            render: (_: any, record: any) => (<Space size="small">
          <Button size="small" type="text" icon={<Edit3 className="w-3.5 h-3.5 text-blue-600"/>} disabled={!canWrite} onClick={() => handleOpenStatusModal(record)} title="Đổi trạng thái / Báo nghỉ việc"/>
          <Button size="small" onClick={() => setHistoryWorker(record)}>Lịch sử</Button>
          {record.assignments?.[0]?.status === 'Đã nghỉ việc' && <Button size="small" disabled={!canWrite} onClick={() => { setRehire(true); addForm.resetFields(); addForm.setFieldsValue({ ...record, status: 'Đang chờ phỏng vấn', interviewFactory: record.assignments[0]?.interviewFactory, workingFactory: '', onboardingMonth: '', interviewDate: '', standardTrainingDate: '' }); setIsAddModalOpen(true); }}>Tái tuyển</Button>}

        </Space>),
        },
    ];
    return (<div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hồ Sơ Lao Động Master Data (`DS_TONG`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý vòng đời nhân sự, chống trùng lặp CCCD/SĐT và phân loại Còn LV vs Đã nghỉ việc
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/excel-engine/export?type=WORKERS">
            <Button icon={<Download className="w-4 h-4"/>}>Xuất Excel DS_TONG</Button>
          </a>
          <Button type="primary" disabled={!canWrite} icon={<UserPlus className="w-4 h-4"/>} onClick={() => {
            setRehire(false);
            addForm.resetFields();
            setIsAddModalOpen(true);
        }}>
            Thêm Hồ Sơ Mới
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="Tìm theo Họ tên, CCCD, SĐT, Tuyển dụng..." prefix={<Search className="w-4 h-4 text-slate-400"/>} value={search} onChange={(e) => setSearch(e.target.value)} onPressEnter={handleSearch} allowClear/>
          <Select placeholder="Lọc theo Nhà máy phỏng vấn" allowClear value={factoryFilter || undefined} onChange={(val) => setFactoryFilter(val || '')} options={FACTORIES.map((f) => ({ label: f, value: f }))}/>
          <Select placeholder="Lọc theo Tình trạng" allowClear value={statusFilter || undefined} onChange={(val) => setStatusFilter(val || '')} options={[
            { label: 'Đang làm việc (Còn LV)', value: 'Đang làm việc' },
            { label: 'Đã nghỉ việc', value: 'Đã nghỉ việc' },
            { label: 'Đạt phỏng vấn', value: 'Đạt phỏng vấn' },
            { label: 'Đang chờ phỏng vấn', value: 'Đang chờ phỏng vấn' },
        ]}/>
          <Button type="default" onClick={handleSearch} icon={<Filter className="w-4 h-4"/>}>
            Áp Dụng Bộ Lọc
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <Table columns={columns} dataSource={workers} rowKey="id" loading={loading} pagination={{ pageSize: 10, showSizeChanger: true }} bordered size="middle"/>
      </Card>

      <Modal title={`Lịch sử tuyển dụng: ${historyWorker?.fullName || ''}`} open={!!historyWorker} onCancel={() => setHistoryWorker(null)} footer={null} width={800}>
        <Table rowKey="id" dataSource={historyWorker?.assignments || []} pagination={false} columns={[{ title: 'Ngày tạo đợt', dataIndex: 'createdAt', render: v => new Date(v).toLocaleString('vi-VN') }, { title: 'Nhà máy PV', dataIndex: 'interviewFactory' }, { title: 'Nhà máy làm việc', dataIndex: 'workingFactory' }, { title: 'Tình trạng', dataIndex: 'status' }, { title: 'Ngày nghỉ', dataIndex: 'leaveDate' }, { title: 'Lý do', dataIndex: 'leaveReason' }, { title: 'Tuyển dụng', dataIndex: 'recruiter' }]} scroll={{ x: 700 }}/>
      </Modal>
      {/* Modal Thêm Mới Hồ Sơ */}
      <Modal title={rehire ? "Tái tuyển dụng — giữ lịch sử hồ sơ" : "Thêm Mới Hồ Sơ Lao Động (DS_TONG)"} open={isAddModalOpen} onCancel={() => setIsAddModalOpen(false)} footer={null} width={700}>
        <Form form={addForm} layout="vertical" onFinish={handleAddWorker} initialValues={{
            interviewFactory: 'Luxshare QC',
            contractType: 'Thời vụ',
            status: 'Đang chờ phỏng vấn',
        }} className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item name="fullName" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập Họ và Tên' }]}>
              <Input placeholder="Nguyễn Văn A"/>
            </Form.Item>

            <Form.Item name="idCard" label="Số CCCD / CMT (Bắt buộc)" rules={[
            { required: true, message: 'Vui lòng nhập số CCCD' },
            { pattern: /^(\d{9}|\d{12})$/, message: 'CCCD 12 số hoặc CMT cũ 9 số' },
        ]} extra="Hệ thống tự động chặn trùng CCCD với toàn bộ dữ liệu cũ">
              <Input readOnly={rehire} placeholder="Nhập đầy đủ số căn cước"/>
            </Form.Item>

            <Form.Item name="phone" label="Số Điện Thoại">
              <Input placeholder="0987654321"/>
            </Form.Item>

            <Form.Item name="dob" label="Ngày Sinh">
              <Input placeholder="15/04/1998"/>
            </Form.Item>

            <Form.Item name="gender" label="Giới Tính">
              <Select options={[
            { label: 'Nam', value: 'Nam' },
            { label: 'Nữ', value: 'Nữ' },
        ]}/>
            </Form.Item>

            <Form.Item name="address" label="Địa Chỉ / Quê Quán">
              <Input placeholder="Diễn Châu, Nghệ An"/>
            </Form.Item>

            <Form.Item name="interviewFactory" label="Nhà Máy Phỏng Vấn">
              <Select options={FACTORIES.map((f) => ({ label: f, value: f }))}/>
            </Form.Item>

            <Form.Item name="status" label="Tình Trạng">
              <Select options={[
            { label: 'Đang làm việc (Còn LV)', value: 'Đang làm việc' },
            { label: 'Đạt phỏng vấn', value: 'Đạt phỏng vấn' },
            { label: 'Đang chờ phỏng vấn', value: 'Đang chờ phỏng vấn' },
            { label: 'Đã nghỉ việc', value: 'Đã nghỉ việc' },
        ]}/>
            </Form.Item>

            <Form.Item name="recruiter" label="Chuyên Viên Tuyển Dụng">
              <Input placeholder="Nguyễn Thu Trang"/>
            </Form.Item>

            <Form.Item name="source" label="Nguồn Tuyển Dụng">
              <Input placeholder="Facebook, Zalo, Tự do..."/>
            </Form.Item>

            <Form.Item name="standardTrainingDate" label="Ngày Đào Tạo Chuẩn">
              <Input placeholder="10/01/2026"/>
            </Form.Item>

            <Form.Item name="onboardingMonth" label="Tháng Nhận Việc">
              <Input placeholder="T10.2026"/>
            </Form.Item>
            {['code', 'idCardDate', 'idCardPlace', 'province', 'team', 'workingFactory', 'contractType', 'shuttleBusKtx', 'interviewDate', 'expectedTrainingDate', 'expectedTrainingStatus', 'leaveDate', 'leaveReason'].map((name) => <Form.Item key={name} name={name} label={({ code: 'Mã NV', idCardDate: 'Ngày cấp', idCardPlace: 'Nơi cấp', province: 'Tỉnh/Thành', team: 'Đội nhóm', workingFactory: 'Nhà máy làm việc', contractType: 'Loại hợp đồng', shuttleBusKtx: 'Đón xe / KTX', interviewDate: 'Ngày PV', expectedTrainingDate: 'Ngày đào tạo dự kiến', expectedTrainingStatus: 'Tình trạng đào tạo', leaveDate: 'Ngày nghỉ (nếu đã nghỉ)', leaveReason: 'Lý do nghỉ (nếu đã nghỉ)' } as Record<string, string>)[name]}><Input /></Form.Item>)}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Lưu Hồ Sơ
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Cập Nhật Trạng Thái & Báo Nghỉ Việc */}
      <Modal title={`Cập Nhật Trạng Thái: ${selectedWorker?.fullName}`} open={isStatusModalOpen} onCancel={() => setIsStatusModalOpen(false)} footer={null}>
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus} className="mt-4">
          <div className="grid grid-cols-2 gap-3">{Object.entries({ fullName: 'Họ tên', phone: 'SĐT', dob: 'Ngày sinh', gender: 'Giới tính', code: 'Mã NV', idCardDate: 'Ngày cấp', idCardPlace: 'Nơi cấp', address: 'Địa chỉ', province: 'Tỉnh/Thành', team: 'Đội nhóm', recruiter: 'Tuyển dụng', source: 'Nguồn', interviewFactory: 'Nhà máy PV', workingFactory: 'Nhà máy làm việc', contractType: 'Loại hợp đồng', shuttleBusKtx: 'Đón xe / KTX', interviewDate: 'Ngày PV', expectedTrainingDate: 'Ngày đào tạo dự kiến', expectedTrainingStatus: 'Tình trạng đào tạo dự kiến', standardTrainingDate: 'Ngày đào tạo chuẩn', onboardingMonth: 'Tháng nhận việc' }).map(([name, label]) => <Form.Item key={name} name={name} label={label}><Input /></Form.Item>)}</div>
          <Form.Item name="status" label="Tình Trạng Làm Việc">
            <Select options={[
            { label: 'Đang làm việc (Còn LV)', value: 'Đang làm việc' },
            { label: 'Đã nghỉ việc', value: 'Đã nghỉ việc' },
            { label: 'Đạt phỏng vấn', value: 'Đạt phỏng vấn' },
            { label: 'Đang chờ phỏng vấn', value: 'Đang chờ phỏng vấn' },
        ]}/>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
            {({ getFieldValue }) => getFieldValue('status') === 'Đã nghỉ việc' ? (<>
                  <Form.Item name="leaveDate" label="Ngày NH (Ngày Nghỉ Việc)" rules={[{ required: true, message: 'Vui lòng nhập Ngày nghỉ việc' }]} extra="Ghi nhận ngày làm việc cuối cùng tại xưởng">
                    <Input placeholder="VD: 25/01/2026"/>
                  </Form.Item>

                  <Form.Item name="leaveReason" label="Lý Do Nghỉ Việc" rules={[{ required: true, message: 'Vui lòng nhập lý do nghỉ việc' }]}>
                    <Select options={[
                { label: 'Việc gia đình', value: 'Việc gia đình' },
                { label: 'Lương thưởng không phù hợp', value: 'Lương thưởng không phù hợp' },
                { label: 'Sức khỏe không đảm bảo', value: 'Sức khỏe không đảm bảo' },
                { label: 'Vi phạm kỷ luật / Tự ý bỏ việc', value: 'Vi phạm kỷ luật' },
                { label: 'Hết hạn hợp đồng', value: 'Hết hạn hợp đồng' },
                { label: 'Khác', value: 'Khác' },
            ]}/>
                  </Form.Item>
                </>) : null}
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button onClick={() => setIsStatusModalOpen(false)}>Đóng</Button>
            <Button type="primary" htmlType="submit">
              Xác Nhận Cập Nhật
            </Button>
          </div>
        </Form>
      </Modal>
    </div>);
}
