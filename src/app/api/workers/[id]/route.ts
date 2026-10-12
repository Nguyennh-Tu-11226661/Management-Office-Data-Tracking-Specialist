import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard, identity } from '@/lib/auth';
import { WORKER_FIELDS, ASSIGNMENT_FIELDS, cleanFields, validateWorker, phoneKey } from '@/lib/worker-validation';
export async function PUT(request: NextRequest, { params }: {
    params: {
        id: string;
    };
}) {
    const denied = await guard(request, 'worker:write');
    if (denied)
        return denied;
    let body: any, worker: Record<string, string>, assignment: Record<string, string>;
    try {
        body = await request.json();
        worker = cleanFields(body, WORKER_FIELDS);
        assignment = cleanFields(body, ASSIGNMENT_FIELDS);
    }
    catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    const actor = (await identity(request))!;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const current = await tx.worker.findUnique({ where: { id: params.id }, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } });
            if (!current)
                return { status: 404, body: { success: false, message: 'Không tìm thấy hồ sơ' } };
            const latest = current.assignments[0];
            if (!latest)
                return { status: 409, body: { success: false, message: 'Hồ sơ chưa có đợt tuyển dụng' } };
            if (body.assignmentId !== latest.id || body.updatedAt !== current.updatedAt.toISOString() || body.assignmentUpdatedAt !== latest.updatedAt.toISOString())
                return { status: 409, body: { success: false, message: 'Hồ sơ hoặc đợt tuyển đã thay đổi, vui lòng tải lại' } };
            const merged = { ...latest, ...assignment };
            if (latest.status === 'Đã nghỉ việc' && merged.status !== 'Đã nghỉ việc')
                return { status: 409, body: { success: false, message: 'Dùng tái tuyển dụng để giữ lịch sử đợt đã nghỉ' } };
            if (merged.status !== 'Đã nghỉ việc') {
                assignment.leaveDate = '';
                assignment.leaveReason = '';
                merged.leaveDate = '';
                merged.leaveReason = '';
            }
            try {
                validateWorker({ ...current, ...worker }, merged);
            }
            catch (error: any) {
                return { status: 400, body: { success: false, message: error.message } };
            }
            if (worker.phone) {
                const others = await tx.worker.findMany({ where: { id: { not: current.id }, phone: { not: null } }, select: { phone: true } });
                if (others.some(w => phoneKey(w.phone!) === worker.phone) && body.confirmPhoneDuplicate !== true)
                    return { status: 409, body: { success: false, isDuplicate: true, duplicateType: 'PHONE', message: 'SĐT đã có trong hồ sơ khác; cần xác nhận dùng chung số' } };
            }
            await tx.worker.update({ where: { id: params.id }, data: worker });
            await tx.workAssignment.update({ where: { id: latest.id }, data: assignment });
            await tx.auditLog.create({ data: { action: 'UPDATE', module: 'WORKER', operator: actor.username, details: `Cập nhật hồ sơ ${current.id}, đợt ${latest.id}: ${latest.status} → ${merged.status}` } });
            return { status: 200, body: { success: true, data: await tx.worker.findUnique({ where: { id: params.id }, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } }) } };
        });
        return NextResponse.json(result.body, { status: result.status });
    }
    catch {
        return NextResponse.json({ success: false, message: 'Không thể cập nhật hồ sơ' }, { status: 500 });
    }
}
export async function DELETE(request: NextRequest) {
    const denied = await guard(request, 'worker:write');
    if (denied)
        return denied;
    return NextResponse.json({ success: false, message: 'Không xóa vĩnh viễn hồ sơ và lịch sử thưởng. Hãy ghi nhận nghỉ việc.' }, { status: 405 });
}
