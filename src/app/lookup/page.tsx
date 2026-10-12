'use client';
import React, { useState } from 'react';
import { Card, Input, Button, Form, message, Tag, Table } from 'antd';
import { Search, UserCheck, ShieldCheck, Building2, Coins, CreditCard } from 'lucide-react';
export default function LookupPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [form] = Form.useForm();
    const handleLookup = async (values: any) => {
        try {
            setLoading(true);
            setResult(null);
            const res = await fetch('/api/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const json = await res.json();
            if (json.success) {
                setResult(json.data);
            }
            else {
                message.error(json.message);
            }
        }
        catch (err) {
            message.error('Lỗi kết nối tra cứu');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-100 text-blue-600 mb-2">
          <Search className="w-8 h-8"/>
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Cổng Tra Cứu Trạng Thái & Tiền Thưởng Lao Động
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Tra cứu trạng thái nhận việc và thưởng đã duyệt. Hệ thống chưa ghi nhận ngày công hoặc xác nhận tiền đã chuyển.
        </p>
      </div>

      {/* Tra cứu Form */}
      <Card className="shadow-md border-slate-200 rounded-2xl">
        <Form form={form} layout="vertical" onFinish={handleLookup}>
          <Form.Item name="idCard" label="Số Thẻ Căn Cước Công Dân (CCCD)" rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
            <Input size="large" placeholder="Nhập 12 chữ số CCCD..."/>
          </Form.Item>

          <Form.Item name="lastPhone4" label="4 Số Cuối Điện Thoại Đăng Ký" rules={[
            { required: true, message: 'Vui lòng nhập 4 số cuối SĐT' },
            { pattern: /^\d{4}$/, message: 'Phải đúng 4 chữ số' },
        ]} extra="Đối chiếu thông tin hồ sơ; đây không phải xác thực bằng OTP.">
            <Input size="large" maxLength={4} placeholder="Ví dụ: 4567"/>
          </Form.Item>

          <Button type="primary" size="large" htmlType="submit" loading={loading} block className="mt-2 bg-blue-600 hover:bg-blue-500 font-bold">
            Tra Cứu Thông Tin Ngay
          </Button>
        </Form>
      </Card>

      {/* Kết Quả Tra Cứu */}
      {result && (<Card className="shadow-lg border-blue-200 bg-white rounded-2xl animate-fade-in">
          <div className="border-b pb-4 mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kết Quả Tra Cứu Hồ Sơ
            </span>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-xl font-bold text-slate-900">{result.fullName}</h2>
              <Tag color={result.assignment?.status === 'Đang làm việc' ? 'success' : 'processing'}>
                {result.assignment?.status || 'Đang xử lý'}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs mb-6">
            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400">Nhà máy làm việc</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600"/>
                {result.assignment?.workingFactory || result.assignment?.interviewFactory || 'Chưa ghi nhận'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl">
              <span className="text-slate-400">Kỳ nhận việc</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5">
                {result.assignment?.onboardingMonth || 'Chưa ghi nhận'}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl col-span-2">
              <span className="text-slate-400">Tài khoản nhận tiền thưởng</span>
              <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600"/>
                {result.bankAccount ? (<span>
                    {result.bankAccount.accountNumber} - {result.bankAccount.bankName}
                  </span>) : (<span className="text-rose-500">Chưa đăng ký số tài khoản</span>)}
              </div>
            </div>
          </div>

          {/* Các mốc thưởng */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500"/>
              Lịch Sử Định Mức Công & Chi Trả Thưởng
            </h4>

            {result.bonusRecords?.length > 0 ? (<div className="space-y-3">
                {result.bonusRecords.map((b: any) => (<div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-amber-50/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">Kỳ {b.month}</span>
                      <div className="text-[11px] text-slate-500">
                        Lần 1: {(b.bonus1 || 0).toLocaleString()}đ | Lần 2: {(b.bonus2 || 0).toLocaleString()}đ | Lần 3: {(b.bonus3 || 0).toLocaleString()}đ
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-emerald-700 text-sm">
                        {(b.totalBonus || 0).toLocaleString('vi-VN')} đ
                      </div>
                      <Tag color={b.status === 'APPROVED' ? 'success' : 'warning'}>
                        {b.status === 'LOCKED' ? 'Đã khóa sổ (chưa xác nhận chuyển tiền)' : 'Đã duyệt (chưa xác nhận chuyển tiền)'}
                      </Tag>
                    </div>
                  </div>))}
              </div>) : (<p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                Chưa có dữ liệu ghi nhận thưởng trong kỳ này
              </p>)}
          </div>
        </Card>)}
    </div>);
}
