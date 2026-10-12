import type { Metadata } from 'next';
import './globals.css';
import AntdRegistry from '@/components/AntdRegistry';
import AuthGate from '@/components/AuthGate';
import Navigation from '@/components/Navigation';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
export const metadata: Metadata = {
    title: 'L-Incentive v2.0 - Quản Trị Lao Động & Định Mức Thưởng 2026',
    description: 'Hệ thống Quản Trị Lao Động, Định Mức Công, Xác Thực STK & Chi Trả Thưởng',
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <AntdRegistry>
          <ConfigProvider locale={viVN} theme={{
            token: {
                colorPrimary: '#2563eb',
                borderRadius: 8,
                fontFamily: 'inherit',
            },
        }}>
            <AuthGate><Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main></AuthGate>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>);
}
