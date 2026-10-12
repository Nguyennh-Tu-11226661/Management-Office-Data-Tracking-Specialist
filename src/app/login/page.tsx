'use client';
import { useState } from 'react';
import { Card, Form, Input, Button, Alert, message } from 'antd';
export default function LoginPage() {
    const [busy, setBusy] = useState(false);
    async function login(values: any) { setBusy(true); try {
        const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        const j = await r.json();
        if (j.success)
            window.location.assign('/');
        else
            message.error(j.message);
    }
    catch {
        message.error('Không thể kết nối');
    }
    finally {
        setBusy(false);
    } }
    return <Card title="Đăng nhập L-Incentive" className="max-w-md mx-auto"><Form layout="vertical" onFinish={login}>
 <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}><Input autoComplete="username" maxLength={64}/></Form.Item>
 <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}><Input.Password autoComplete="current-password" maxLength={128}/></Form.Item>
 <Button type="primary" htmlType="submit" block loading={busy}>Đăng nhập</Button></Form>
 <Alert className="mt-4" type="info" message="Chưa có tài khoản?" description="Quản trị viên tạo tài khoản đầu tiên trên máy bằng npm run auth:setup. Không có mật khẩu mặc định."/>
 </Card>;
}
