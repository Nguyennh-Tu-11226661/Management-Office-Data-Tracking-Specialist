'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Spin } from 'antd';
type User = {
    username: string;
    role: string;
    permissions: string[];
};
const AuthContext = createContext<User | null>(null);
export const useIdentity = () => useContext(AuthContext);
export default function AuthGate({ children }: {
    children: React.ReactNode;
}) {
    const path = usePathname(), router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    const publicPage = path === '/login' || path === '/lookup';
    useEffect(() => {
        let active = true;
        setReady(false);
        fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.json()).then(j => {
            if (!active)
                return;
            setUser(j.success ? j.data : null);
            setReady(true);
            if (!j.success && !publicPage)
                router.replace('/login');
        }).catch(() => { if (active) {
            setUser(null);
            setReady(true);
            if (!publicPage)
                router.replace('/login');
        } });
        return () => { active = false; };
    }, [path, publicPage, router]);
    if (!publicPage && (!ready || !user))
        return <div className="p-12 text-center"><Spin tip="Kiểm tra đăng nhập"/></div>;
    return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
