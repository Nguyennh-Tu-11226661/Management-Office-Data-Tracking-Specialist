import { guard, identity } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { phoneKey } from '@/lib/worker-validation';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    const denied = await guard(request, 'read');
    if (denied)
        return denied;
    try {
        const workers = await prisma.worker.findMany({
            include: {
                assignments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        // Gom nhóm kiểm tra trùng SĐT
        const phoneMap = new Map<string, typeof workers>();
        for (const w of workers) {
            if (w.phone) {
                const list = phoneMap.get(phoneKey(w.phone)) || [];
                list.push(w);
                phoneMap.set(phoneKey(w.phone), list);
            }
        }
        const duplicateAlerts: any[] = [];
        // Cảnh báo trùng SĐT
        phoneMap.forEach((list, phone) => {
            if (list.length > 1) {
                for (const w of list) {
                    const assignment = w.assignments[0];
                    duplicateAlerts.push({
                        type: 'TRÙNG SĐT',
                        phone,
                        idCard: w.idCard,
                        fullName: w.fullName,
                        factory: assignment?.interviewFactory || 'N/A',
                        status: assignment?.status || 'N/A',
                        interviewDate: assignment?.interviewDate || 'N/A',
                        recruiter: w.recruiter || 'N/A',
                        warning: `SĐT ${phone} bị trùng lặp giữa ${list.length} hồ sơ`,
                    });
                }
            }
        });
        // Cảnh báo tái ứng tuyển / Đổi nhà máy
        for (const w of workers) {
            if (w.assignments.length > 1) {
                duplicateAlerts.push({
                    type: 'TÁI TUYỂN DỤNG (RE-HIRE)',
                    phone: w.phone,
                    idCard: w.idCard,
                    fullName: w.fullName,
                    factory: w.assignments[0]?.interviewFactory || 'N/A',
                    status: w.assignments[0]?.status || 'N/A',
                    interviewDate: w.assignments[0]?.interviewDate || 'N/A',
                    recruiter: w.recruiter || 'N/A',
                    warning: `Lao động quay lại: có ${w.assignments.length} lần phỏng vấn/làm việc`,
                });
            }
        }
        return NextResponse.json({
            success: true,
            totalDuplicates: duplicateAlerts.length,
            data: duplicateAlerts,
        });
    }
    catch (error: any) {
        return NextResponse.json({ success: false, message: 'Không thể xử lý yêu cầu lúc này' }, { status: 500 });
    }
}
