'use client';
import React, { useState } from 'react';
import { Upload, Button, Card, message, Alert, Progress, Table, Tag } from 'antd';
import { FileSpreadsheet, UploadCloud, Download, CheckCircle2, AlertTriangle, FileCheck2, FileDown } from 'lucide-react';
const { Dragger } = Upload;
export default function ExcelToolsPage() {
    const [uploading, setUploading] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [result, setResult] = useState<any>(null);
    const handleCustomUpload = async ({ file, onSuccess, onError }: any) => {
        try {
            setUploading(true);
            setPendingFile(null);
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/excel-engine/import', {
                method: 'POST',
                body: formData,
            });
            const json = await res.json();
            if (json.success) {
                setResult(json);
                setPendingFile(file);
                message.info('Đã kiểm tra file; chưa ghi dữ liệu. Xem kết quả rồi xác nhận nhập.');
                onSuccess('ok');
            }
            else {
                message.error(json.message || 'Lỗi xử lý file Excel');
                onError(new Error(json.message));
            }
        }
        catch (err: any) {
            message.error('Lỗi tải file lên máy chủ');
            onError(err);
        }
        finally {
            setUploading(false);
        }
    };
    const commitImport = async () => {
        if (!pendingFile)
            return;
        if (!window.confirm('Nhập các dòng hợp lệ vào CSDL? Dòng lỗi và CCCD đã có sẽ được bỏ qua, không ghi đè.'))
            return;
        let confirmPhoneDuplicate = false;
        if (result?.warnings?.length) {
            confirmPhoneDuplicate = window.confirm('Có SĐT trùng. Bạn đã xác minh và đồng ý nhập các dòng dùng chung số? Chọn Hủy để bỏ qua các dòng này.');
        }
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', pendingFile);
            data.append('confirm', 'true');
            data.append('confirmPhoneDuplicate', String(confirmPhoneDuplicate));
            const r = await fetch('/api/excel-engine/import', { method: 'POST', body: data }), j = await r.json();
            if (j.success) {
                setResult(j);
                setPendingFile(null);
                message.success(`Đã nhập ${j.summary.successCount} dòng`);
            }
            else
                message.error(j.message);
        }
        catch {
            message.error('Không thể nhập file');
        }
        finally {
            setUploading(false);
        }
    };
    return (<div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600"/>
          Bộ Máy Xử Lý & Đồng Bộ Excel (Excel Engine)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Nhập hồ sơ DS_TONG qua bước xem trước; xuất hồ sơ, cảnh báo trùng và kiểm tra điều kiện lệnh chi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nạp File Excel */}
        <Card title="Kiểm tra và nhập DS_TONG (.xlsx)" className="shadow-sm border-slate-200">
          <Dragger name="file" multiple={false} accept=".xlsx" customRequest={handleCustomUpload} showUploadList={false} disabled={uploading} className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400">
            <p className="ant-upload-drag-icon flex justify-center mb-3">
              <UploadCloud className="w-12 h-12 text-blue-500 animate-bounce"/>
            </p>
            <p className="text-sm font-bold text-slate-800">
              Nhấp hoặc kéo thả file Excel vào khu vực này
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Chỉ nhập sheet DS_TONG; CCCD và SĐT phải là Text. Tối đa 5 MB / 5.000 dòng.
            </p>
          </Dragger>

          <a href="/api/excel-engine/export?type=TEMPLATE"><Button className="mt-4">Tải file mẫu DS_TONG</Button></a>
          {result && (<div className="mt-6 space-y-4">
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
                    <div className="text-xs text-emerald-600">{result.preview ? 'Có thể nhập' : 'Thành công'}</div>
                    <div className="text-base font-bold text-emerald-700">
                      {result.preview ? result.summary?.readyCount : result.summary?.successCount}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <div className="text-xs text-rose-600">Trùng / Bỏ qua</div>
                    <div className="text-base font-bold text-rose-700">
                      {result.summary?.duplicateCount}
                    </div>
                  </div>
                </div>
              </div>

              {result.preview && pendingFile && <Button type="primary" loading={uploading} onClick={commitImport}>Xác nhận nhập các dòng hợp lệ</Button>}
              {result.warnings?.length > 0 && <Alert type="warning" message="Cảnh báo SĐT trùng" description={result.warnings.join(' — ')}/>}
              {result.errors && result.errors.length > 0 && (<div>
                  <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500"/>
                    Chi Tiết Các Dòng Cảnh Báo Trùng Lặp / Lỗi:
                  </h5>
                  <div className="max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    {result.errors.map((err: string, i: number) => (<div key={i} className="text-rose-600">
                        • {err}
                      </div>))}
                  </div>
                </div>)}
            </div>)}
        </Card>

        {/* Xuất File Excel Chuẩn */}
        <Card title="Xuất Báo Cáo & Tải File Mẫu" className="shadow-sm border-slate-200">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600"/>
                  File Mẫu Chuẩn 1.000 Lao Động (4 Sheet 2026)
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Gồm 4 sheet: `DS_TONG`, `DS_THUONG`, `STK ngân hàng 2026`, `Cảnh báo trùng`
                </p>
              </div>
              <a href="/Mau_Du_Lieu_1000_LaoDong_2026.xlsx" download="Mau_Du_Lieu_1000_LaoDong_2026.xlsx">
                <Button type="primary" icon={<Download className="w-4 h-4"/>}>
                  Tải File Mẫu 1.000 Người
                </Button>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">File Lệnh Chi Tiền Thưởng Ngân Hàng</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định dạng chuẩn để upload trực tiếp lên Internet Banking (VCB, MB, Techcombank...)
                </p>
              </div>
              <a href="/bonuses">
                <Button type="default" icon={<FileDown className="w-4 h-4"/>}>
                  Chọn kỳ và kiểm tra
                </Button>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Danh Sách Tổng Hợp Hồ Sơ (`DS_TONG`)</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xuất toàn bộ Master Data kèm tình trạng Còn LV, Ngày NH và lý do nghỉ
                </p>
              </div>
              <a href="/api/excel-engine/export?type=WORKERS">
                <Button icon={<FileSpreadsheet className="w-4 h-4"/>}>
                  Xuất DS_TONG
                </Button>
              </a>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Danh Sách Cảnh Báo Trùng (`Cảnh báo trùng`)</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mẫu: `CCCD, Họ và Tên, Nhà máy PV, Tình Trạng, Ngày PV`
                </p>
              </div>
              <a href="/duplicates">
                <Button danger icon={<Download className="w-4 h-4"/>}>
                  Xem & Xuất Trùng
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>);
}
