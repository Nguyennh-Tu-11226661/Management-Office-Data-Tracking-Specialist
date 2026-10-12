import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { guard, identity } from '@/lib/auth';
import { phoneKey } from '@/lib/worker-validation';
import { parseImportRow } from '@/lib/worker-import';
import { assignmentRelations, today, day } from '@/lib/domain';

export async function POST(request: NextRequest) {
  const denied = await guard(request, 'worker:write');
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string' || file.size > 10 * 1024 * 1024 || !file.size || !file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json({ success: false, message: 'Chọn file .xlsx tối đa 10 MB' }, { status: 400 });
    }

    const commit = form.get('confirm') === 'true';
    const confirmPhone = form.get('confirmPhoneDuplicate') === 'true';
    const confirmActive = form.get('confirmActiveDuplicate') === 'true';
    const actor = (await identity(request))!;
    const requestedType = String(form.get('importType') || 'AUTO').toUpperCase();

    const book = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
    const sheetNames = book.SheetNames;
    if (!sheetNames.length) {
      return NextResponse.json({ success: false, message: 'File Excel không có sheet nào' }, { status: 400 });
    }

    let profile: any = null;
    if (form.get('profileId')) {
      profile = await prisma.importProfile.findUnique({ where: { id: String(form.get('profileId')) } });
    }

    // --- 1. Tự Động Nhận Diện Loại File (Smart Auto-Detect) ---
    let detectedType: 'DS_TONG' | 'DS_THUONG' | 'BANK_ACCOUNTS' = 'DS_TONG';
    let targetSheetName = '';

    const sheetHeadersMap = new Map<string, string[]>();
    for (const sName of sheetNames) {
      const s = book.Sheets[sName];
      if (!s) continue;
      const m = XLSX.utils.sheet_to_json<any[]>(s, { header: 1, defval: '', blankrows: false });
      const h = (m[0] || []).map((v: any) => String(v).trim());
      sheetHeadersMap.set(sName, h);
    }

    if (requestedType === 'DS_THUONG' || requestedType === 'THUONG') {
      detectedType = 'DS_THUONG';
    } else if (requestedType === 'BANK_ACCOUNTS' || requestedType === 'STK') {
      detectedType = 'BANK_ACCOUNTS';
    } else if (requestedType === 'DS_TONG') {
      detectedType = 'DS_TONG';
    } else {
      // Tự động nhận diện (AUTO DETECT)
      const bonusSheet = sheetNames.find(s => s.toUpperCase().includes('THUONG') || s.toUpperCase().includes('THƯỞNG'));
      const bankSheet = sheetNames.find(s => s.toUpperCase().includes('STK') || s.toUpperCase().includes('NGÂN HÀNG') || s.toUpperCase().includes('NGAN HANG'));

      let hasBonusHeaders = false;
      let hasBankHeaders = false;

      for (const [sName, headers] of sheetHeadersMap.entries()) {
        const headerStr = headers.join(' ').toLowerCase();
        if (headerStr.includes('thưởng lần 1') || (headerStr.includes('chính sách') && headerStr.includes('tổng thưởng'))) {
          hasBonusHeaders = true;
          targetSheetName = sName;
          break;
        }
        if (headerStr.includes('tình trạng stk') || headerStr.includes('người check') || (headerStr.includes('stk') && headerStr.includes('tên chủ tài khoản'))) {
          hasBankHeaders = true;
          targetSheetName = sName;
          break;
        }
      }

      if (hasBonusHeaders || (bonusSheet && !sheetHeadersMap.get(bonusSheet || '')?.some(h => h.includes('Nhà máy PV')))) {
        detectedType = 'DS_THUONG';
        targetSheetName = targetSheetName || bonusSheet || sheetNames[0];
      } else if (hasBankHeaders || bankSheet) {
        detectedType = 'BANK_ACCOUNTS';
        targetSheetName = targetSheetName || bankSheet || sheetNames[0];
      } else {
        detectedType = 'DS_TONG';
        targetSheetName = profile?.sheetName || (sheetNames.includes('DS_TONG') ? 'DS_TONG' : sheetNames[0]);
      }
    }

    if (!targetSheetName) {
      if (detectedType === 'DS_THUONG') {
        targetSheetName = sheetNames.find(s => s.toUpperCase().includes('THUONG') || s.toUpperCase().includes('THƯỞNG')) || sheetNames[0];
      } else if (detectedType === 'BANK_ACCOUNTS') {
        targetSheetName = sheetNames.find(s => s.toUpperCase().includes('STK')) || sheetNames[0];
      } else {
        targetSheetName = profile?.sheetName || (sheetNames.includes('DS_TONG') ? 'DS_TONG' : sheetNames[0]);
      }
    }

    const sheet = book.Sheets[targetSheetName];
    if (!sheet) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy sheet ${targetSheetName} phù hợp trong file Excel. Vui lòng kiểm tra lại.`
      }, { status: 400 });
    }

    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', blankrows: true });
    const headers = (matrix[0] || []).map(v => String(v).trim());
    const entries = matrix.slice(1).map((values, index) => ({
      row: index + 2,
      raw: Object.fromEntries(headers.map((h, i) => [h, values[i]])),
      values
    })).filter(e => e.values.some(v => v !== '' && v !== null));

    if (!entries.length || entries.length > 5000) {
      return NextResponse.json({ success: false, message: 'File cần từ 1 đến 5.000 dòng dữ liệu' }, { status: 400 });
    }

    let successCount = 0;
    let readyCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    let rehireCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    // =========================================================================
    // NHÁNH 1: BẢNG THƯỞNG (DS_THUONG)
    // =========================================================================
    if (detectedType === 'DS_THUONG') {
      const workers = await prisma.worker.findMany({ include: { assignments: true } });
      const workerMap = new Map(workers.map(w => [w.idCard, w]));

      for (const e of entries) {
        try {
          const raw = e.raw;
          const cccdRaw = raw['Số CCCD'] || raw['số CCCD'] || raw['CCCD'] || raw['CMT/CCCD'];
          if (!cccdRaw) throw new Error('Thiếu số CCCD');
          const idCard = String(cccdRaw).trim();
          const fullName = String(raw['Họ tên'] || raw['Họ và tên'] || '').trim();
          const company = String(raw['Công ty'] || raw['Nhà máy'] || '').trim();
          const month = String(raw['Tháng'] || 'T01.2026').trim();
          const interviewDate = String(raw['Ngày PV'] || '').trim();
          const policy = String(raw['Chính sách'] || '').trim();
          const workerCode = String(raw['Mã nhân viên'] || raw['Mã NV'] || '').trim();
          const stk = raw['STK'] ? String(raw['STK']).trim() : '';
          const bankName = raw['Ngân hàng'] ? String(raw['Ngân hàng']).trim() : '';

          const parseBonus = (val: any) => {
            if (!val) return 0;
            const clean = String(val).replace(/[,.đ\s]/g, '');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
          };

          const bonus1 = parseBonus(raw['Thưởng lần 1']);
          const bonus2 = parseBonus(raw['Thưởng lần 2']);
          const bonus3 = parseBonus(raw['Thưởng lần 3']);
          const bonus4 = parseBonus(raw['Thưởng lần 4']);
          const bonus5 = parseBonus(raw['Thưởng lần 5']);
          const bonus6 = parseBonus(raw['Thưởng lần 6']);
          const bonus7 = parseBonus(raw['Thưởng lần 7']);
          const totalBonusCalculated = bonus1 + bonus2 + bonus3 + bonus4 + bonus5 + bonus6 + bonus7;
          const totalBonus = parseBonus(raw['Tổng thưởng']) || totalBonusCalculated;

          let worker = workerMap.get(idCard);

          if (!worker) {
            warnings.push(`Dòng ${e.row}: CCCD ${idCard} chưa có hồ sơ nhân sự, hệ thống sẽ tự tạo hồ sơ liên kết thưởng.`);
          }

          if (commit) {
            await prisma.$transaction(async tx => {
              if (!worker) {
                worker = await tx.worker.create({
                  data: {
                    idCard,
                    fullName: fullName || 'Người lao động',
                    code: workerCode || null,
                  },
                  include: { assignments: true }
                });
                workerMap.set(idCard, worker);
              }

              let assignmentId: string | undefined = undefined;
              if (worker.assignments && worker.assignments.length > 0) {
                const matched = worker.assignments.find((a: any) => a.interviewFactory?.toLowerCase() === company.toLowerCase());
                assignmentId = matched ? matched.id : worker.assignments[0].id;
              }

              const existingBonus = await tx.bonusRecord.findFirst({
                where: {
                  workerId: worker.id,
                  month,
                  company: company || undefined
                }
              });

              if (existingBonus) {
                await tx.bonusRecord.update({
                  where: { id: existingBonus.id },
                  data: {
                    interviewDate: interviewDate || existingBonus.interviewDate,
                    policy: policy || existingBonus.policy,
                    workerCode: workerCode || existingBonus.workerCode,
                    bonus1,
                    bonus2,
                    bonus3,
                    bonus4,
                    bonus5,
                    bonus6,
                    bonus7,
                    totalBonus,
                    status: 'APPROVED',
                    assignmentId: assignmentId || existingBonus.assignmentId
                  }
                });
              } else {
                await tx.bonusRecord.create({
                  data: {
                    workerId: worker.id,
                    assignmentId,
                    company,
                    month,
                    interviewDate,
                    policy,
                    workerCode,
                    bonus1,
                    bonus2,
                    bonus3,
                    bonus4,
                    bonus5,
                    bonus6,
                    bonus7,
                    totalBonus,
                    status: 'APPROVED'
                  }
                });
              }

              if (stk) {
                const existingBank = await tx.bankAccount.findFirst({
                  where: { workerId: worker.id }
                });
                if (!existingBank) {
                  await tx.bankAccount.create({
                    data: {
                      workerId: worker.id,
                      accountNumber: stk,
                      accountHolderName: fullName || worker.fullName,
                      bankName: bankName || 'Ngân hàng đối soát',
                      verificationStatus: 'VALID',
                      isNameVerified: true,
                      checkResult: 'Tự động tạo từ danh sách thưởng'
                    }
                  });
                }
              }

              await tx.auditLog.create({
                data: {
                  module: 'BONUS',
                  action: 'IMPORT',
                  operator: actor.username,
                  details: `Dòng ${e.row}: CCCD ${idCard}, công ty ${company}, tháng ${month}, thưởng ${totalBonus.toLocaleString('vi-VN')} đ`
                }
              });
            });
            successCount++;
          } else {
            readyCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`Dòng ${e.row}: ${err.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        preview: !commit,
        detectedType: 'DS_THUONG',
        detectedTypeName: 'Bảng thưởng các lần 1 → 7 (DS_THUONG)',
        sheetUsed: targetSheetName,
        summary: { totalRows: entries.length, successCount, readyCount, duplicateCount, errorCount, rehireCount },
        errors,
        warnings
      });
    }

    // =========================================================================
    // NHÁNH 2: TÀI KHOẢN NGÂN HÀNG (BANK_ACCOUNTS)
    // =========================================================================
    if (detectedType === 'BANK_ACCOUNTS') {
      const workers = await prisma.worker.findMany({ include: { bankAccounts: true } });
      const workerMap = new Map(workers.map(w => [w.idCard, w]));

      for (const e of entries) {
        try {
          const raw = e.raw;
          const cccdRaw = raw['CMT/CCCD'] || raw['Số CCCD'] || raw['số CCCD'] || raw['CCCD'];
          if (!cccdRaw) throw new Error('Thiếu số CMT/CCCD');
          const idCard = String(cccdRaw).trim();
          const fullName = String(raw['Họ và tên'] || raw['Họ tên'] || raw['Tên chủ tài khoản'] || '').trim();
          const stkRaw = raw['STK'] || raw['Số tài khoản'];
          if (!stkRaw) throw new Error('Thiếu số tài khoản (STK)');
          const accountNumber = String(stkRaw).trim();
          const accountHolderName = String(raw['Tên chủ tài khoản'] || fullName).trim();
          const bankName = String(raw['Ngân hàng'] || 'Ngân hàng đối soát').trim();
          const statusSTK = String(raw['Tình trạng STK'] || raw['TT'] || '').trim();
          const warningMsg = String(raw['Cảnh báo'] || '').trim();
          const checkedBy = String(raw['Người check'] || '').trim();
          const checkResult = String(raw['Kết Quả'] || raw['Kết quả'] || '').trim();

          const isMatch = statusSTK.toLowerCase().includes('hợp lệ') || checkResult.toLowerCase().includes('khớp') || !warningMsg;
          const verificationStatus = isMatch ? 'VALID' : 'UNVERIFIED';

          let worker = workerMap.get(idCard);
          if (!worker) {
            warnings.push(`Dòng ${e.row}: CCCD ${idCard} chưa có trong hồ sơ, hệ thống sẽ tự động tạo hồ sơ cơ bản.`);
          }

          if (commit) {
            await prisma.$transaction(async tx => {
              if (!worker) {
                worker = await tx.worker.create({
                  data: {
                    idCard,
                    fullName: fullName || accountHolderName || 'Người lao động',
                    phone: raw['SĐT'] ? String(raw['SĐT']).trim() : null,
                    dob: raw['Ngày sinh'] ? String(raw['Ngày sinh']).trim() : null,
                  },
                  include: { bankAccounts: true }
                });
                workerMap.set(idCard, worker);
              }

              const existingBank = await tx.bankAccount.findFirst({
                where: {
                  workerId: worker.id,
                  accountNumber
                }
              });

              if (existingBank) {
                await tx.bankAccount.update({
                  where: { id: existingBank.id },
                  data: {
                    accountHolderName,
                    bankName,
                    isNameVerified: isMatch,
                    verificationStatus,
                    warningMessage: warningMsg || null,
                    checkedBy: checkedBy || existingBank.checkedBy,
                    checkResult: checkResult || existingBank.checkResult,
                    checkedAt: new Date()
                  }
                });
              } else {
                await tx.bankAccount.create({
                  data: {
                    workerId: worker.id,
                    accountNumber,
                    accountHolderName,
                    bankName,
                    isNameVerified: isMatch,
                    verificationStatus,
                    warningMessage: warningMsg || null,
                    checkedBy: checkedBy || null,
                    checkResult: checkResult || null,
                    checkedAt: new Date()
                  }
                });
              }

              await tx.auditLog.create({
                data: {
                  module: 'FINANCE',
                  action: 'IMPORT',
                  operator: actor.username,
                  details: `Dòng ${e.row}: Cập nhật STK ${accountNumber} (${accountHolderName}) cho CCCD ${idCard}`
                }
              });
            });
            successCount++;
          } else {
            readyCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`Dòng ${e.row}: ${err.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        preview: !commit,
        detectedType: 'BANK_ACCOUNTS',
        detectedTypeName: 'Đối soát số tài khoản ngân hàng (STK)',
        sheetUsed: targetSheetName,
        summary: { totalRows: entries.length, successCount, readyCount, duplicateCount, errorCount, rehireCount },
        errors,
        warnings
      });
    }

    // =========================================================================
    // NHÁNH 3: HỒ SƠ TỔNG MASTER DATA (DS_TONG)
    // =========================================================================
    if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) {
      return NextResponse.json({ success: false, message: 'Tên cột bị trùng; cần ánh xạ đúng cột trước khi nhập' }, { status: 400 });
    }

    const mapping = profile ? JSON.parse(profile.mappingJson) : null;
    const existing = await prisma.worker.findMany({ include: { assignments: true } });
    const people = new Map(existing.map(w => [w.idCard, w]));
    const statuses = await prisma.laborStatus.findMany({ where: { isActive: true } });
    const warns = new Set(statuses.filter(s => s.warnsDuplicate).map(s => s.name));
    const identityKey = (a: any) => [a.interviewFactory, a.interviewDate ? day(a.interviewDate, 'Ngày PV') : null, a.employeeCode || ''].join('|');

    const labels: Record<string, string> = {
      fullName: 'Họ và tên',
      idCard: 'số CCCD',
      interviewFactory: 'Nhà máy PV',
      interviewDate: 'Ngày PV',
      employeeCode: 'Mã nhân viên',
      interviewResult: 'Kết quả PV',
      passedDate: 'Ngày đỗ',
      team: 'Team',
      code: 'Mã NV',
      phone: 'SĐT',
      dob: 'Ngày sinh',
      gender: 'Giới tính',
      province: 'Tỉnh/Thành',
      recruiter: 'Tuyển dụng',
      status: 'Tình trạng',
      startDate: 'Ngày bắt đầu làm',
      leaveDate: 'Ngày NH',
      leaveReason: 'Lý do',
      onboardingMonth: 'Tháng nhận việc'
    };

    for (const e of entries) {
      try {
        let raw = e.raw;
        if (mapping) {
          raw = { ...raw };
          for (const [field, column] of Object.entries(mapping)) {
            if (labels[field]) raw[labels[field]] = e.raw[String(column).trim()];
          }
        }
        const { worker, assignment } = parseImportRow(raw);
        if (assignment.interviewResult === 'PASS' && !raw['Ngày đỗ'] && !raw['Ngày PV đỗ']) {
          warnings.push(`Dòng ${e.row}: nguồn xác nhận Đỗ, ngày đỗ dùng ngày PV; kiểm tra ở bước xem trước.`);
        }
        if (!assignment.interviewDate) throw new Error('Cần ngày PV để lưu đúng lượt tuyển và báo cáo');
        if (!statuses.some(s => s.name === assignment.status)) throw new Error('Trạng thái chưa có trong danh mục: ' + assignment.status);
        for (const k of ['orderId', 'batchId']) if (!assignment[k]) delete assignment[k];
        const old = people.get(worker.idCard);
        if (old?.archivedAt) throw new Error('Hồ sơ đã lưu trữ, khôi phục trước khi nhập đợt mới');
        if (old && old.fullName.trim().toLocaleLowerCase('vi') !== worker.fullName.toLocaleLowerCase('vi')) {
          throw new Error('Tên không khớp CCCD cũ; cần xác minh, không ghi đè hồ sơ');
        }
        if (old?.assignments.some(a => identityKey(a) === identityKey(assignment))) {
          duplicateCount++;
          errors.push(`Dòng ${e.row}: lượt PV đã có (CCCD + nhà máy + ngày PV + mã NV), không ghi đè.`);
          continue;
        }
        const activeDuplicate = old?.assignments.some(a => warns.has(a.status));
        if (activeDuplicate) {
          warnings.push(`Dòng ${e.row}: CCCD có đợt Đang làm việc/Chưa đào tạo; xem lịch sử trước khi thêm lượt.`);
          if (commit && !confirmActive) {
            errorCount++;
            errors.push(`Dòng ${e.row}: chưa xác nhận hồ sơ đang hoạt động`);
            continue;
          }
        }
        const phoneDuplicate = worker.phone && [...people.values()].some(w => w.idCard !== worker.idCard && w.phone && phoneKey(w.phone) === worker.phone && !w.archivedAt && w.assignments.some(a => warns.has(a.status)));
        if (phoneDuplicate) {
          warnings.push(`Dòng ${e.row}: SĐT trùng hồ sơ đang hoạt động.`);
          if (commit && !confirmPhone) {
            errorCount++;
            errors.push(`Dòng ${e.row}: chưa xác nhận SĐT trùng`);
            continue;
          }
        }
        await assignmentRelations(prisma, assignment);
        if (commit) {
          await prisma.$transaction(async tx => {
            let person = await tx.worker.findUnique({ where: { idCard: worker.idCard }, include: { assignments: true } });
            if (person?.assignments.some(a => identityKey(a) === identityKey(assignment))) throw new Error('Lượt PV đã được người khác thêm, tải lại dữ liệu');
            if (!person) person = await tx.worker.create({ data: { ...worker, fullName: worker.fullName, idCard: worker.idCard }, include: { assignments: true } });
            const a = await tx.workAssignment.create({ data: { ...assignment, interviewFactory: assignment.interviewFactory, workerId: person.id } });
            await tx.assignmentEvent.create({ data: { assignmentId: a.id, occurredOn: today(), toStatus: a.status, interviewResult: a.interviewResult, operator: actor.username, note: 'Import Excel — thông tin từng lượt PV, không ghi đè lịch sử' } });
            await tx.auditLog.create({ data: { module: 'WORKER', action: 'IMPORT', operator: actor.username, details: `Dòng ${e.row}: hồ sơ ${person.id}, lượt ${a.id}${old ? ' (thêm lịch sử vào hồ sơ cũ)' : ''}` } });
          });
          successCount++;
        } else readyCount++;

        if (old) {
          rehireCount++;
          old.assignments.push({ ...assignment, id: 'preview-' + e.row } as any);
        } else people.set(worker.idCard, { ...worker, id: 'preview-' + e.row, assignments: [{ ...assignment, id: 'preview-' + e.row }], archivedAt: null } as any);
      } catch (error: any) {
        errorCount++;
        errors.push(`Dòng ${e.row}: ${error.code ? 'Không thể lưu dòng dữ liệu' : error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      preview: !commit,
      detectedType: 'DS_TONG',
      detectedTypeName: 'Hồ sơ nhân sự tổng (DS_TONG)',
      sheetUsed: targetSheetName,
      summary: { totalRows: entries.length, successCount, readyCount, duplicateCount, errorCount, rehireCount },
      errors,
      warnings
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Không thể đọc file Excel. ' + (err?.message || 'Kiểm tra định dạng và thử lại.') }, { status: 400 });
  }
}
