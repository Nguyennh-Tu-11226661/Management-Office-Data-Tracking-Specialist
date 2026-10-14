import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guard, identity } from '@/lib/auth';
import { deleteImportSource } from '@/lib/import-source-store';
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export async function GET(request: NextRequest) {
  const denied = await guard(request, 'worker:write');
  if (denied) return denied;

  try {
    const importedEvents = await prisma.assignmentEvent.count({
      where: { note: { startsWith: 'Import Excel' } }
    });
    const totalWorkers = await prisma.worker.count();
    const totalAssignments = await prisma.workAssignment.count();
    const totalBonuses = await prisma.bonusRecord.count();
    const totalBanks = await prisma.bankAccount.count();

    return NextResponse.json({
      success: true,
      stats: {
        importedEvents,
        totalWorkers,
        totalAssignments,
        totalBonuses,
        totalBanks
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Lỗi truy vấn dữ liệu' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard(request, 'worker:write');
  if (denied) return denied;

  const actor = (await identity(request))!;

  try {
    // 1. Sao lưu CSDL an toàn trước khi xóa
    const settingsPath = path.resolve('.local/evolution-preview.json');
    const preview = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : null;
    const dbUrl = process.env.LOCAL_APPLICATION_DATABASE_URL || preview?.databaseUrl || 'file:./prisma/dev.db';
    const dbFilePath = dbUrl.replace(/^file:/, '');

    const backupDir = path.resolve('.local/backups');
    await mkdir(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `before-clear-excel-${timestamp}.db`);

    if (existsSync(dbFilePath)) {
      await copyFile(dbFilePath, backupFile);
    }

    // 2. Thu thập và xóa dữ liệu nạp từ Excel
    const result = await prisma.$transaction(async (tx) => {
      // Tìm các assignment được tạo từ import Excel
      const importedEvents = await tx.assignmentEvent.findMany({
        where: { note: { startsWith: 'Import Excel' } },
        select: { assignmentId: true }
      });
      const importedAssignmentIds = [...new Set(importedEvents.map(e => e.assignmentId))];

      // Xóa thưởng import
      const deletedBonuses = await tx.bonusRecord.deleteMany({
        where: {
          OR: [
            { assignmentId: { in: importedAssignmentIds } },
            { note: { contains: 'SOURCE_EXCEL_ACTUAL_PAID' } }
          ]
        }
      });

      // Xóa STK import
      const deletedBanks = await tx.bankAccount.deleteMany({
        where: {
          OR: [
            { checkResult: { contains: 'Tự động tạo từ danh sách thưởng' } },
            { checkResult: { contains: 'Đối soát' } }
          ]
        }
      });

      // Xóa sự kiện và đợt tuyển
      await tx.assignmentEvent.deleteMany({
        where: { assignmentId: { in: importedAssignmentIds } }
      });
      const deletedAssignments = await tx.workAssignment.deleteMany({
        where: { id: { in: importedAssignmentIds } }
      });

      // Xóa công nhân không còn đợt tuyển nào
      const workersWithoutAssignments = await tx.worker.findMany({
        where: { assignments: { none: {} } },
        select: { id: true }
      });
      const deletedWorkers = await tx.worker.deleteMany({
        where: { id: { in: workersWithoutAssignments.map(w => w.id) } }
      });

      // Ghi audit log
      await tx.auditLog.create({
        data: {
          module: 'EXCEL',
          action: 'CLEAR_DATA',
          operator: actor.username,
          details: `Dọn dẹp dữ liệu import: xóa ${deletedWorkers.count} công nhân, ${deletedAssignments.count} lượt tuyển, ${deletedBonuses.count} bản thưởng, ${deletedBanks.count} STK. Sao lưu tại: ${path.basename(backupFile)}`
        }
      });

      return {
        workers: deletedWorkers.count,
        assignments: deletedAssignments.count,
        bonuses: deletedBonuses.count,
        bankAccounts: deletedBanks.count
      };
    });

    // 3. Xóa các file lưu nguồn review trong .local/source-imports/
    await deleteImportSource();

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp thành công ${result.workers} công nhân, ${result.assignments} lượt tuyển, ${result.bonuses} bản thưởng. Đã sao lưu dữ liệu dự phòng.`,
      backup: path.basename(backupFile),
      cleared: result
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: 'Không thể dọn dẹp dữ liệu: ' + (err?.message || 'Lỗi không xác định')
    }, { status: 500 });
  }
}
