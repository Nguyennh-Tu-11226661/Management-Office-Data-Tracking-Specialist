import {splitImportReview} from '@/lib/import-review';
import {saveImportSource} from '@/lib/import-source-store';
import {sourceMonth,sourceRewardAmount,sourceStatuses} from '@/lib/source-format';
import {dateKey} from '@/lib/worker-validation';
import {matchFactory} from '@/lib/factory-matching';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { guard, identity } from '@/lib/auth';
import { phoneKey } from '@/lib/worker-validation';
import { parseImportRow } from '@/lib/worker-import';
import { assignmentRelations, today, day } from '@/lib/domain';

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const googleSheetUrl = String(form.get('googleSheetUrl') || '').trim();
    const file = form.get('file');

    let fileBuffer: Buffer;
    let fileName: string;

    if (googleSheetUrl) {
      const match = googleSheetUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        return NextResponse.json({ success: false, message: 'Đường dẫn Google Sheets không hợp lệ. Vui lòng kiểm tra lại.' }, { status: 400 });
      }
      const spreadsheetId = match[1];
      const gidMatch = googleSheetUrl.match(/[#&?]gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '';
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx${gid ? `&gid=${gid}` : ''}`;
      
      try {
        const gRes = await fetch(exportUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (!gRes.ok) {
          return NextResponse.json({
            success: false,
            message: 'Không thể tải bảng tính từ Google Sheets. Vui lòng đảm bảo bảng tính đã được mở quyền "Bất kỳ ai có đường liên kết đều có thể xem".'
          }, { status: 400 });
        }
        fileBuffer = Buffer.from(await gRes.arrayBuffer());
        fileName = `GoogleSheet_${spreadsheetId.substring(0, 8)}.xlsx`;
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: 'Lỗi kết nối tới Google Sheets: ' + (err?.message || 'Không thể truy cập')
        }, { status: 400 });
      }
    } else {
      if (!file || typeof file === 'string' || file.size > 50 * 1024 * 1024 || !file.size || !file.name.toLowerCase().endsWith('.xlsx')) {
        return NextResponse.json({ success: false, message: 'Chọn file .xlsx tối đa 50 MB hoặc nhập link Google Sheets hợp lệ' }, { status: 400 });
      }
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;
    }

    const commit = form.get('confirm') === 'true';
    const confirmPhone = form.get('confirmPhoneDuplicate') === 'true';
    const confirmActive = form.get('confirmActiveDuplicate') === 'true';
    const actor = (await identity(request))!;
    const requestedType = String(form.get('importType') || 'AUTO').toUpperCase();

    const book = XLSX.read(fileBuffer, { type: 'buffer' });
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
      let h: string[] = [];
      for (const row of m.slice(0, 5)) {
        const rowStr = (row || []).map((v: any) => String(v).trim().toLowerCase()).join(' ');
        if (rowStr.includes('cccd') || rowStr.includes('họ tên') || rowStr.includes('thưởng') || rowStr.includes('stk')) {
          h = (row || []).map((v: any) => String(v).trim());
          break;
        }
      }
      if (!h.length && m[0]) {
        h = (m[0] || []).map((v: any) => String(v).trim());
      }
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

    const typeDenied=await guard(request,detectedType==='DS_THUONG'?'bonus:write':detectedType==='BANK_ACCOUNTS'?'bank:write':'worker:write');if(typeDenied)return typeDenied;
    const sheet = book.Sheets[targetSheetName];
    if (!sheet) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy sheet ${targetSheetName} phù hợp trong file Excel. Vui lòng kiểm tra lại.`
      }, { status: 400 });
    }

    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', blankrows: true });
    
    // Tìm dòng tiêu đề hợp lệ trong 10 dòng đầu
    let headerRowIndex = -1;
    let headers: string[] = [];

    const headerKeywordsByType: Record<string, string[]> = {
      DS_TONG: ['họ và tên', 'họ tên', 'số cccd', 'cccd', 'cmt', 'nhà máy pv', 'ngày pv', 'tình trạng', 'mã nv', 'stt'],
      DS_THUONG: ['thưởng lần 1', 'tổng thưởng', 'chính sách', 'số cccd', 'cccd', 'họ tên', 'họ và tên', 'ngày pv', 'công ty', 'stt'],
      BANK_ACCOUNTS: ['stk', 'số tài khoản', 'cmt/cccd', 'số cccd', 'cccd', 'tên chủ tài khoản', 'ngân hàng', 'tình trạng stk', 'tt', 'stt']
    };

    const targetKeywords = headerKeywordsByType[detectedType] || ['cccd', 'họ tên', 'họ và tên'];

    for (let rIdx = 0; rIdx < Math.min(matrix.length, 10); rIdx++) {
      const row = matrix[rIdx];
      if (!Array.isArray(row) || !row.length) continue;
      const rowStrArr = row.map(v => String(v ?? '').trim());
      const rowLower = rowStrArr.map(v => v.toLowerCase());

      // Nếu dòng chứa dữ liệu cá nhân rõ ràng (như dãy 9-12 số của CCCD hoặc số điện thoại), chắc chắn đây không phải dòng tiêu đề
      const hasPersonalData = rowStrArr.some(v => /^0\d{8,11}$/.test(v) || /^0\d{9,10}$/.test(v));
      if (hasPersonalData) continue;

      const matchCount = targetKeywords.filter(k => rowLower.some(cell => cell.includes(k))).length;
      if (matchCount >= 2 || (profile && rowLower.some(c => c.length > 0))) {
        headerRowIndex = rIdx;
        headers = rowStrArr;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({
        success: false,
        message: 'File Excel không có dòng tiêu đề cột hợp lệ (thiếu các cột bắt buộc như Họ tên, CCCD...). Vui lòng kiểm tra lại hàng đầu tiên của file.'
      }, { status: 400 });
    }

    const entries = matrix.slice(headerRowIndex + 1).map((values, index) => ({
      row: headerRowIndex + index + 2,
      raw: Object.fromEntries(headers.map((h, i) => [h, values[i]])),
      values
    })).filter(e => e.values.some(v => String(v ?? '').trim() !== ''));

    if (!entries.length || entries.length > 50000) {
      return NextResponse.json({ success: false, message: 'File cần từ 1 đến 50.000 dòng dữ liệu' }, { status: 400 });
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
          const month = sourceMonth(raw['Tháng'],String(raw['Ngày PV']||''));if(!month)throw new Error('Thiếu tháng thưởng');
          const interviewDate = String(raw['Ngày PV'] || '').trim();
          const policy = String(raw['Chính sách'] || '').trim();
          const workerCode = String(raw['Mã nhân viên'] || raw['Mã NV'] || '').trim();
          const stk = raw['STK'] ? String(raw['STK']).trim() : '';
          const bankName = raw['Ngân hàng'] ? String(raw['Ngân hàng']).trim() : '';

          const parseBonus = sourceRewardAmount;
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

          if (!worker) throw new Error('CCCD chưa có hồ sơ; nhập DS_TONG trước');
          if(typeof cccdRaw==='number')throw new Error('CCCD phải là Text');
          const candidates = worker.assignments.filter(a =>
            (matchFactory(a.interviewFactory, company) || matchFactory(a.workingFactory, company)) &&
            (!workerCode || a.employeeCode === workerCode || worker!.code === workerCode)
          );
          let selectedAssignment = null;
          if (candidates.length === 1) {
            selectedAssignment = candidates[0];
          } else if (candidates.length > 1) {
            const exactDate = candidates.find(a => !!dateKey(interviewDate) && dateKey(a.interviewDate || '') === dateKey(interviewDate));
            selectedAssignment = exactDate || candidates[0];
          }
          if (!selectedAssignment) throw new Error('Không xác định duy nhất đợt theo CCCD, công ty, ngày PV và mã NV');
          const sourceNote=JSON.stringify({source:'SOURCE_EXCEL_ACTUAL_PAID',monthOriginal:raw['Tháng'],sourceValues:raw,rewards:Array.from({length:7},(_,i)=>String(raw['Thưởng lần '+(i+1)]||'')),paymentDate:null,reference:null});

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

              const assignmentId=selectedAssignment.id;
              const existingBonus = await tx.bonusRecord.findFirst({
                where: {
                  workerId: worker.id,
                  month,
                  company: company || undefined, assignmentId
                }
              });

              if(existingBonus)throw new Error('Bản thưởng của đợt đã có; không tự ghi đè');
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
                    status: 'DRAFT', note: sourceNote,
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
                    status: 'DRAFT', note: sourceNote
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
                      verificationStatus: 'UNVERIFIED',
                      isNameVerified: false,
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

      const review=splitImportReview([...warnings,...errors]);
    const sourceId=commit?await saveImportSource(detectedType,fileName,targetSheetName,entries,warnings,errors):null;
      return NextResponse.json({
        review, sourceId, normalizedSaved:successCount, sourceRowsSaved:commit?entries.length:0,mainSourceRows:entries.length-review.duplicateRows,pendingDuplicateCount:review.duplicateRows,
        success: true,
        preview: !commit,
        detectedType: 'DS_THUONG',
        detectedTypeName: 'Bảng thưởng các lần 1 → 7 (DS_THUONG)',
        sheetUsed: targetSheetName,
        summary: { totalRows: entries.length, successCount:commit?entries.length:0, readyCount:commit?0:entries.length, duplicateCount:review.duplicateRows, errorCount:0, warningCount:review.warningRows, cleanCount:entries.length-review.reviewRows, rehireCount }, normalizationErrors:errors,
        errors:[],
        warnings:review.warnings.map(i=>i.message), duplicates:review.duplicates.map(i=>i.message)
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

          if(worker?.bankAccounts.some(a=>a.accountNumber===accountNumber))throw new Error('STK trùng hồ sơ đã có — giữ riêng chờ kiểm tra');
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

              if(existingBank)throw new Error('STK trùng hồ sơ đã có — giữ riêng chờ kiểm tra');
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

      const review=splitImportReview([...warnings,...errors]);
    const sourceId=commit?await saveImportSource(detectedType,fileName,targetSheetName,entries,warnings,errors):null;
      return NextResponse.json({
        review, sourceId, normalizedSaved:successCount, sourceRowsSaved:commit?entries.length:0,mainSourceRows:entries.length-review.duplicateRows,pendingDuplicateCount:review.duplicateRows,
        success: true,
        preview: !commit,
        detectedType: 'BANK_ACCOUNTS',
        detectedTypeName: 'Đối soát số tài khoản ngân hàng (STK)',
        sheetUsed: targetSheetName,
        summary: { totalRows: entries.length, successCount:commit?entries.length:0, readyCount:commit?0:entries.length, duplicateCount:review.duplicateRows, errorCount:0, warningCount:review.warningRows, cleanCount:entries.length-review.reviewRows, rehireCount }, normalizationErrors:errors,
        errors:[],
        warnings:review.warnings.map(i=>i.message), duplicates:review.duplicates.map(i=>i.message)
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

    const seenInFile = new Map<string, number>();

    for (const e of entries) {
      try {
        let raw = e.raw;
        if (mapping) {
          raw = { ...raw };
          for (const [field, column] of Object.entries(mapping)) {
            if (labels[field]) raw[labels[field]] = e.raw[String(column).trim()];
          }
        }
        const { worker, assignment } = parseImportRow(raw,true);
        if (assignment.interviewResult === 'PASS' && !raw['Ngày đỗ'] && !raw['Ngày PV đỗ']) {
          warnings.push(`Dòng ${e.row}: nguồn xác nhận Đỗ, ngày đỗ dùng ngày PV; kiểm tra ở bước xem trước.`);
        }
        const rowWarnings:string[]=[];try{parseImportRow(raw);}catch(issue:any){rowWarnings.push(issue.message);warnings.push(`Dòng ${e.row}: giữ thông tin nguồn, cần kiểm tra: ${issue.message}`);}
        if (!assignment.interviewDate||!dateKey(assignment.interviewDate)) throw new Error('Cần ngày PV để lưu đúng lượt tuyển và báo cáo');
        if (!statuses.some(s => s.name === assignment.status)&&!sourceStatuses.includes(assignment.status)) throw new Error('Trạng thái chưa có trong danh mục: ' + assignment.status);
        for (const k of ['orderId', 'batchId']) if (!assignment[k]) delete assignment[k];

        // 1. Kiểm tra trùng lặp nội bộ trong file (cùng CCCD + Nhà máy PV + Ngày PV)
        const fileKey = `${worker.idCard}|${assignment.interviewFactory || ''}|${dateKey(assignment.interviewDate) || ''}`;
        if (seenInFile.has(fileKey)) {
          duplicateCount++;
          errors.push(`Dòng ${e.row}: Trùng lặp nội bộ file với dòng ${seenInFile.get(fileKey)} (cùng CCCD ${worker.idCard} và lượt phỏng vấn).`);
          continue;
        }
        seenInFile.set(fileKey, e.row);

        const old = people.get(worker.idCard);
        if (old?.archivedAt) throw new Error('Hồ sơ đã lưu trữ, khôi phục trước khi nhập đợt mới');
        
        // 2. Kiểm tra sai lệch danh tính (cùng CCCD nhưng khác họ tên)
        if (old && old.fullName && worker.fullName && old.fullName.trim().toLocaleLowerCase('vi') !== worker.fullName.trim().toLocaleLowerCase('vi')) {
          duplicateCount++;
          errors.push(`Dòng ${e.row}: Sai lệch danh tính — CCCD ${worker.idCard} có họ tên trong file là "${worker.fullName}" nhưng trong CSDL là "${old.fullName}".`);
          continue;
        }

        // 3. Tìm lượt tuyển đã có trong CSDL để Cập nhật (Update) hoặc Đồng bộ (Sync)
        const matchAssignment = old?.assignments.find(a =>
          identityKey(a) === identityKey(assignment) ||
          (a.interviewFactory === assignment.interviewFactory && dateKey(a.interviewDate) === dateKey(assignment.interviewDate)) ||
          (assignment.employeeCode && a.employeeCode === assignment.employeeCode && a.interviewFactory === assignment.interviewFactory)
        );

        // 4. Cảnh báo nghiệp vụ (không chặn nạp): Chưa báo nghỉ & Trùng SĐT
        if (!matchAssignment) {
          const activeAssignment = old?.assignments.find(a => warns.has(a.status) || (!a.leaveDate && ['đang làm việc', 'đang lv', 'hết phí', 'chưa đào tạo', 'lv'].some(s => (a.status || '').toLowerCase().includes(s))));
          if (activeAssignment) {
            const actFactory = activeAssignment.workingFactory || activeAssignment.interviewFactory || 'Xưởng cũ';
            warnings.push(`Dòng ${e.row}: [CHƯA BÁO NGHỈ] Đang làm việc tại ${actFactory} nhưng đăng ký PV tại ${assignment.interviewFactory || 'xưởng mới'}.`);
          }

          const activePhoneWorker = worker.phone && [...people.values()].find(w => w.idCard !== worker.idCard && w.phone && phoneKey(w.phone) === worker.phone && !w.archivedAt && w.assignments.some(a => warns.has(a.status) || (!a.leaveDate && ['đang làm việc', 'đang lv', 'hết phí', 'chưa đào tạo', 'lv'].some(s => (a.status || '').toLowerCase().includes(s)))));
          if (activePhoneWorker) {
            warnings.push(`Dòng ${e.row}: [CHÚ Ý SĐT] SĐT ${worker.phone} đang trùng với công nhân ${activePhoneWorker.fullName} (${activePhoneWorker.idCard}).`);
          }
        }

        const sourceStatus=sourceStatuses.includes(assignment.status)&&!statuses.some(s=>s.name===assignment.status);
        if(sourceStatus)warnings.push(`Dòng ${e.row}: giữ nguyên mã tình trạng nguồn ${assignment.status}; chưa diễn giải.`);
        if(!sourceStatus)await assignmentRelations(prisma, assignment);

        if (commit) {
          await prisma.$transaction(async tx => {
            if(sourceStatus)await tx.laborStatus.upsert({where:{name:assignment.status},create:{name:assignment.status,category:'SOURCE',warnsDuplicate:false,endsAssignment:false},update:{}});
            
            if (matchAssignment) {
              // Cập nhật thông tin mới nhất vào lượt tuyển đã có
              const updated = await tx.workAssignment.update({
                where: { id: matchAssignment.id },
                data: {
                  status: assignment.status || matchAssignment.status,
                  employeeCode: assignment.employeeCode || matchAssignment.employeeCode,
                  interviewResult: assignment.interviewResult || matchAssignment.interviewResult,
                  passedDate: assignment.passedDate || matchAssignment.passedDate,
                  startDate: assignment.startDate || matchAssignment.startDate,
                  leaveDate: assignment.leaveDate !== undefined ? (assignment.leaveDate || null) : matchAssignment.leaveDate,
                  leaveReason: assignment.leaveReason || matchAssignment.leaveReason,
                  team: assignment.team || matchAssignment.team,
                  recruiter: assignment.recruiter || matchAssignment.recruiter,
                  contractType: assignment.contractType || matchAssignment.contractType,
                  shuttleBusKtx: assignment.shuttleBusKtx || matchAssignment.shuttleBusKtx,
                }
              });
              if (worker.phone || worker.dob || worker.gender || worker.province) {
                await tx.worker.update({
                  where: { id: old!.id },
                  data: {
                    phone: worker.phone || old!.phone,
                    dob: worker.dob || old!.dob,
                    gender: worker.gender || old!.gender,
                    province: worker.province || old!.province,
                  }
                });
              }
              await tx.assignmentEvent.create({ data: { assignmentId: updated.id, occurredOn: today(), toStatus: updated.status, interviewResult: updated.interviewResult, operator: actor.username, note: 'Import Excel (Update) — source:'+JSON.stringify({row:e.row,sheet:targetSheetName,file:fileName,values:raw,warnings:rowWarnings}) } });
              await tx.auditLog.create({ data: { module: 'WORKER', action: 'UPDATE', operator: actor.username, details: `Dòng ${e.row}: cập nhật hồ sơ ${old!.id}, lượt ${updated.id}` } });
            } else {
              // Thêm mới hoặc tái tuyển dụng
              let person = await tx.worker.findUnique({ where: { idCard: worker.idCard }, include: { assignments: true } });
              if (!person) person = await tx.worker.create({ data: { ...worker, fullName: worker.fullName, idCard: worker.idCard }, include: { assignments: true } });
              const a = await tx.workAssignment.create({ data: { ...assignment, interviewFactory: assignment.interviewFactory, workerId: person.id } });
              await tx.assignmentEvent.create({ data: { assignmentId: a.id, occurredOn: today(), toStatus: a.status, interviewResult: a.interviewResult, operator: actor.username, note: 'Import Excel — source:'+JSON.stringify({row:e.row,sheet:targetSheetName,file:fileName,values:raw,warnings:rowWarnings}) } });
              await tx.auditLog.create({ data: { module: 'WORKER', action: 'IMPORT', operator: actor.username, details: `Dòng ${e.row}: hồ sơ ${person.id}, lượt ${a.id}${old ? ' (thêm lịch sử vào hồ sơ cũ)' : ''}` } });
            }
          });
          successCount++;
        } else {
          readyCount++;
        }

        if (old) {
          if (!matchAssignment) {
            rehireCount++;
            old.assignments.push({ ...assignment, id: 'preview-' + e.row } as any);
          }
        } else {
          people.set(worker.idCard, { ...worker, id: 'preview-' + e.row, assignments: [{ ...assignment, id: 'preview-' + e.row }], archivedAt: null } as any);
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`Dòng ${e.row}: ${error.code ? 'Không thể lưu dòng dữ liệu' : error.message}`);
      }
    }

    const review=splitImportReview([...warnings,...errors]);
    const sourceId=commit?await saveImportSource(detectedType,fileName,targetSheetName,entries,warnings,errors):null;
    return NextResponse.json({
      review, sourceId, normalizedSaved:successCount, sourceRowsSaved:commit?entries.length:0,mainSourceRows:entries.length-review.duplicateRows,pendingDuplicateCount:review.duplicateRows,
      success: true,
      preview: !commit,
      detectedType: 'DS_TONG',
      detectedTypeName: 'Hồ sơ nhân sự tổng (DS_TONG)',
      sheetUsed: targetSheetName,
      summary: { totalRows: entries.length, successCount:commit?entries.length:0, readyCount:commit?0:entries.length, duplicateCount:review.duplicateRows, errorCount:0, warningCount:review.warningRows, cleanCount:entries.length-review.reviewRows, rehireCount }, normalizationErrors:errors,
      errors:[],
      warnings:review.warnings.map(i=>i.message), duplicates:review.duplicates.map(i=>i.message)
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Không thể đọc file Excel. ' + (err?.message || 'Kiểm tra định dạng và thử lại.') }, { status: 400 });
  }
}
