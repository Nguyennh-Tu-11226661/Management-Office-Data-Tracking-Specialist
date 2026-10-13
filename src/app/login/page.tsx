'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Alert, message, Divider, Tag } from 'antd';
import { ShieldCheck, Zap, Lock, User, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();

  async function handleLogin(values: any) {
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const j = await r.json();
      if (j.success) {
        message.success('Đăng nhập thành công! Đang chuyển hướng...');
        window.location.assign('/');
      } else {
        message.error(j.message || 'Đăng nhập không thành công');
      }
    } catch {
      message.error('Không thể kết nối máy chủ');
    } finally {
      setBusy(false);
    }
  }

  // Đăng nhập nhanh 1-click bản demo
  const handleQuickDemoLogin = () => {
    form.setFieldsValue({
      username: 'admin',
      password: 'Demo@2026!',
    });
    handleLogin({
      username: 'admin',
      password: 'Demo@2026!',
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card
        className="w-full max-w-md shadow-xl border-slate-200 rounded-2xl overflow-hidden animate-fade-in"
        title={
          <div className="flex items-center gap-2 py-1">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Đăng nhập L-Incentive
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Hệ thống Quản trị & Quyết toán Tiền thưởng
              </p>
            </div>
          </div>
        }
      >
        {/* Nút đăng nhập nhanh 1-click */}
        <div className="mb-5">
          <Button
            type="primary"
            size="large"
            block
            loading={busy}
            onClick={handleQuickDemoLogin}
            className="bg-emerald-600 hover:bg-emerald-500 font-bold h-12 text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            Vào Xem Demo Ngay (1-Click)
          </Button>
          <p className="text-[11px] text-center text-slate-400 mt-1.5">
            Tự động đăng nhập với quyền Quản trị viên (ADMIN) để trải nghiệm
          </p>
        </div>

        <Divider plain className="text-xs text-slate-400 my-4">
          Hoặc đăng nhập bằng tài khoản
        </Divider>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{
            username: 'admin',
            password: 'Demo@2026!',
          }}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<User className="w-4 h-4 text-slate-400" />}
              autoComplete="username"
              maxLength={64}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<Lock className="w-4 h-4 text-slate-400" />}
              autoComplete="current-password"
              maxLength={128}
              size="large"
            />
          </Form.Item>

          <Button
            type="default"
            htmlType="submit"
            block
            size="large"
            loading={busy}
            className="font-semibold text-slate-700 mt-2"
          >
            Đăng nhập
          </Button>
        </Form>

        {/* Thông tin tài khoản Demo */}
        <div className="mt-5 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs space-y-1.5 text-slate-700">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Thông tin tài khoản Demo:
            </span>
            <Tag color="blue" className="text-[10px] font-semibold">ADMIN</Tag>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[11px]">
            <div>Tài khoản: <strong className="text-blue-700">admin</strong></div>
            <div>Mật khẩu: <strong className="text-blue-700">Demo@2026!</strong></div>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-blue-100">
            * Khi chính thức vận hành, bạn có thể đổi mật khẩu hoặc xóa tài khoản demo tại mục Phân quyền.
          </p>
        </div>
      </Card>
    </div>
  );
}
