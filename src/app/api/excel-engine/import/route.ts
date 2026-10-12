import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { guard, identity } from '@/lib/auth';
import { phoneKey } from '@/lib/worker-validation';
import { parseImportRow } from '@/lib/worker-import';
export async function POST(request: NextRequest) {
    const denied = await guard(request, 'worker:write');
    if (denied)
        return denied;
    try {
        const form = await request.formData(), file = form.get('file');
        if (!file || typeof file === 'string' || file.size > 5 * 1024 * 1024 || !file.size || !file.name.toLowerCase().endsWith('.xlsx'))
            return NextResponse.json({ success: false, message: 'Chọn file .xlsx tối đa 5 MB' }, { status: 400 });
        const commit = form.get('confirm') === 'true', confirmPhone = form.get('confirmPhoneDuplicate') === 'true';
        const book = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
        const sheet = book.Sheets['DS_TONG'];
        if (!sheet)
            return NextResponse.json({ success: false, message: 'Chỉ nhập sheet DS_TONG. Tải file mẫu để đối chiếu tên cột.' }, { status: 400 });
        const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', blankrows: true });
        const headers = (matrix[0] || []).map(v => String(v).trim());
        if (!headers.some(h => ['Họ và tên', 'Họ tên'].includes(h)) || !headers.some(h => ['số CCCD', 'Số CCCD', 'CCCD', 'CMT/CCCD'].includes(h)))
            return NextResponse.json({ success: false, message: 'Thiếu cột họ tên hoặc CCCD' }, { status: 400 });
        if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length)
            return NextResponse.json({ success: false, message: 'Có tên cột trùng lặp; cần kiểm tra trước khi nhập' }, { status: 400 });
        const entries = matrix.slice(1).map((values, index) => ({ row: index + 2, raw: Object.fromEntries(headers.map((h, i) => [h, values[i]])), values })).filter(e => e.values.some(v => v !== '' && v !== null));
        if (!entries.length || entries.length > 5000)
            return NextResponse.json({ success: false, message: 'File cần từ 1 đến 5.000 dòng dữ liệu' }, { status: 400 });
        const existing = await prisma.worker.findMany({ select: { idCard: true, phone: true } }), ids = new Set(existing.map(w => w.idCard)), phones = new Set(existing.filter(w => w.phone).map(w => phoneKey(w.phone!)));
        let successCount = 0, duplicateCount = 0, errorCount = 0, readyCount = 0;
        const errors: string[] = [], warnings: string[] = [];
        const actor = (await identity(request))!;
        for (const entry of entries) {
            try {
                const { worker, assignment } = parseImportRow(entry.raw);
                if (ids.has(worker.idCard)) {
                    duplicateCount++;
                    errors.push(`Dòng ${entry.row}: CCCD đã có, không ghi đè. Tái tuyển bằng màn hình hồ sơ.`);
                    continue;
                }
                if (worker.phone && phones.has(worker.phone)) {
                    warnings.push(`Dòng ${entry.row}: SĐT trùng, cần xác minh dùng chung số.`);
                    if (commit && !confirmPhone) {
                        errorCount++;
                        errors.push(`Dòng ${entry.row}: chưa xác nhận SĐT trùng`);
                        continue;
                    }
                }
                if (commit) {
                    await prisma.$transaction(async (tx) => {
                        const data = await tx.worker.create({ data: { ...worker, fullName: worker.fullName, idCard: worker.idCard, assignments: { create: { ...assignment, interviewFactory: assignment.interviewFactory } } } });
                        await tx.auditLog.create({ data: { action: 'IMPORT', module: 'WORKER', operator: actor.username, details: `Nhập hồ sơ ${data.id} từ dòng ${entry.row} (DS_TONG)${confirmPhone ? ' — có xác nhận SĐT trùng' : ''}` } });
                    });
                    successCount++;
                }
                else
                    readyCount++;
                ids.add(worker.idCard);
                if (worker.phone)
                    phones.add(worker.phone);
            }
            catch (error: any) {
                errorCount++;
                errors.push(`Dòng ${entry.row}: ${error.code === 'P2002' ? 'CCCD đã tồn tại' : error.code ? 'Không thể lưu dòng dữ liệu' : error.message}`);
            }
        }
        return NextResponse.json({ success: true, preview: !commit, summary: { totalRows: entries.length, successCount, readyCount, duplicateCount, errorCount }, errors, warnings });
    }
    catch {
        return NextResponse.json({ success: false, message: 'Không thể đọc file Excel. Kiểm tra định dạng và thử lại.' }, { status: 400 });
    }
}
