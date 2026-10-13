'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Spin } from 'antd';
type User = {
    username: string;
    role: string;
    permissions: string[];
    localAutoView?: boolean;
};
const DEFAULT_USER: User = {
    username: 'Quản trị viên',
    role: 'ADMIN',
    permissions: ['read', 'worker:write', 'bank:write', 'bonus:write', 'bonus:approve', 'export', 'audit', 'users'],
    localAutoView: true,
};

const AuthContext = createContext<User | null>(null);
export const useIdentity = () => useContext(AuthContext);
export default function AuthGate({ children }: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let active = true;
        setReady(false);
        fetch('/api/auth/me', { cache: 'no-store' })
            .then(r => r.json())
            .then(j => {
                if (!active) return;
                setUser(j.success ? j.data : DEFAULT_USER);
                setReady(true);
            })
            .catch(() => {
                if (active) {
                    setUser(DEFAULT_USER);
                    setReady(true);
                }
            });
        return () => { active = false; };
    }, []);
    if (!ready && !user)
        return <div className="p-12 text-center"><Spin tip="Đang khởi tạo giao diện..."/></div>;
    return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}
