'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Button, Card, message, Alert, Table, Tag, Select, Segmented } from 'antd';
import { FileSpreadsheet, UploadCloud, Download, CheckCircle2, AlertTriangle, Coins, CreditCard, Users, Sparkles } from 'lucide-react';

const { Dragger } = Upload;

export default function ExcelToolsPage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [profileId, setProfileId] = useState('');
    const [importMode, setImportMode] = useState<string>('AUTO');
    const [uploading, setUploading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetch('/api/catalogs?kind=IMPORT')
            .then(r => r.json())
            .then(j => setProfiles(j.data || []));
    }, []);

    const handleCustomUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            setUploading(true);
            setPendingFile(null);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('importType', importMode);
            if (profileId) formData.append('profileId', profileId);

            const res = await fetch('/api/excel-engine/import', {
                method: 'POST',
                body: formData,
            });
            const json = await res.json();
            if (json.success) {
                setResult(json);
                setPendingFile(file);
                message.info(`Đã kiểm tra file (${json.detectedTypeName || 'Excel'}); chưa ghi dữ liệu. Xem kết quả rồi xác nhận.`);
                onSuccess('ok');
            } else {
                message.error(json.message || 'Lỗi xử lý file Excel');
                onError(new Error(json.message));
            }
        } catch (err: any) {
            message.error('Lỗi tải file lên máy chủ');
            onError(err);
        } finally {
            setUploading(false);
        }
    };

    const commitImport = async () => {
        if (!pendingFile) return;

        const isBonus = result?.detectedType === 'DS_THUONG';
        const isBank = result?.detectedType === 'BANK_ACCOUNTS';
        const confirmText = isBonus
            ? 'Xác nhận nạp bảng thưởng vào CSDL? Tiền thưởng các lần 1 → 7 sẽ được ghi nhận cho người lao động.'
            : isBank
            ? 'Xác nhận nạp danh sách STK vào CSDL? Thông tin tài khoản và kết quả đối soát sẽ được cập nhật.'
            : 'Nhập các dòng hợp lệ vào CSDL? Dòng lỗi và lượt PV đã có sẽ được bỏ qua, không ghi đè.';

        if (!window.confirm(confirmText)) return;

        let confirmPhoneDuplicate = false;
        if (result?.warnings?.some((w: string) => w.includes('SĐT'))) {
            confirmPhoneDuplicate = window.confirm('Có SĐT trùng. Bạn đã xác minh và đồng ý nhập các dòng dùng chung số? Chọn Hủy để bỏ qua các dòng này.');
        }

        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', pendingFile);
            data.append('confirm', 'true');
            data.append('importType', result?.detectedType || importMode);
            data.append('confirmPhoneDuplicate', String(confirmPhoneDuplicate));
            if (profileId) data.append('profileId', profileId);
            if (result?.warnings?.some((w: string) => w.includes('CCCD đang làm'))) {
                data.append('confirmActiveDuplicate', String(window.confirm('Có CCCD đang làm/chưa đào tạo. Bạn đã xem lịch sử và đồng ý thêm đợt tuyển mới? Hủy để bỏ qua các dòng này.')));
            }

            const r = await fetch('/api/excel-engine/import', { method: 'POST', body: data });
            const j = await r.json();
            if (j.success) {
                setResult(j);
                setPendingFile(null);
                message.success(`Đã nạp thành công ${j.summary.successCount} dòng vào hệ thống!`);
            } else {
                message.error(j.message);
            }
        } catch {
            message.error('Không thể nhập file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Title */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-emerald-600"/>
                        Bộ Máy Xử Lý & Nạp Excel Đa Năng (Excel Engine)
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ tự động nhận diện và nạp cả 3 loại bảng: <b>Hồ sơ tổng (DS_TONG)</b>, <b>Bảng thưởng (DS_THUONG)</b>, và <b>Đối soát STK Ngân hàng</b>.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Sparkles className="w-3.5 h-3.5"/> Auto-Detect 3 Trong 1
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Khối Nhập File Excel Đa Năng */}
                <Card
                    title={
                        <span className="flex items-center gap-2 text-slate-800 font-bold">
                            <UploadCloud className="w-5 h-5 text-blue-600"/>
                            Nạp File Dữ Liệu Excel (.xlsx)
                        </span>
                    }
                    className="shadow-sm border-slate-200"
                >
                    {/* Chế độ chọn loại file */}
                    <div className="mb-4">
                        <div className="text-xs font-semibold text-slate-600 mb-1.5">Chọn chế độ phân loại file nạp:</div>
                        <Segmented
                            block
                            value={importMode}
                            onChange={(val) => {
                                setImportMode(String(val));
                                setPendingFile(null);
                                setResult(null);
                            }}
                            options={[
                                { label: 'Tự động nhận diện', value: 'AUTO', icon: <Sparkles className="w-3.5 h-3.5 inline mr-1 text-purple-600"/> },
                                { label: 'DS_TONG', value: 'DS_TONG', icon: <Users className="w-3.5 h-3.5 inline mr-1 text-blue-600"/> },
                                { label: 'DS_THUONG', value: 'DS_THUONG', icon: <Coins className="w-3.5 h-3.5 inline mr-1 text-amber-600"/> },
                                { label: 'STK Ngân Hàng', value: 'BANK_ACCOUNTS', icon: <CreditCard className="w-3.5 h-3.5 inline mr-1 text-emerald-600"/> },
                            ]}
                        />
                    </div>

                    {importMode === 'DS_TONG' && (
                        <Select
                            className="w-full mb-4"
                            allowClear
                            placeholder="Mẫu DS_TONG mặc định / chọn ánh xạ cột tùy chỉnh"
                            value={profileId || undefined}
                            onChange={v => {
                                setProfileId(v || '');
                                setPendingFile(null);
                                setResult(null);
                            }}
                            options={profiles.filter(p => p.isActive).map(p => ({ value: p.id, label: p.name }))}
                        />
                    )}

                    <Dragger
                        name="file"
                        multiple={false}
                        accept=".xlsx"
                        customRequest={handleCustomUpload}
                        showUploadList={false}
                        disabled={uploading}
                        className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400"
                    >
                        <p className="ant-upload-drag-icon flex justify-center mb-3">
                            <UploadCloud className="w-12 h-12 text-blue-500 animate-bounce"/>
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                            Nhấp hoặc kéo thả file Excel vào khu vực này
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Hệ thống tự động phát hiện: <b>DS_TONG</b>, <b>DS_THUONG</b>, hoặc <b>STK ngân hàng</b>. Tối đa 10 MB / 5.000 dòng.
                        </p>
                    </Dragger>

                    {/* Kết quả sau khi nạp */}
                    {result && (
                        <div className="mt-6 space-y-4">
                            {/* Huy hiệu nhận diện loại file */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <span>Loại file phát hiện:</span>
                                    <Tag
                                        color={
                                            result.detectedType === 'DS_THUONG'
                                                ? 'gold'
                                                : result.detectedType === 'BANK_ACCOUNTS'
                                                ? 'green'
                                                : 'blue'
                                        }
                                        className="font-bold text-xs px-2 py-0.5"
                                    >
                                        {result.detectedTypeName || result.detectedType}
                                    </Tag>
                                </div>
                                {result.sheetUsed && (
                                    <span className="text-[11px] text-slate-500">
                                        Sheet sử dụng: <b>{result.sheetUsed}</b>
                                    </span>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                <h4 className="font-bold text-emerald-800 flex items-center gap-2 text-sm mb-2">
                                    <CheckCircle2 className="w-4 h-4"/>
                                    Kết Quả Xử Lý Dữ Liệu
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                        <div className="text-xs text-slate-500">Tổng dòng</div>
                                        <div className="text-base font-bold text-slate-800">
                                            {result.summary?.totalRows}
                                        </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                        <div className="text-xs text-emerald-600">
                                            {result.preview ? 'Hợp lệ có thể nạp' : 'Đã nạp thành công'}
                                        </div>
                                        <div className="text-base font-bold text-emerald-700">
                                            {result.preview ? result.summary?.readyCount : result.summary?.successCount}
                                        </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-emerald-100">
                                        <div className="text-xs text-rose-600">Lỗi / Trùng</div>
                                        <div className="text-base font-bold text-rose-700">
                                            {result.summary?.errorCount || result.summary?.duplicateCount || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {result.preview && pendingFile && (
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    loading={uploading}
                                    onClick={commitImport}
                                    className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-md"
                                >
                                    Xác Nhận Nạp {result.summary?.readyCount} Dòng Hợp Lệ Vào CSDL
                                </Button>
                            )}

                            {result.warnings?.length > 0 && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message="Cảnh báo kiểm tra dữ liệu"
                                    description={
                                        <div className="max-h-28 overflow-y-auto space-y-1 text-xs">
                                            {result.warnings.slice(0, 10).map((w: string, i: number) => (
                                                <div key={i}>• {w}</div>
                                            ))}
                                            {result.warnings.length > 10 && (
                                                <div className="text-slate-500 italic">...và {result.warnings.length - 10} cảnh báo khác</div>
                                            )}
                                        </div>
                                    }
                                />
                            )}

                            {result.errors && result.errors.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
                                        Chi Tiết Các Dòng Lỗi / Không Hợp Lệ ({result.errors.length} dòng):
                                    </h5>
                                    <div className="max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                                        {result.errors.map((err: string, i: number) => (
                                            <div key={i} className="text-rose-600">
                                                • {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>

                {/* Tải File Mẫu Chuẩn & Xuất Dữ Liệu */}
                <Card title="Tải File Mẫu Chuẩn & Xuất Dữ Liệu" className="shadow-sm border-slate-200">
                    <div className="space-y-3.5">
                        {/* Form 1: DS_TONG */}
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                                    <FileSpreadsheet className="w-4 h-4 text-blue-600"/>
                                    1. Mẫu File DS_TONG (22 Cột Chuẩn & 4 Sheet)
                                </h4>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    Gồm 4 sheet: `DS_TONG`, `Tháng cũ`, `Cảnh báo trùng lặp`, `Link` (Cột A đến W).
                                </p>
                            </div>
                            <a href="/api/excel-engine/export?type=TEMPLATE_DS_TONG">
                                <Button type="primary" icon={<Download className="w-4 h-4"/>}>
                                    Tải Mẫu DS_TONG
                                </Button>
                            </a>
                        </div>

                        {/* Form 2: DS_THUONG */}
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-amber-600"/>
                                    2. Mẫu File DS_THUONG (Thưởng Lần 1 → 7)
                                </h4>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Gồm các sheet: `DS_THUONG`, `T01_2026`, `T02_2026`, `Link`, `Theo dõi thưởng`.
                                </p>
                            </div>
                            <a href="/api/excel-engine/export?type=TEMPLATE_DS_THUONG">
                                <Button className="bg-amber-600 hover:bg-amber-500 text-white font-semibold border-none" icon={<Download className="w-4 h-4"/>}>
                                    Tải Mẫu DS_THUONG
                                </Button>
                            </a>
                        </div>

                        {/* Form 3: STK Ngân Hàng */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-emerald-600"/>
                                    3. Mẫu File STK Ngân Hàng (Đối Soát Tài Khoản)
                                </h4>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    Gồm các tab: `STK ngân hàng 2026`, `T09.2026`, `T10.2026` kèm người check & kết quả.
                                </p>
                            </div>
                            <a href="/api/excel-engine/export?type=TEMPLATE_STK">
                                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border-none" icon={<Download className="w-4 h-4"/>}>
                                    Tải Mẫu STK
                                </Button>
                            </a>
                        </div>

                        {/* Xuất dữ liệu thực tế */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Xuất Toàn Bộ Dữ Liệu Hồ Sơ Thực Tế (`DS_TONG`)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Xuất tất cả hồ sơ hiện có theo đúng thứ tự 22 cột chuẩn của sheet `DS_TONG`
                                </p>
                            </div>
                            <a href="/api/excel-engine/export?type=WORKERS">
                                <Button icon={<FileSpreadsheet className="w-4 h-4"/>}>
                                    Xuất Dữ Liệu DS_TONG
                                </Button>
                            </a>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Danh Sách Cảnh Báo Trùng (`Cảnh báo trùng`)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mẫu: `CCCD, Họ và Tên, Nhà máy PV, Tình Trạng, Ngày PV, Loại Cảnh Báo`
                                </p>
                            </div>
                            <a href="/duplicates">
                                <Button danger icon={<Download className="w-4 h-4"/>}>
                                    Xem & Xuất Cảnh Báo Trùng
                                </Button>
                            </a>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
