import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, sameOrigin } from '@/lib/auth';
import { phoneKey } from '@/lib/worker-validation';
import { createHash } from 'node:crypto';
export async function POST(request: NextRequest) {
    if (!sameOrigin(request))
        return NextResponse.json({ success: false, message: 'Nguồn yêu cầu không hợp lệ' }, { status: 403 });
    if (!rateLimit('lookup:global', 100))
        return NextResponse.json({ success: false, message: 'Quá nhiều lần tra cứu. Thử lại sau 15 phút.' }, { status: 429 });
    let body: any;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }
    const idCard = typeof body?.idCard === 'string' ? body.idCard.trim() : '', lastPhone4 = typeof body?.lastPhone4 === 'string' ? body.lastPhone4.trim() : '';
    if (!/^(\d{9}|\d{12})$/.test(idCard) || !/^\d{4}$/.test(lastPhone4))
        return NextResponse.json({ success: false, message: 'Cần CCCD 12 số hoặc CMT 9 số và đúng 4 số cuối SĐT' }, { status: 400 });
    if (!rateLimit('lookup:' + createHash('sha256').update(idCard).digest('hex'), 5))
        return NextResponse.json({ success: false, message: 'Quá nhiều lần tra cứu. Thử lại sau 15 phút.' }, { status: 429 });
    try {
        const worker = await prisma.worker.findUnique({ where: { idCard }, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 }, bonusRecords: { where: { status: { in: ['APPROVED', 'LOCKED'] } }, orderBy: { createdAt: 'desc' } }, bankAccounts: { orderBy: { createdAt: 'desc' }, take: 1 } } });
        if (!worker || !worker.phone || !phoneKey(worker.phone).endsWith(lastPhone4))
            return NextResponse.json({ success: false, message: 'Thông tin tra cứu không khớp hồ sơ' }, { status: 404 });
        const a = worker.assignments[0], b = worker.bankAccounts[0];
        return NextResponse.json({ success: true, data: { fullName: worker.fullName, assignment: a ? { status: a.status, interviewFactory: a.interviewFactory, workingFactory: a.workingFactory, onboardingMonth: a.onboardingMonth } : null,
                bonusRecords: worker.bonusRecords.map(r => ({ id: r.id, month: r.month, status: r.status, bonus1: r.bonus1, bonus2: r.bonus2, bonus3: r.bonus3, bonus4: r.bonus4, bonus5: r.bonus5, bonus6: r.bonus6, bonus7: r.bonus7, totalBonus: r.totalBonus })),
                bankAccount: b ? { accountNumber: '••••' + b.accountNumber.slice(-4), bankName: b.bankName } : null } }, { headers: { 'Cache-Control': 'no-store' } });
    }
    catch {
        return NextResponse.json({ success: false, message: 'Không thể tra cứu lúc này' }, { status: 500 });
    }
}
