import { guard, identity } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentIssue, validMonth } from '@/lib/payment-safety';
import * as XLSX from 'xlsx';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    const denied = await guard(request, 'export');
    if (denied)
        return denied;
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'PAYMENT_BATCH'; // PAYMENT_BATCH, WORKERS, DUPLICATES
        const bank = searchParams.get('bank') || 'VCB'; // VCB, MB, TCB
        const month = searchParams.get('month') || '';
        if (type === 'PAYMENT_BATCH') {
            if ((await identity(request))!.role === 'HR')
                return NextResponse.json({ success: false, message: 'Nhân sự không có quyền xuất lệnh chi' }, { status: 403 });
            if (!validMonth(month))
                return NextResponse.json({ success: false, message: 'Cần chọn kỳ tháng hợp lệ' }, { status: 400 });
            // Xuất file lệnh chi ngân hàng
            const bonuses = await prisma.bonusRecord.findMany({
                where: {
                    month,
                    totalBonus: { gt: 0 },
                },
                include: {
                    worker: {
                        include: {
                            bankAccounts: true,
                        },
                    },
                },
            });
            if (!bonuses.length)
                return NextResponse.json({ success: false, message: 'Không có thưởng dương trong kỳ đã chọn' }, { status: 409 });
            const issues = bonuses.map(b => ({ id: b.id, reason: paymentIssue(b) })).filter(b => b.reason);
            if (issues.length)
                return NextResponse.json({ success: false, code: 'PAYMENT_BATCH_BLOCKED',
                    message: `Chưa thể xuất lệnh chi: ${issues.length} bản ghi chưa đủ điều kiện. ${issues[0].reason}.`, issues }, { status: 409 });
            const paymentRows = bonuses.map((b, idx) => {
                const bankAcc = b.worker.bankAccounts[0];
                return {
                    'STT': idx + 1,
                    'Số tài khoản nhận': bankAcc?.accountNumber || 'CHƯA CÓ STK',
                    'Tên người thụ hưởng': bankAcc?.accountHolderName || b.worker.fullName,
                    'Số tiền (VND)': b.totalBonus || 0,
                    'Tên ngân hàng': bankAcc?.bankName || 'N/A',
                    'Nội dung thanh toán': `Chi trả thưởng ${b.month} - ${b.worker.fullName}`,
                    'CCCD': b.worker.idCard,
                    'Nhà máy': b.company || 'N/A',
                    'Trạng thái STK': bankAcc?.verificationStatus || 'Chưa kiểm tra',
                };
            });
            const worksheet = XLSX.utils.json_to_sheet(paymentRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, `ChiThuong_${month}`);
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="LenhChi_${bank}_${month}.xlsx"`,
                },
            });
        }
        if (type === 'DUPLICATES') {
            const { GET } = await import('@/app/api/duplicates/route');
            const result = await GET(request);
            if (!result.ok)
                return result;
            const json = await result.json();
            const rows = json.data.map((d: any) => ({ 'CCCD': d.idCard, 'Họ và Tên': d.fullName, 'Nhà máy PV': d.factory, 'Tình Trạng': d.status, 'Ngày PV': d.interviewDate, 'Loại Cảnh Báo': d.type, 'Chi Tiết': d.warning }));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Cảnh báo trùng');
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return new NextResponse(buffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="CanhBaoTrung.xlsx"', 'Cache-Control': 'no-store' } });
        }
        if (type === 'TEMPLATE') {
            const headers = ['Họ và tên', 'số CCCD', 'SĐT', 'Nhà máy PV', 'Nhà máy làm việc', 'Loại HD', 'Tình trạng', 'Ngày NH', 'Lý do', 'Mã NV', 'Ngày sinh', 'Giới tính', 'Ngày cấp', 'Địa chỉ', 'Tỉnh/Thành', 'Tuyển dụng', 'Đón xe - KTX', 'Ngày PV', 'Ngày Đào tạo dự kiến', 'Tình trạng Đào tạo dự kiến', 'Ngày đào tạo chuẩn', 'Tháng nhận việc', 'Nguồn'];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers]), 'DS_TONG');
            return new NextResponse(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="DS_TONG_Template.xlsx"' } });
        }
        if (type === 'WORKERS') {
            // Xuất danh sách hồ sơ theo chuẩn DS_TONG
            const workers = await prisma.worker.findMany({
                include: {
                    assignments: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 1 },
                },
            });
            const workerRows = workers.map((w, idx) => {
                const a = w.assignments[0];
                return {
                    'STT': idx + 1,
                    'Nhà máy PV': a?.interviewFactory || '',
                    'Nhà máy làm việc': a?.workingFactory || '',
                    'Loại HD': a?.contractType || '',
                    'Tình trạng ': a?.status || '',
                    'Ngày NH ': a?.leaveDate || '',
                    'Lý do': a?.leaveReason || '',
                    'Mã NV': w.code || '',
                    'Họ và tên ': w.fullName,
                    'Ngày sinh': w.dob || '',
                    'Giới tính ': w.gender || '',
                    'số CCCD': w.idCard,
                    'Ngày cấp': w.idCardDate || '',
                    'Địa chỉ': w.address || '',
                    'Tỉnh/Thành': w.province || '',
                    'Nơi cấp': w.idCardPlace || '',
                    'Đội nhóm': w.team || '',
                    'SĐT': w.phone || '',
                    'Tuyển dụng': a?.recruiter || w.recruiter || '',
                    'Đón xe - KTX': a?.shuttleBusKtx || '',
                    'Ngày PV': a?.interviewDate || '',
                    'Ngày Đào tạo dự kiến ': a?.expectedTrainingDate || '',
                    'Tình trạng Đào tạo dự kiến ': a?.expectedTrainingStatus || '',
                    'Ngày đào tạo chuẩn': a?.standardTrainingDate || '',
                    'Tháng nhận việc ': a?.onboardingMonth || '',
                    'Nguồn ': a?.source || w.source || '',
                };
            });
            const worksheet = XLSX.utils.json_to_sheet(workerRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'DS_TONG');
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="DS_TONG_Export.xlsx"`,
                },
            });
        }
        return NextResponse.json({ success: false, message: 'Loại xuất không hợp lệ' }, { status: 400 });
    }
    catch (error: any) {
        return NextResponse.json({ success: false, message: 'Không thể xử lý yêu cầu lúc này' }, { status: 500 });
    }
}
