import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard, identity } from '@/lib/auth';
import { WORKER_FIELDS, ASSIGNMENT_FIELDS, cleanFields, validateWorker, phoneKey } from '@/lib/worker-validation';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    const denied = await guard(request);
    if (denied)
        return denied;
    try {
        const params = request.nextUrl.searchParams, search = params.get('search')?.trim() || '';
        const workers = await prisma.worker.findMany({ where: search ? { OR: ['fullName', 'idCard', 'phone', 'code', 'recruiter'].map(field => ({ [field]: { contains: search } })) } : {}, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }, bankAccounts: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
        return NextResponse.json({ success: true, data: workers.filter(w => (!params.get('factory') || w.assignments[0]?.interviewFactory === params.get('factory')) && (!params.get('status') || w.assignments[0]?.status === params.get('status'))) });
    }
    catch {
        return NextResponse.json({ success: false, message: 'Không thể tải hồ sơ' }, { status: 500 });
    }
}
export async function POST(request: NextRequest) {
    const denied = await guard(request, 'worker:write');
    if (denied)
        return denied;
    let body: any, worker: Record<string, string>, assignment: Record<string, string>;
    try {
        body = await request.json();
        if (!body || typeof body !== 'object')
            throw new Error('Dữ liệu không hợp lệ');
        worker = cleanFields(body, WORKER_FIELDS);
        worker.idCard = typeof body.idCard === 'string' ? body.idCard.trim() : '';
        assignment = cleanFields(body, ASSIGNMENT_FIELDS);
        assignment.status ||= 'Đang chờ phỏng vấn';
        validateWorker(worker, assignment);
        if (assignment.status !== 'Đã nghỉ việc') {
            assignment.leaveDate = '';
            assignment.leaveReason = '';
        }
    }
    catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    const actor = (await identity(request))!;
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.worker.findUnique({ where: { idCard: worker.idCard }, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } });
            if (existing) {
                if (body.rehire !== true)
                    return { status: 409, body: { success: false, isDuplicate: true, duplicateType: 'HARD_CCCD', existingWorkerId: existing.id, message: 'CCCD đã tồn tại. Dùng chức năng tái tuyển dụng để giữ lịch sử.' } };
                if (existing.isBlacklisted)
                    return { status: 409, body: { success: false, message: 'Hồ sơ đang trong danh sách hạn chế; cần quản trị viên xác minh trước' } };
                if (existing.fullName.trim().toLocaleLowerCase('vi') !== worker.fullName.toLocaleLowerCase('vi'))
                    return { status: 409, body: { success: false, message: 'Tên không khớp hồ sơ cũ. Hãy cập nhật và xác minh danh tính trước khi tái tuyển.' } };
                if (existing.assignments.some(a => a.status !== 'Đã nghỉ việc'))
                    return { status: 409, body: { success: false, message: 'Còn đợt tuyển dụng chưa kết thúc. Không thể tạo đợt mới.' } };
                if (assignment.status === 'Đã nghỉ việc')
                    return { status: 400, body: { success: false, message: 'Đợt tái tuyển mới không được bắt đầu ở trạng thái đã nghỉ' } };
                const a = await tx.workAssignment.create({ data: { ...assignment, workerId: existing.id, interviewFactory: assignment.interviewFactory } });
                await tx.auditLog.create({ data: { action: 'REHIRE', module: 'WORKER', operator: actor.username, details: `Tái tuyển hồ sơ ${existing.id}, đợt ${a.id}` } });
                return { status: 201, body: { success: true, data: await tx.worker.findUnique({ where: { id: existing.id }, include: { assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] } } }) } };
            }
            if (body.rehire === true)
                return { status: 404, body: { success: false, message: 'Không tìm thấy CCCD để tái tuyển' } };
            if (worker.phone) {
                const others = await tx.worker.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } });
                if (others.some(w => phoneKey(w.phone!) === worker.phone) && body.confirmPhoneDuplicate !== true)
                    return { status: 409, body: { success: false, isDuplicate: true, duplicateType: 'PHONE', message: 'SĐT đã có trong hồ sơ khác. Chỉ tiếp tục sau khi xác minh và xác nhận dùng chung số.' } };
            }
            const data = await tx.worker.create({ data: { ...worker, fullName: worker.fullName, idCard: worker.idCard, assignments: { create: { ...assignment, interviewFactory: assignment.interviewFactory } } }, include: { assignments: true } });
            await tx.auditLog.create({ data: { action: 'CREATE', module: 'WORKER', operator: actor.username, details: `Tạo hồ sơ ${data.id}${body.confirmPhoneDuplicate === true ? ' (đã xác nhận SĐT trùng)' : ''}` } });
            return { status: 201, body: { success: true, data } };
        });
        return NextResponse.json(result.body, { status: result.status });
    }
    catch (error: any) {
        return NextResponse.json({ success: false, message: error.code === 'P2002' ? 'CCCD đã tồn tại, vui lòng tải lại' : 'Không thể lưu hồ sơ' }, { status: error.code === 'P2002' ? 409 : 500 });
    }
}
