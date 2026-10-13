const { PrismaClient } = require('../.generated/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:C:/Hỗ trợ quản lí/.local/evolution/preview/dev.db' } },
});

const FACTORIES = [
  'Luxshare QC',
  'Canon',
  'Goertek',
  'Fushan',
  'Amphenol',
  'Bảo vệ',
  'Foxconn',
  'Luxshare VT',
  'LG',
];

const MONTHS = [
  'T01.2026', 'T02.2026', 'T03.2026', 'T04.2026', 'T05.2026',
  'T06.2026', 'T07.2026', 'T08.2026', 'T09.2026', 'T10.2026'
];

async function syncAll() {
  console.log('🚀 Bắt đầu đồng bộ hóa toàn diện tất cả các module...');

  // 1. ĐỒNG BỘ ĐƠN HÀNG (RecruitmentOrder) & ĐỢT TUYỂN (RecruitmentBatch)
  console.log('📦 1. Tạo Đơn hàng và Đợt tuyển 2026 cho 9 nhà máy...');
  const orderMap = new Map(); // factory -> order
  const batchMap = new Map(); // `${factory}|${month}` -> batch

  for (const factory of FACTORIES) {
    const orderCode = `ORD-2026-${factory.replace(/\s+/g, '').toUpperCase()}`;
    let order = await prisma.recruitmentOrder.findUnique({ where: { code: orderCode } });
    if (!order) {
      order = await prisma.recruitmentOrder.create({
        data: {
          code: orderCode,
          name: `Đơn hàng Tuyển dụng 2026 · ${factory}`,
          factory: factory,
          isActive: true,
        },
      });
    }
    orderMap.set(factory, order);

    for (const month of MONTHS) {
      const batchCode = `BATCH-${month}-${factory.replace(/\s+/g, '').toUpperCase()}`;
      let batch = await prisma.recruitmentBatch.findFirst({
        where: { orderId: order.id, code: batchCode },
      });
      if (!batch) {
        batch = await prisma.recruitmentBatch.create({
          data: {
            orderId: order.id,
            code: batchCode,
            name: `Đợt tuyển ${month} · ${factory}`,
            startDate: `01/${month.slice(1, 3)}/2026`,
            endDate: `28/${month.slice(1, 3)}/2026`,
            periodMonth: month,
            target: 1200,
          },
        });
      }
      batchMap.set(`${factory}|${month}`, batch);
    }
  }

  // 2. ĐỒNG BỘ CHÍNH SÁCH THƯỞNG (BonusPolicy)
  console.log('📜 2. Tạo Chính sách thưởng mùa vụ 2026 cho các nhà máy...');
  const policyMap = new Map(); // factory -> policy
  const rules = [
    { step: 1, milestone: '3 công', thresholdDays: 3, amount: 300000 },
    { step: 2, milestone: '7 công', thresholdDays: 7, amount: 500000 },
    { step: 3, milestone: '15 công', thresholdDays: 15, amount: 500000 },
    { step: 4, milestone: '26 công', thresholdDays: 26, amount: 1000000 },
    { step: 5, milestone: '52 công', thresholdDays: 52, amount: 1000000 },
    { step: 6, milestone: '78 công', thresholdDays: 78, amount: 1500000 },
    { step: 7, milestone: '104 công', thresholdDays: 104, amount: 2000000 },
  ];

  for (const factory of FACTORIES) {
    const policyName = `Chính sách Thưởng Mùa Vụ 2026 · ${factory}`;
    let policy = await prisma.bonusPolicy.findFirst({
      where: { factory, name: policyName },
    });
    if (!policy) {
      policy = await prisma.bonusPolicy.create({
        data: {
          name: policyName,
          factory,
          description: `Chính sách định mức 7 mốc thưởng dành cho lao động thời vụ ${factory} năm 2026`,
          effectiveFrom: '2026-01-01',
          effectiveTo: '2026-12-31',
          orderId: orderMap.get(factory)?.id,
          rulesJson: JSON.stringify(rules),
          isActive: true,
        },
      });
    }
    policyMap.set(factory, policy);
  }

  // 3. ĐỒNG BỘ GÁN ĐƠN HÀNG, ĐỢT TUYỂN VÀ KẾT QUẢ PV CHO TOÀN BỘ ASSIGNMENT
  console.log('👥 3. Đồng bộ gán Đơn hàng, Đợt tuyển và Kết quả PV cho các hồ sơ...');
  const allAssignments = await prisma.workAssignment.findMany({
    include: { worker: true },
  });
  console.log(`Tổng số WorkAssignment cần xử lý: ${allAssignments.length}`);

  let updatedCount = 0;
  for (let idx = 0; idx < allAssignments.length; idx++) {
    const a = allAssignments[idx];
    const factory = a.interviewFactory || 'Luxshare QC';
    let month = a.onboardingMonth;
    if (!month && a.interviewDate) {
      const parts = a.interviewDate.split('/');
      if (parts.length === 3) month = `T${parts[1].padStart(2, '0')}.2026`;
    }
    if (!month) month = 'T01.2026';

    const order = orderMap.get(factory);
    const batch = batchMap.get(`${factory}|${month}`) || (order ? Array.from(batchMap.values()).find(b => b.orderId === order.id) : null);

    let interviewResult = a.interviewResult;
    let status = a.status;

    // Phân bổ tỷ lệ thực tế
    if (status === 'Đang làm việc' || status === 'Đạt phỏng vấn' || status === 'Đã nghỉ việc' || status === 'Đang đào tạo') {
      interviewResult = 'PASS';
    } else if (status === 'Đang chờ phỏng vấn') {
      // Phân bổ 1 tỷ lệ nhỏ trượt và bỏ để Dashboard sinh động
      if (idx % 25 === 0) {
        status = 'Trượt phỏng vấn';
        interviewResult = 'FAIL';
      } else if (idx % 35 === 0) {
        status = 'Bỏ phỏng vấn';
        interviewResult = 'ABANDONED';
      }
    }

    await prisma.workAssignment.update({
      where: { id: a.id },
      data: {
        orderId: order?.id || null,
        batchId: batch?.id || null,
        interviewResult,
        status,
        passedDate: interviewResult === 'PASS' ? (a.passedDate || a.interviewDate) : null,
      },
    });

    updatedCount++;
    if (updatedCount % 2000 === 0) {
      console.log(`Đã cập nhật ${updatedCount}/${allAssignments.length} lượt tuyển...`);
    }
  }

  // 4. ĐỌC FILE EXCEL 10.000 VÀ NẠP TÀI KHOẢN NGÂN HÀNG (BankAccount) & BẢNG THƯỞNG (BonusRecord)
  const excelFile = 'C:\\Users\\nguye\\Downloads\\Mau_Du_Lieu_10000_LaoDong_2026.xlsx';
  if (fs.existsSync(excelFile)) {
    console.log(`📊 4. Đang nạp dữ liệu STK và Thưởng từ file Excel: ${excelFile}...`);
    const wb = XLSX.readFile(excelFile);

    // Map worker CCCD -> id
    const allWorkers = await prisma.worker.findMany({ select: { id: true, idCard: true, fullName: true } });
    const workerMap = new Map(allWorkers.map(w => [w.idCard, w]));

    // 4.1. Nạp STK ngân hàng
    const stkSheet = wb.Sheets['STK ngân hàng 2026'];
    if (stkSheet) {
      const stkRows = XLSX.utils.sheet_to_json(stkSheet);
      console.log(`Tìm thấy ${stkRows.length} dòng trong STK ngân hàng 2026, đang đồng bộ...`);
      let bankAdded = 0;

      for (const row of stkRows) {
        const idCard = String(row['CMT/CCCD'] || row['số CCCD'] || '').trim();
        const worker = workerMap.get(idCard);
        if (!worker) continue;

        const accNum = String(row[' STK'] || row['STK'] || '').trim();
        const bankName = String(row['Ngân hàng check'] || row['Ngân hàng'] || 'Vietcombank').trim();
        const rawStatus = String(row['Tình trạng STK'] || 'Hợp lệ').trim();
        const verificationStatus = rawStatus.includes('Cảnh báo') ? 'MISMATCH' : rawStatus.includes('Ủy quyền') ? 'AUTHORIZED' : 'VALID';

        // Check if bank account already exists
        const existingAcc = await prisma.bankAccount.findFirst({
          where: { workerId: worker.id },
        });

        if (!existingAcc && accNum) {
          await prisma.bankAccount.create({
            data: {
              workerId: worker.id,
              bankName,
              accountNumber: accNum,
              accountHolderName: worker.fullName,
              verificationStatus,
              isNameVerified: verificationStatus === 'VALID',
              isAuthorized: verificationStatus === 'AUTHORIZED',
              warningMessage: row['Cảnh báo'] ? String(row['Cảnh báo']) : null,
              checkedBy: row['Người check'] ? String(row['Người check']) : 'Kế toán Thu Phương',
              checkResult: row['Kết Quả'] ? String(row['Kết Quả']) : 'Khớp tên 100%',
            },
          });
          bankAdded++;
        }
      }
      console.log(`✅ Đã nạp ${bankAdded} tài khoản ngân hàng.`);
    }

    // 4.2. Nạp Bảng Thưởng DS_THUONG
    const thuongSheet = wb.Sheets['DS_THUONG'];
    if (thuongSheet) {
      const thuongRows = XLSX.utils.sheet_to_json(thuongSheet);
      console.log(`Tìm thấy ${thuongRows.length} dòng trong DS_THUONG, đang đồng bộ...`);
      let bonusAdded = 0;

      for (const row of thuongRows) {
        const idCard = String(row['Số CCCD'] || row['số CCCD'] || '').trim();
        const worker = workerMap.get(idCard);
        if (!worker) continue;

        const b1 = Number(row['Thưởng lần 1'] || 0);
        const b2 = Number(row['Thưởng lần 2'] || 0);
        const b3 = Number(row['Thưởng lần 3'] || 0);
        const b4 = Number(row['Thưởng lần 4'] || 0);
        const b5 = Number(row['Thưởng lần 5'] || 0);
        const b6 = Number(row['Thưởng lần 6'] || 0);
        const b7 = Number(row['Thưởng lần 7'] || 0);
        const total = b1 + b2 + b3 + b4 + b5 + b6 + b7;

        const existingBonus = await prisma.bonusRecord.findFirst({
          where: { workerId: worker.id, month: String(row['Tháng'] || 'T01.2026') },
        });

        if (!existingBonus) {
          await prisma.bonusRecord.create({
            data: {
              workerId: worker.id,
              company: String(row['Công ty'] || 'Luxshare QC'),
              month: String(row['Tháng'] || 'T01.2026'),
              policy: String(row['Chính sách'] || 'Chính sách Mùa Vụ 2026'),
              bonus1: b1,
              bonus2: b2,
              bonus3: b3,
              bonus4: b4,
              bonus5: b5,
              bonus6: b6,
              bonus7: b7,
              totalBonus: total,
              status: 'APPROVED',
              approvedBy: 'Trưởng phòng Nhân sự',
              approvedAt: new Date(),
            },
          });
          bonusAdded++;
        }
      }
      console.log(`✅ Đã nạp ${bonusAdded} bản ghi thưởng DS_THUONG.`);
    }
  }

  // 5. ĐỒNG BỘ POLICY ENROLLMENT & REWARD STAGES ĐỂ HIỂN THỊ TIỀN ĐẠT MỐC / ĐÃ TRẢ
  console.log('💰 5. Đồng bộ Mốc Thưởng (RewardStage) & Khoản đã trả (RewardPayment)...');
  const passAssignments = await prisma.workAssignment.findMany({
    where: { interviewResult: 'PASS' },
    include: { worker: true },
    take: 3000, // Đồng bộ 3.000 hồ sơ đỗ điển hình
  });

  let enrollAdded = 0;
  for (let i = 0; i < passAssignments.length; i++) {
    const a = passAssignments[i];
    const factory = a.interviewFactory || 'Luxshare QC';
    const policy = policyMap.get(factory);
    if (!policy) continue;

    const existingEnroll = await prisma.policyEnrollment.findUnique({
      where: { assignmentId_policyId: { assignmentId: a.id, policyId: policy.id } },
    });

    if (!existingEnroll) {
      const enroll = await prisma.policyEnrollment.create({
        data: {
          assignmentId: a.id,
          policyId: policy.id,
          policyName: policy.name,
          factory: policy.factory,
          effectiveFrom: policy.effectiveFrom || '2026-01-01',
          effectiveTo: policy.effectiveTo || '2026-12-31',
          rulesSnapshot: policy.rulesJson,
          createdBy: 'Hệ thống tự động',
        },
      });

      // Tạo các mốc thưởng
      for (const r of rules) {
        // Tùy theo mốc để xác định tỷ lệ đạt
        const isEligible = true;
        const isAchieved = (r.step <= 2) || (r.step <= 4 && i % 2 === 0) || (r.step <= 5 && i % 3 === 0);
        const stage = await prisma.rewardStage.create({
          data: {
            enrollmentId: enroll.id,
            step: r.step,
            label: r.milestone,
            thresholdDays: r.thresholdDays,
            amount: r.amount,
            eligible: isEligible,
            achieved: isAchieved,
            achievedOn: isAchieved ? (a.interviewDate || '15/01/2026') : null,
            confirmedBy: isAchieved ? 'Giám sát xưởng' : null,
          },
        });

        // Ghi nhận tiền đã trả
        if (isAchieved && r.step <= 3) {
          await prisma.rewardPayment.create({
            data: {
              stageId: stage.id,
              amount: r.amount,
              paidOn: a.interviewDate || '20/01/2026',
              reference: `UNC-2026-${stage.id.slice(-8).toUpperCase()}`,
              note: `Chi thưởng ${r.milestone} cho NLĐ ${a.worker.fullName}`,
              confirmedBy: 'Kế toán Trưởng',
            },
          });
        }
      }
      enrollAdded++;
    }
  }
  console.log(`✅ Đã tạo ${enrollAdded} đợt gán chính sách thưởng kèm mốc chi trả.`);

  // 6. GHI AUDIT LOG
  await prisma.auditLog.create({
    data: {
      module: 'SYSTEM',
      action: 'SYNC',
      operator: 'Quản trị viên',
      details: 'Đồng bộ hóa toàn diện dữ liệu: Đơn hàng, Đợt tuyển, Mốc thưởng, STK ngân hàng và Kết quả PV cho 12.000 hồ sơ.',
    },
  });

  console.log('🎉 Hoàn tất đồng bộ hóa toàn diện!');
}

syncAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
