'use client';
import React from 'react';
import { useIdentity } from '@/components/AuthGate';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Coins, CreditCard, FileSpreadsheet, Search, Building2, ShieldAlert } from 'lucide-react';
const navItems = [
    { href: '/', label: 'Dashboard BI', icon: LayoutDashboard },
    { href: '/workers', label: 'Hồ sơ Lao động (DS_TONG)', icon: Users },
    { href: '/bonuses', label: 'Quản lý Thưởng (DS_THUONG)', icon: Coins },
    { href: '/bank-accounts', label: 'Tài chính & STK 2026', icon: CreditCard },
    { href: '/duplicates', label: 'Cảnh báo Trùng lặp', icon: ShieldAlert },
    { href: '/excel-tools', label: 'Xử lý Excel Engine', icon: FileSpreadsheet },
    { href: '/policies', label: 'Chính sách thưởng', icon: Coins },
    { href: '/permissions', label: 'Phân quyền', icon: ShieldAlert },
    { href: '/audit', label: 'Lịch sử thay đổi', icon: FileSpreadsheet },
    { href: '/lookup', label: 'Tra cứu Người LĐ', icon: Search },
];
export default function Navigation() {
    const pathname = usePathname();
    const user = useIdentity();
    const visibleItems = user ? navItems : navItems.filter(i => i.href === '/lookup');
    return (<header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between min-h-16 gap-3 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5"/>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                L-Incentive v2.0
              </span>
              <p className="text-[11px] text-slate-500 font-medium">Hệ Thống Quản Trị Lao Động & Thưởng 2026</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (<Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}/>
                  {item.label}
                </Link>);
        })}
          </nav>

          <div className="flex items-center gap-2">
            {user ? <><span className="text-xs">{user.username} ({user.role})</span><button className="text-xs text-blue-700" onClick={async () => { const r = await fetch('/api/auth/logout', { method: 'POST' }); if (r.ok)
        window.location.assign('/login'); }}>Đăng xuất mọi phiên</button></> : <Link href="/login" className="text-sm text-blue-700">Đăng nhập</Link>}

          </div>
        </div>
      </div>
    </header>);
}
