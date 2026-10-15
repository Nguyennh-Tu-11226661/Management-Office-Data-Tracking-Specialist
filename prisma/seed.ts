import { PrismaClient } from "../.generated/client";

const prisma = new PrismaClient();

const FACTORIES = [
  "Luxshare QC",
  "Canon",
  "Goertek",
  "Fushan",
  "Amphenol",
  "Foxconn",
  "Luxshare VT",
  "LG",
  "Bảo vệ",
];

const SAMPLE_WORKERS = [
  {
    fullName: "Nguyễn Văn An",
    idCard: "038096001234",
    phone: "0981234567",
    dob: "15/04/1998",
    gender: "Nam",
    idCardDate: "10/05/2021",
    address: "Diễn Châu, Nghệ An",
    recruiter: "Nguyễn Thu Trang",
    team: "Team Hà Nội 1",
    source: "Facebook Tuyển dụng",
    factory: "Luxshare QC",
    status: "Đang làm việc",
    interviewDate: "05/01/2026",
    standardTrainingDate: "07/01/2026",
    onboardingMonth: "T01.2026",
    bankName: "Vietcombank",
    accountNumber: "1023456789",
    accountHolder: "NGUYEN VAN AN",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 500000,
    bonus3: 500000,
    bonus4: 1000000,
  },
  {
    fullName: "Trần Thị Mai",
    idCard: "037199002345",
    phone: "0978654321",
    dob: "20/08/2001",
    gender: "Nữ",
    idCardDate: "12/03/2022",
    address: "Hoằng Hóa, Thanh Hóa",
    recruiter: "Lê Hoàng Nam",
    team: "Team Miền Trung",
    source: "Giới thiệu",
    factory: "Canon",
    status: "Đang làm việc",
    interviewDate: "10/01/2026",
    standardTrainingDate: "12/01/2026",
    onboardingMonth: "T01.2026",
    bankName: "Techcombank",
    accountNumber: "19034567890123",
    accountHolder: "TRAN THI MAI",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 500000,
    bonus3: 0,
    bonus4: 0,
  },
  {
    fullName: "Lê Văn Tuấn",
    idCard: "024095003456",
    phone: "0912348765",
    dob: "02/11/1995",
    gender: "Nam",
    idCardDate: "25/07/2020",
    address: "Lục Ngạn, Bắc Giang",
    recruiter: "Nguyễn Thu Trang",
    team: "Team Hà Nội 1",
    source: "Tự do",
    factory: "Goertek",
    status: "Đã nghỉ việc",
    leaveDate: "28/01/2026",
    leaveReason: "Việc gia đình",
    interviewDate: "08/01/2026",
    standardTrainingDate: "10/01/2026",
    onboardingMonth: "T01.2026",
    bankName: "MB Bank",
    accountNumber: "0388999888",
    accountHolder: "LE VAN TUAN",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 0,
    bonus3: 0,
    bonus4: 0,
  },
  {
    fullName: "Hoàng Thị Hoa",
    idCard: "019198004567",
    phone: "0965432198",
    dob: "05/03/1998",
    gender: "Nữ",
    idCardDate: "18/09/2021",
    address: "Phổ Yên, Thái Nguyên",
    recruiter: "Trần Minh Đức",
    team: "Team Thái Nguyên",
    source: "Zalo",
    factory: "Fushan",
    status: "Đang làm việc",
    interviewDate: "15/01/2026",
    standardTrainingDate: "17/01/2026",
    onboardingMonth: "T01.2026",
    bankName: "VietinBank",
    accountNumber: "108877665544",
    accountHolder: "NGUYEN VAN MANH",
    isNameVerified: false,
    isAuthorized: true,
    authorizedRelation: "Chồng",
    warningMessage:
      "Lệch tên CCCD (Tên trên thẻ là NGUYEN VAN MANH, CCCD là Hoàng Thị Hoa)",
    bonus1: 300000,
    bonus2: 500000,
    bonus3: 500000,
    bonus4: 0,
  },
  {
    fullName: "Phạm Quốc Bảo",
    idCard: "030097005678",
    phone: "0943216789",
    dob: "12/12/1997",
    gender: "Nam",
    idCardDate: "14/04/2021",
    address: "Kim Sơn, Ninh Bình",
    recruiter: "Lê Hoàng Nam",
    team: "Team Miền Trung",
    source: "Facebook Tuyển dụng",
    factory: "Foxconn",
    status: "Đạt phỏng vấn",
    interviewDate: "22/01/2026",
    standardTrainingDate: "25/01/2026",
    onboardingMonth: "T01.2026",
    bankName: "BIDV",
    accountNumber: "45010001234567",
    accountHolder: "PHAM QUOC BAO",
    isNameVerified: true,
    bonus1: 0,
    bonus2: 0,
    bonus3: 0,
    bonus4: 0,
  },
  {
    fullName: "Đỗ Thị Hạnh",
    idCard: "035199006789",
    phone: "0932123456",
    dob: "18/06/2000",
    gender: "Nữ",
    idCardDate: "09/01/2022",
    address: "Hải Hậu, Nam Định",
    recruiter: "Nguyễn Thu Trang",
    team: "Team Hà Nội 1",
    source: "Giới thiệu",
    factory: "Amphenol",
    status: "Đang làm việc",
    interviewDate: "02/02/2026",
    standardTrainingDate: "04/02/2026",
    onboardingMonth: "T02.2026",
    bankName: "Agribank",
    accountNumber: "3100205123456",
    accountHolder: "DO THI HANH",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 500000,
    bonus3: 0,
    bonus4: 0,
  },
  {
    fullName: "Vũ Văn Hùng",
    idCard: "026096007890",
    phone: "0977889900",
    dob: "29/09/1996",
    gender: "Nam",
    idCardDate: "30/10/2020",
    address: "Đông Triều, Quảng Ninh",
    recruiter: "Trần Minh Đức",
    team: "Team Quảng Ninh",
    source: "Tự do",
    factory: "Luxshare VT",
    status: "Đang làm việc",
    interviewDate: "05/02/2026",
    standardTrainingDate: "07/02/2026",
    onboardingMonth: "T02.2026",
    bankName: "Vietcombank",
    accountNumber: "0011004321098",
    accountHolder: "VU VAN HUNG",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 500000,
    bonus3: 500000,
    bonus4: 1000000,
  },
  {
    fullName: "Bùi Thị Lan",
    idCard: "001198008901",
    phone: "0909112233",
    dob: "14/02/1999",
    gender: "Nữ",
    idCardDate: "05/06/2021",
    idCardPlace: "Cục Cảnh sát QLHC về trật tự xã hội",
    address: "Ba Vì, Hà Nội",
    province: "Hà Nội",
    recruiter: "Nguyễn Thu Trang",
    team: "Team Hà Nội 1",
    source: "Facebook Tuyển dụng",
    factory: "LG",
    status: "Đang làm việc",
    interviewDate: "12/02/2026",
    standardTrainingDate: "14/02/2026",
    onboardingMonth: "T02.2026",
    bankName: "Techcombank",
    bankCode: "TCB",
    accountNumber: "19028887776655",
    accountHolderName: "BUI THI LAN",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 0,
    bonus3: 0,
    bonus4: 0,
  },
];

async function main() {
  console.log("--- Bắt đầu khởi tạo dữ liệu mẫu chuẩn 100% ---");

  // 1. Xóa dữ liệu cũ theo đúng thứ tự phụ thuộc khóa ngoại
  await prisma.rewardPayment.deleteMany();
  await prisma.rewardStage.deleteMany();
  await prisma.policyEnrollment.deleteMany();
  await prisma.assignmentEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.bonusRecord.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.workAssignment.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.bonusPolicy.deleteMany();
  await prisma.importProfile.deleteMany();
  await prisma.recruitmentBatch.deleteMany();
  await prisma.recruitmentOrder.deleteMany();
  await prisma.recruiter.deleteMany();
  await prisma.recruitmentTeam.deleteMany();
  await prisma.factory.deleteMany();
  await prisma.laborStatus.deleteMany();

  // 2. Nạp Bảng Factory
  const createdFactories = [];
  for (let i = 0; i < FACTORIES.length; i++) {
    const f = await prisma.factory.create({
      data: {
        code: `FAC_0${i + 1}`,
        name: FACTORIES[i],
        isActive: true,
      },
    });
    createdFactories.push(f);
  }
  console.log(`✅ Bảng Factory: ${createdFactories.length} nhà máy.`);

  // 3. Tự động thu thập Team & Recruiter
  const teamMap = new Map();
  const recruiterMap = new Map();

  for (const item of SAMPLE_WORKERS) {
    if (item.team && !teamMap.has(item.team)) {
      const createdTeam = await prisma.recruitmentTeam.create({
        data: {
          code: "TEAM_" + (teamMap.size + 1),
          name: item.team,
          isActive: true,
        },
      });
      teamMap.set(item.team, createdTeam);
    }

    if (item.recruiter && !recruiterMap.has(item.recruiter)) {
      const parentTeam = teamMap.get(item.team);
      const createdRecruiter = await prisma.recruiter.create({
        data: {
          code: "REC_0" + (recruiterMap.size + 1),
          name: item.recruiter,
          teamId: parentTeam?.id,
          isActive: true,
        },
      });
      recruiterMap.set(item.recruiter, createdRecruiter);
    }
  }
  console.log(`✅ Bảng RecruitmentTeam: ${teamMap.size} nhóm.`);
  console.log(`✅ Bảng Recruiter: ${recruiterMap.size} cán bộ tuyển dụng.`);

  // 4. Nạp Bảng RecruitmentOrder & RecruitmentBatch
  const lgFactory = createdFactories.find((f) => f.name === "LG");
  const order1 = await prisma.recruitmentOrder.create({
    data: {
      code: "DH01",
      name: "Tuyển dụng Tập trung Q1/2026",
      factory: "LG",
      factoryId: lgFactory?.id,
      isActive: true,
    },
  });

  const batch1 = await prisma.recruitmentBatch.create({
    data: {
      orderId: order1.id,
      code: "DOT01",
      name: "Đợt 1 - Tuyển dụng Tháng 1 & 2",
      startDate: "2026-01-01",
      endDate: "2026-02-28",
      periodMonth: "T01.2026",
      target: 100,
    },
  });
  console.log("✅ Bảng RecruitmentOrder & RecruitmentBatch.");

  // 5. Nạp Bảng LaborStatus
  const statuses = [
    {
      name: "Đang làm việc",
      category: "TRAINING",
      warnsDuplicate: true,
      endsAssignment: false,
      isActive: true,
    },
    {
      name: "Đang chờ phỏng vấn",
      category: "NEW",
      warnsDuplicate: false,
      endsAssignment: false,
      isActive: true,
    },
    {
      name: "Đạt phỏng vấn",
      category: "NEW",
      warnsDuplicate: false,
      endsAssignment: false,
      isActive: true,
    },
    {
      name: "Đã nghỉ việc",
      category: "STOP",
      warnsDuplicate: false,
      endsAssignment: true,
      isActive: true,
    },
  ];
  for (const st of statuses) {
    await prisma.laborStatus.create({ data: st });
  }
  console.log("✅ Bảng LaborStatus.");

  // 6. Nạp Bảng BonusPolicy
  const rulesJsonStr = JSON.stringify([
    { step: 1, milestone: "3 công (Khởi động)", amount: 300000 },
    { step: 2, milestone: "7 công (Tuần đầu)", amount: 500000 },
    { step: 3, milestone: "15 công (Tiền xe hỗ trợ)", amount: 500000 },
    { step: 4, milestone: "30 công (Gắn bó tháng 1)", amount: 1000000 },
  ]);

  const policy = await prisma.bonusPolicy.create({
    data: {
      name: "Chính sách Định Mức Thưởng Chuẩn 2026",
      factory: "Chung tất cả nhà máy",
      description:
        "Chính sách 7 mốc công (3 công, 7 công, 15 công xe, 30 công, 45 công, 60 công, chuyên cần)",
      orderId: order1.id,
      rulesJson: rulesJsonStr,
      isActive: true,
    },
  });
  console.log("✅ Bảng BonusPolicy.");

  // 7. Nạp Bảng ImportProfile
  await prisma.importProfile.create({
    data: {
      name: "Mẫu Nhập Lao Động Chuẩn",
      sheetName: "DS_LaoDong",
      mappingJson: JSON.stringify({ fullName: "A", idCard: "B", phone: "C" }),
      isActive: true,
    },
  });

  // 8. Nạp Worker, WorkAssignment, BankAccount, BonusRecord, PolicyEnrollment, RewardStage, RewardPayment
  for (const s of SAMPLE_WORKERS) {
    const recObj = recruiterMap.get(s.recruiter);
    const teamObj = teamMap.get(s.team);
    const holderName =
      s.accountHolderName || s.accountHolder || s.fullName.toUpperCase();

    const worker = await prisma.worker.create({
      data: {
        code: "NV_" + s.idCard.slice(-4),
        fullName: s.fullName,
        dob: s.dob || "01/01/1998",
        gender: s.gender || "Nam",
        idCard: s.idCard,
        idCardDate: s.idCardDate || "01/01/2021",
        idCardPlace:
          (s as any).idCardPlace || "Cục Cảnh sát QLHC về trật tự xã hội",
        phone: s.phone || "0900000000",
        address: s.address || "Việt Nam",
        province: (s as any).province || "Hà Nội",
        recruiter: s.recruiter,
        team: s.team,
        source: s.source,
        isBlacklisted: false,
        isWhitelisted: true,
        assignments: {
          create: {
            interviewFactory: s.factory,
            workingFactory: s.factory,
            contractType: "Thời vụ",
            status: s.status,
            leaveDate: (s as any).leaveDate || null,
            leaveReason: (s as any).leaveReason || null,
            interviewDate: s.interviewDate,
            standardTrainingDate: s.standardTrainingDate,
            onboardingMonth: s.onboardingMonth,
            recruiter: s.recruiter,
            source: s.source,
            orderId: order1.id,
            batchId: batch1.id,
            team: s.team,
            recruiterId: recObj?.id,
            teamId: teamObj?.id,
            employeeCode: "EMP_" + s.idCard.slice(-4),
            interviewResult: s.status === "Đã nghỉ việc" ? "Trượt" : "Đạt",
            confirmedWorkDays: s.status === "Đang làm việc" ? 15 : 0,
          },
        },
        bankAccounts: {
          create: {
            bankName: s.bankName || "Techcombank",
            bankCode: (s as any).bankCode || "BANK",
            accountNumber: s.accountNumber,
            accountHolderName: holderName,
            isNameVerified: s.isNameVerified ?? true,
            isAuthorized: (s as any).isAuthorized || false,
            authorizedRelation: (s as any).authorizedRelation || null,
            warningMessage: (s as any).warningMessage || null,
            verificationStatus: s.isNameVerified
              ? "VALID"
              : (s as any).isAuthorized
                ? "AUTHORIZED"
                : "MISMATCH",
            checkedBy: "Kế toán Thu Phương",
            checkResult: s.isNameVerified
              ? "Khớp tên 100%"
              : "Mượn tài khoản có ủy quyền",
            checkedAt: new Date(),
          },
        },
      },
      include: { assignments: true },
    });

    const assignment = worker.assignments[0];
    const totalBonus =
      (s.bonus1 || 0) + (s.bonus2 || 0) + (s.bonus3 || 0) + (s.bonus4 || 0);

    // Nạp BonusRecord
    await prisma.bonusRecord.create({
      data: {
        workerId: worker.id,
        assignmentId: assignment.id,
        company: s.factory,
        month: s.onboardingMonth,
        interviewDate: s.interviewDate,
        policy: policy.name,
        workerCode: worker.code,
        bonus1: s.bonus1,
        bonus2: s.bonus2,
        bonus3: s.bonus3,
        bonus4: s.bonus4,
        bonus5: 0,
        bonus6: 0,
        bonus7: 0,
        totalBonus: totalBonus,
        status: totalBonus > 0 ? "APPROVED" : "DRAFT",
      },
    });

    // Nạp AssignmentEvent (Yêu cầu: assignmentId, occurredOn, toStatus, operator)
    await prisma.assignmentEvent.create({
      data: {
        assignmentId: assignment.id,
        occurredOn: "2026-02-14",
        fromStatus: "Chờ tiếp nhận",
        toStatus: s.status,
        interviewResult: "Đạt",
        note: `Tiếp nhận trạng thái: ${s.status}`,
        operator: s.recruiter || "Hệ thống",
      },
    });

    // Nạp PolicyEnrollment (Yêu cầu: assignmentId, policyId, policyName, factory, effectiveFrom, effectiveTo, rulesSnapshot, createdBy)
    const enrollment = await prisma.policyEnrollment.create({
      data: {
        assignmentId: assignment.id,
        policyId: policy.id,
        policyName: policy.name,
        factory: s.factory,
        effectiveFrom: "2026-01-01",
        effectiveTo: "2026-12-31",
        rulesSnapshot: rulesJsonStr,
        createdBy: "AutoSeed",
      },
    });

    // Nạp RewardStage (Yêu cầu: enrollmentId, step, label, amount)
    const stage = await prisma.rewardStage.create({
      data: {
        enrollmentId: enrollment.id,
        step: 1,
        label: "Thưởng 3 công",
        thresholdDays: 3,
        amount: 300000,
        eligible: s.bonus1 > 0,
        achieved: s.bonus1 > 0,
        achievedOn: "2026-02-17",
        confirmedBy: "Thu Phương",
      },
    });

    // Nạp RewardPayment nếu có thưởng (Yêu cầu: stageId, amount, paidOn, reference, confirmedBy)
    if (s.bonus1 > 0) {
      await prisma.rewardPayment.create({
        data: {
          stageId: stage.id,
          amount: s.bonus1,
          paidOn: "2026-02-18",
          reference: "UNC_20260218_" + s.idCard.slice(-4),
          note: "Chi trả tiền thưởng đợt 1",
          confirmedBy: "Thủ quỹ",
        },
      });
    }

    // Nạp AuditLog (Yêu cầu: action, module)
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "WORKER_MANAGEMENT",
        details: `Khởi tạo lao động mẫu ${worker.fullName}`,
        operator: "System Seed",
      },
    });
  }

  console.log(
    "🎉 KHỞI TẠO THÀNH CÔNG 8 HỒ SƠ LAO ĐỘNG VÀ ĐẦY ĐỦ DỮ LIỆU TẤT CẢ CÁC BẢNG!",
  );
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
