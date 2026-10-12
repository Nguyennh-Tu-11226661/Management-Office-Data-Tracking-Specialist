import { NextRequest, NextResponse } from 'next/server';
import { guard, identity, listUsers, saveUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) { const denied = await guard(request, 'users'); if (denied)
    return denied; try {
    return NextResponse.json({ success: true, data: await listUsers() });
}
catch {
    return NextResponse.json({ success: false, message: 'Không thể đọc cấu hình tài khoản' }, { status: 500 });
} }
export async function POST(request: NextRequest) { const denied = await guard(request, 'users'); if (denied)
    return denied; let body: any; try {
    body = await request.json();
}
catch {
    return NextResponse.json({ success: false, message: 'JSON không hợp lệ' }, { status: 400 });
} try {
    await saveUser(body, (await identity(request))!.username);
    return NextResponse.json({ success: true });
}
catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
} }
