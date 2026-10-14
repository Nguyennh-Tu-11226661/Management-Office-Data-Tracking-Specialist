import { PrismaClient } from "@prisma/client";

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
    accountHolder: "NGUYEN VAN MANH", // Mượn tài khoản chồng
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
    address: "Ba Vì, Hà Nội",
    recruiter: "Nguyễn Thu Trang",
    team: "Team Hà Nội 1",
    source: "Facebook Tuyển dụng",
    factory: "LG",
    status: "Đang làm việc",
    interviewDate: "12/02/2026",
    standardTrainingDate: "14/02/2026",
    onboardingMonth: "T02.2026",
    bankName: "Techcombank",
    accountNumber: "19028887776655",
    accountHolder: "BUI THI LAN",
    isNameVerified: true,
    bonus1: 300000,
    bonus2: 0,
    bonus3: 0,
    bonus4: 0,
  },
];

async function main() {
  console.log("--- Đang khởi tạo dữ liệu mẫu ---");

  // Xóa dữ liệu cũ
  await prisma.auditLog.deleteMany();
  await prisma.bonusRecord.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.workAssignment.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.bonusPolicy.deleteMany();

  // Tạo chính sách thưởng mẫu
  await prisma.bonusPolicy.create({
    data: {
      name: "Chính sách Định Mức Thưởng Chuẩn 2026",
      factory: "Chung tất cả nhà máy",
      description:
        "Chính sách 7 mốc công (3 công, 7 công, 15 công xe, 30 công, 45 công, 60 công, chuyên cần)",
      rulesJson: JSON.stringify([
        { step: 1, milestone: "3 công (Khởi động)", amount: 300000 },
        { step: 2, milestone: "7 công (Tuần đầu)", amount: 500000 },
        { step: 3, milestone: "15 công (Tiền xe hỗ trợ)", amount: 500000 },
        { step: 4, milestone: "30 công (Gắn bó tháng 1)", amount: 1000000 },
        { step: 5, milestone: "45 công (Tháng 2)", amount: 1000000 },
        { step: 6, milestone: "60 công (Tháng 3)", amount: 1000000 },
        { step: 7, milestone: "Thưởng Chuyên Cần Quý", amount: 1500000 },
      ]),
    },
  });

  for (const s of SAMPLE_WORKERS) {
    const worker = await prisma.worker.create({
      data: {
        fullName: s.fullName,
        idCard: s.idCard,
        phone: s.phone,
        dob: s.dob,
        gender: s.gender,
        idCardDate: s.idCardDate,
        address: s.address,
        recruiter: s.recruiter,
        team: s.team,
        source: s.source,
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
          },
        },
        bankAccounts: {
          create: {
            bankName: s.bankName,
            accountNumber: s.accountNumber,
            accountHolderName: s.accountHolder,
            isNameVerified: s.isNameVerified,
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

    const assignmentId = worker.assignments[0]?.id;
    const total =
      (s.bonus1 || 0) + (s.bonus2 || 0) + (s.bonus3 || 0) + (s.bonus4 || 0);

    await prisma.bonusRecord.create({
      data: {
        workerId: worker.id,
        assignmentId,
        company: s.factory,
        month: s.onboardingMonth,
        interviewDate: s.interviewDate,
        policy: "Chính sách Định Mức Thưởng Chuẩn 2026",
        workerCode: worker.idCard.slice(-6),
        bonus1: s.bonus1,
        bonus2: s.bonus2,
        bonus3: s.bonus3,
        bonus4: s.bonus4,
        bonus5: 0,
        bonus6: 0,
        bonus7: 0,
        totalBonus: total,
        status: total > 0 ? "APPROVED" : "DRAFT",
      },
    });
  }

  console.log(
    "✅ Đã nạp thành công 8 hồ sơ lao động mẫu, chính sách thưởng và tài khoản ngân hàng.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
