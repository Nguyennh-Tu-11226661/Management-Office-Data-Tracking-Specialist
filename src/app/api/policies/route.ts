import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard, identity } from '@/lib/auth';
import { validAmount } from '@/lib/payment-safety';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) { const denied = await guard(request); if (denied)
    return denied; try {
    return NextResponse.json({ success: true, data: await prisma.bonusPolicy.findMany({ orderBy: { createdAt: 'desc' } }) });
}
catch {
    return NextResponse.json({ success: false, message: 'Không thể tải chính sách' }, { status: 500 });
} }
async function save(request: NextRequest, edit: boolean) {
    const denied = await guard(request, 'bonus:write');
    if (denied)
        return denied;
    let body: any;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ success: false, message: 'JSON không hợp lệ' }, { status: 400 });
    }
    if (typeof body?.name !== 'string' || !body.name.trim() || body.name.length > 200 || typeof body.factory !== 'string' || !body.factory.trim() || body.factory.length > 200 || !Array.isArray(body.rules) || body.rules.length !== 7 || body.rules.some((r: any, i: number) => r?.step !== i + 1 || typeof r.milestone !== 'string' || !r.milestone.trim() || r.milestone.length > 200 || !validAmount(r.amount)) || typeof body.isActive !== 'boolean')
        return NextResponse.json({ success: false, message: 'Cần tên, nhà máy và đủ 7 mốc liên tiếp với số tiền nguyên không âm' }, { status: 400 });
    const actor = (await identity(request))!;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const data = { name: body.name.trim(), factory: body.factory.trim(), rulesJson: JSON.stringify(body.rules), isActive: body.isActive, description: typeof body.description === 'string' ? body.description.slice(0, 2000) : null };
            if (edit) {
                const current = await tx.bonusPolicy.findUnique({ where: { id: body.id || '' } });
                if (!current)
                    return { error: 'Không tìm thấy chính sách', status: 404 };
                if (body.updatedAt !== current.updatedAt.toISOString())
                    return { error: 'Chính sách đã thay đổi, hãy tải lại', status: 409 };
            }
            const saved = edit ? await tx.bonusPolicy.update({ where: { id: body.id }, data }) : await tx.bonusPolicy.create({ data });
            await tx.auditLog.create({ data: { action: edit ? 'UPDATE' : 'CREATE', module: 'BONUS', operator: actor.username, details: `${edit ? 'Sửa' : 'Tạo'} chính sách ${saved.id}. Không thay đổi thưởng đã ghi nhận.` } });
            return { data: saved };
        });
        if ('error' in result)
            return NextResponse.json({ success: false, message: result.error }, { status: result.status });
        return NextResponse.json({ success: true, data: result.data }, { status: edit ? 200 : 201 });
    }
    catch {
        return NextResponse.json({ success: false, message: 'Không thể lưu chính sách' }, { status: 500 });
    }
}
export const POST = (request: NextRequest) => save(request, false);
export const PUT = (request: NextRequest) => save(request, true);
