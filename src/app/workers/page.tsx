'use client';
import {workerSourceColumns} from '@/lib/worker-source-view';
import AssignmentFields from '@/components/AssignmentFields';
import {STATUSES} from '@/lib/worker-validation';
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
    const [archived,setArchived]=useState(false);
    const [month,setMonth]=useState('');
    const [activeConfirm,setActiveConfirm]=useState(false);
    const [rehire, setRehire] = useState(false);
    const [historyWorker, setHistoryWorker] = useState<any>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [factoryFilter, setFactoryFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceOptions,setSourceOptions]=useState<Record<string,string[]>>({});
    const [sourceMonth,setSourceMonth]=useState(''),[recruiterFilter,setRecruiterFilter]=useState(''),[columnFilter,setColumnFilter]=useState(''),[columnValue,setColumnValue]=useState('');
    const [warningsOnly,setWarningsOnly]=useState(false);
    const [pendingDuplicateCount,setPendingDuplicateCount]=useState(0);
    const [unlinkedBonusRows,setUnlinkedBonusRows]=useState<any[]>([]);
    const [sourceTotals,setSourceTotals]=useState({totalRows:0,sourceRows:0,warningRows:0});
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
            const params = new URLSearchParams({archived:String(archived),month,sourceMonth,recruiter:recruiterFilter,column:columnFilter,columnValue,...(warningsOnly?{warningsOnly:'true'}:{})});
            if (search)
                params.append('search', search);
            if (factoryFilter)
                params.append('factory', factoryFilter);
            if (statusFilter)
                params.append('status', statusFilter);
            const res = await fetch(`/api/worker-source-rows?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setWorkers(json.data);setSourceOptions(json.options||{});setUnlinkedBonusRows(json.unlinkedBonusRows||[]);setPendingDuplicateCount(json.pendingDuplicateCount||0);setSourceTotals({totalRows:json.totalRows,sourceRows:json.sourceRows,warningRows:json.warningRows});
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
        setCurrentPage(1);
        fetchWorkers();
    }, [factoryFilter, statusFilter,archived,month,sourceMonth,recruiterFilter,warningsOnly]);
    const handleSearch = () => {
        setCurrentPage(1);
        fetchWorkers();
    };
    // Xử lý thêm mới hồ sơ
    const handleAddWorker = async (values: any) => {
        try {
            setSubmitting(true);
            const res = await fetch('/api/workers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...values, rehire,confirmActiveDuplicate:activeConfirm }),
            });
            const json = await res.json();
            if (json.success) {
                message.success('Đã thêm hồ sơ người lao động thành công!');
                setIsAddModalOpen(false);
                addForm.resetFields();
                fetchWorkers();
            }
            else {
                if (json.duplicateType === 'ACTIVE_LABOR') {
                    Modal.confirm({title:'CCCD đang làm/chưa đào tạo',content:json.message,onOk:async()=>{const response=await fetch('/api/workers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,rehire:true,confirmActiveDuplicate:true})});const result=await response.json();if(!result.success){message.error(result.message);throw new Error(result.message);}setIsAddModalOpen(false);fetchWorkers();}});
                } else if (json.duplicateType === 'PHONE') {
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

    const handleOpenHistory = async (record: any) => {
        try {
            setHistoryLoading(true);
            setHistoryWorker(record);
            const res = await fetch(`/api/worker-history?id=${record.id}`);
            const json = await res.json();
            if (json.success && json.data?.[0]) {
                setHistoryWorker(json.data[0]);
            }
        } catch {
            // Giữ record hiện tại
        } finally {
            setHistoryLoading(false);
        }
    };

    const columns = [
      ...workerSourceColumns.map(column=>({title:column,key:column,width:column==='Địa chỉ'?260:column==='Họ và tên'?190:150,render:(_:any,record:any,index:number)=>column==='STT'?String(record.sourceValues?.STT??((currentPage-1)*pageSize+index+1)):<span className="whitespace-pre-wrap">{String(record.sourceValues?.[column]??'')||'—'}</span>})),
      {title:'Cảnh báo dữ liệu / nguồn',key:'warnings',width:280,render:(_:any,r:any)=><div><Tag color={r.sourceWarnings?.length?'warning':'blue'}>{r.sourceWarnings?.length?'Cần kiểm tra':'Dữ liệu nguồn'}</Tag>{!!r.sourceDuplicates?.length&&<a href="/import-review?type=duplicates"><Tag color="red">Trùng lặp — xem luồng riêng</Tag></a>}<p className="text-xs text-slate-600">{r.sourceFile}{r.sourceRow?` · dòng ${r.sourceRow}`:''}</p>{(r.sourceWarnings||[]).map((w:string,i:number)=><p key={i} className="text-xs text-amber-800">{w}</p>)}</div>},
      {title:'Hồ sơ / lịch sử',key:'actions',width:200,render:(_:any,r:any)=>r.workerId?<a href={`/workers/${r.workerId}`} className="text-blue-600">Xem hồ sơ và thưởng theo đợt</a>:<span className="text-amber-800">Chưa liên kết hồ sơ; vẫn giữ dòng nguồn</span>},
    ];
    return (<div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hồ Sơ Lao Động Master Data (`DS_TONG`)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đối chiếu đủ 22 cột Excel, xem từng dòng nguồn và từng lượt tuyển. Dữ liệu chưa hợp lệ giữ nguyên kèm cảnh báo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-40" placeholder="Lọc theo tháng"/>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div><label className="block font-medium mb-2">Tìm trong toàn bộ cột</label><Input placeholder="Tên, CCCD, mã NV, SĐT, nội dung nguồn..." value={search} onChange={e=>setSearch(e.target.value)} onPressEnter={handleSearch} allowClear/></div>
          <div><label className="block font-medium mb-2">Nhà máy phỏng vấn</label><Select className="w-full" allowClear value={factoryFilter||undefined} onChange={v=>setFactoryFilter(v||'')} options={(sourceOptions['Nhà máy PV']||[]).map(value=>({value,label:value}))}/></div>
          <div><label className="block font-medium mb-2">Tình trạng trong Excel</label><Select className="w-full" allowClear value={statusFilter||undefined} onChange={v=>setStatusFilter(v||'')} options={(sourceOptions['Tình trạng']||[]).map(value=>({value,label:value}))}/></div>
          <div><label className="block font-medium mb-2">Tháng nhận việc trong Excel</label><Select className="w-full" allowClear value={sourceMonth||undefined} onChange={v=>setSourceMonth(v||'')} options={(sourceOptions['Tháng nhận việc']||[]).map(value=>({value,label:value}))}/></div>
          <div><label className="block font-medium mb-2">Tuyển dụng</label><Select className="w-full" allowClear value={recruiterFilter||undefined} onChange={v=>setRecruiterFilter(v||'')} options={(sourceOptions['Tuyển dụng']||[]).map(value=>({value,label:value}))}/></div>
          <div><label className="block font-medium mb-2">Lọc theo cột bất kỳ</label><Select className="w-full" allowClear value={columnFilter||undefined} onChange={v=>setColumnFilter(v||'')} options={workerSourceColumns.map(value=>({value,label:value}))}/></div>
          <div><label className="block font-medium mb-2">Giá trị chứa</label><Input value={columnValue} onChange={e=>setColumnValue(e.target.value)} onPressEnter={handleSearch} placeholder="Nhập nội dung cần lọc"/></div>
          <div className="flex flex-wrap gap-2 items-end"><Button onClick={handleSearch} icon={<Filter className="w-4 h-4"/>}>Áp dụng bộ lọc</Button><Button onClick={()=>setWarningsOnly(!warningsOnly)} type={warningsOnly?'primary':'default'}>Chỉ dòng cảnh báo</Button></div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4"><a className="text-amber-800" href="/import-review?type=warnings">Xem luồng cảnh báo</a><a className="text-rose-700" href="/import-review?type=duplicates">Danh sách trùng chờ kiểm tra ({pendingDuplicateCount})</a></div>
        <p className="text-sm text-slate-600 mt-4">{workers.length.toLocaleString('vi-VN')} dòng đang hiển thị / {sourceTotals.totalRows.toLocaleString('vi-VN')} dòng; {sourceTotals.sourceRows.toLocaleString('vi-VN')} dòng nguồn Excel, {sourceTotals.warningRows.toLocaleString('vi-VN')} dòng cảnh báo. Dòng cảnh báo vẫn hiển thị; dòng trùng nằm ở danh sách kiểm tra riêng.</p>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        {/* Thanh chuyển đổi tab DS_TONG và Tháng cũ giống Excel */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <Button
              type={!archived ? "primary" : "default"}
              onClick={() => { setArchived(false); setCurrentPage(1); }}
              className="font-bold text-xs"
            >
              📁 Tab `DS_TONG` (Hồ Sơ Hiện Hành)
            </Button>
            <Button
              type={archived ? "primary" : "default"}
              onClick={() => { setArchived(true); setCurrentPage(1); }}
              className="font-bold text-xs"
            >
              🗂️ Tab `Tháng Cũ` (Hồ Sơ Lưu Trữ)
            </Button>
            <a href="/duplicates">
              <Button type="default" danger className="font-semibold text-xs">
                ⚠️ Tab `Cảnh Báo Trùng Lặp`
              </Button>
            </a>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            * Bảng hiển thị đầy đủ <strong>22 cột dữ liệu</strong> chuẩn theo mẫu Excel DS_TONG (Cuộn ngang để xem hết các cột)
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={workers}
          rowKey="id"
          expandable={{expandedRowRender:(r:any)=><div className="p-3"><h3 className="font-semibold mb-2">Nội dung Thưởng.xlsx cùng CCCD · công ty · ngày PV</h3><p className="text-sm text-slate-600 mb-3">Giữ nguyên các ô nguồn; đây là đối chiếu dữ liệu, không tự xác minh điều kiện hay chứng từ chi trả.</p><Table<any> rowKey="id" pagination={false} size="small" scroll={{x:3200}} dataSource={r.rewardSource||[]} columns={['Công ty','Tháng','Ngày PV','Chính sách','Mã nhân viên','Họ tên','Số CCCD','STK','Ngân hàng',...Array.from({length:7},(_,i)=>`Thưởng lần ${i+1}`)].map(name=>({title:name,key:name,width:190,render:(_:any,b:any)=>String(b.values?.[name]??'')||'—'}))}/></div>}}
          loading={loading}
          scroll={{ x: 4200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100', '200'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showTotal: (total, range) => `${range[0]} - ${range[1]} / ${total} dòng nguồn / lượt tuyển`,
          }}
          bordered
          size="middle"
        />
      </Card>

      {!!unlinkedBonusRows.length&&<Card title={`Thưởng nguồn chưa liên kết hồ sơ (${unlinkedBonusRows.length} dòng)`}><p className="text-amber-800 mb-3">Các dòng này vẫn được giữ. Cần đối chiếu CCCD, công ty và ngày PV; không tự ghép sang hồ sơ khác.</p><Table<any> rowKey="id" dataSource={unlinkedBonusRows} pagination={{pageSize:10}} scroll={{x:3200}} columns={['Công ty','Tháng','Ngày PV','Chính sách','Mã nhân viên','Họ tên','Số CCCD','STK','Ngân hàng',...Array.from({length:7},(_,i)=>`Thưởng lần ${i+1}`)].map(name=>({title:name,key:name,width:190,render:(_:any,b:any)=>String(b.values?.[name]??'')||'—'}))}/></Card>}
      <Modal
        title={
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span className="text-base font-bold text-slate-900">
                Lịch sử làm việc đa công ty: {historyWorker?.fullName}
              </span>
            </div>
            <Tag color="blue" className="font-semibold text-xs">
              {historyWorker?.assignments?.length || 0} công ty từng làm
            </Tag>
          </div>
        }
        open={!!historyWorker}
        onCancel={() => setHistoryWorker(null)}
        footer={
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-500 font-mono">CCCD: {historyWorker?.idCard}</span>
            <div className="flex gap-2">
              <Button onClick={() => setHistoryWorker(null)}>Đóng</Button>
              <Button type="primary" href={`/workers/${historyWorker?.id}`}>
                Xem chi tiết hồ sơ & mốc thưởng →
              </Button>
            </div>
          </div>
        }
        width={950}
      >
        <div className="space-y-4 my-2">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex flex-wrap gap-4 text-slate-700">
            <span>Họ và tên: <strong className="text-slate-900">{historyWorker?.fullName}</strong></span>
            <span>CCCD: <strong className="font-mono text-blue-800">{historyWorker?.idCard}</strong></span>
            <span>SĐT: <strong className="font-mono text-slate-800">{historyWorker?.phone || '—'}</strong></span>
            <span>Quê quán: <strong className="text-slate-800">{historyWorker?.province || '—'}</strong></span>
          </div>

          <Table
            rowKey="id"
            loading={historyLoading}
            dataSource={historyWorker?.assignments || []}
            pagination={false}
            bordered
            size="middle"
            columns={[
              {
                title: 'STT',
                key: 'idx',
                width: 50,
                align: 'center' as const,
                render: (_: any, __: any, index: number) => (historyWorker?.assignments?.length || 0) - index,
              },
              {
                title: 'Công Ty / Nhà Máy',
                key: 'factory',
                render: (_: any, a: any) => (
                  <div>
                    <div className="font-bold text-slate-800">{a.workingFactory || a.interviewFactory}</div>
                    <div className="text-[11px] text-slate-400">Đơn hàng: {a.order?.name || 'Mặc định'}</div>
                  </div>
                ),
              },
              {
                title: 'Thời Gian Làm Việc',
                key: 'timeline',
                render: (_: any, a: any) => (
                  <div className="text-xs">
                    <div>PV/Bắt đầu: <strong className="text-slate-700">{a.startDate || a.passedDate || a.interviewDate || '—'}</strong></div>
                    {a.leaveDate && (
                      <div className="text-rose-600 font-medium">Nghỉ: {a.leaveDate}</div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Tình Trạng & Lý Do Nghỉ',
                key: 'status',
                render: (_: any, a: any) => (
                  <div>
                    <Tag color={a.status === 'Đang làm việc' ? 'success' : a.status === 'Đã nghỉ việc' ? 'error' : 'default'}>
                      {a.status}
                    </Tag>
                    {a.leaveReason && (
                      <div className="text-[11px] text-rose-600 mt-1">Lý do: {a.leaveReason}</div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Thưởng Đã Nhận',
                key: 'bonus',
                render: (_: any, a: any) => {
                  const pTotal = (a.enrollments || []).reduce((sum: number, e: any) =>
                    sum + (e.stages || []).reduce((sSum: number, s: any) =>
                      sSum + (s.payments || []).reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0)
                    , 0)
                  , 0);
                  const bTotal = (a.bonusRecords || []).reduce((sum: number, b: any) => sum + (b.totalBonus || 0), 0);
                  const total = pTotal > 0 ? pTotal : bTotal;
                  return total > 0 ? (
                    <span className="font-bold text-emerald-700 text-xs">
                      {total.toLocaleString('vi-VN')} đ
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  );
                },
              },
              {
                title: 'Tuyển Dụng',
                dataIndex: 'recruiter',
                key: 'recruiter',
                render: (text: string) => <span className="text-xs text-slate-600">{text || '—'}</span>,
              },
            ]}
          />
        </div>
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
              <Select options={STATUSES.map(value=>({value,label:value}))}/>
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

          <AssignmentFields form={addForm}/>
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
          <AssignmentFields form={statusForm} showWorkDays/>
          <div className="grid grid-cols-2 gap-3">{Object.entries({ fullName: 'Họ tên', phone: 'SĐT', dob: 'Ngày sinh', gender: 'Giới tính', code: 'Mã NV', idCardDate: 'Ngày cấp', idCardPlace: 'Nơi cấp', address: 'Địa chỉ', province: 'Tỉnh/Thành', team: 'Đội nhóm', recruiter: 'Tuyển dụng', source: 'Nguồn', interviewFactory: 'Nhà máy PV', workingFactory: 'Nhà máy làm việc', contractType: 'Loại hợp đồng', shuttleBusKtx: 'Đón xe / KTX', interviewDate: 'Ngày PV', expectedTrainingDate: 'Ngày đào tạo dự kiến', expectedTrainingStatus: 'Tình trạng đào tạo dự kiến', standardTrainingDate: 'Ngày đào tạo chuẩn', onboardingMonth: 'Tháng nhận việc' }).map(([name, label]) => <Form.Item key={name} name={name} label={label}><Input /></Form.Item>)}</div>
          <Form.Item name="status" label="Tình Trạng Làm Việc">
            <Select options={STATUSES.map(value=>({value,label:value}))}/>
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
