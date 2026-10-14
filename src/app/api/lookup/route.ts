import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, sameOrigin } from "@/lib/auth";
import { phoneKey } from "@/lib/worker-validation";
import { createHash } from "node:crypto";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Nguồn yêu cầu không hợp lệ" },
      { status: 403 },
    );
  }

  if (!rateLimit("lookup:global", 100)) {
    return NextResponse.json(
      {
        success: false,
        message: "Quá nhiều lần tra cứu. Thử lại sau 15 phút.",
      },
      { status: 429 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }

  const idCard = typeof body?.idCard === "string" ? body.idCard.trim() : "";
  const lastPhone4 =
    typeof body?.lastPhone4 === "string" ? body.lastPhone4.trim() : "";

  if (!/^(\d{9}|\d{12})$/.test(idCard) || !/^\d{4}$/.test(lastPhone4)) {
    return NextResponse.json(
      {
        success: false,
        message: "Cần CCCD 12 số hoặc CMT 9 số và đúng 4 số cuối SĐT",
      },
      { status: 400 },
    );
  }

  if (
    !rateLimit(
      "lookup:" + createHash("sha256").update(idCard).digest("hex"),
      10,
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Quá nhiều lần tra cứu. Thử lại sau 15 phút.",
      },
      { status: 429 },
    );
  }

  try {
    // Lấy toàn bộ lịch sử các công ty (assignments) mà người lao động từng tham gia
    const worker = await prisma.worker.findUnique({
      where: { idCard },
      include: {
        assignments: {
          include: {
            order: true,
            batch: true,
            bonusRecords: {
              where: { status: { in: ["APPROVED", "LOCKED"] } },
              orderBy: { createdAt: "desc" },
            },
            enrollments: {
              include: {
                stages: {
                  include: { payments: true },
                  orderBy: { step: "asc" },
                },
              },
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        },
        bonusRecords: {
          where: { status: { in: ["APPROVED", "LOCKED"] } },
          orderBy: { createdAt: "desc" },
        },
        bankAccounts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (
      !worker ||
      !worker.phone ||
      !phoneKey(worker.phone).endsWith(lastPhone4)
    ) {
      return NextResponse.json(
        { success: false, message: "Thông tin tra cứu không khớp hồ sơ" },
        { status: 404 },
      );
    }

    const b = worker.bankAccounts[0];

    // Chuẩn hóa và bóc tách dữ liệu theo từng công ty người này từng làm
    const companies = worker.assignments.map((a) => {
      // Danh sách các đợt trả thưởng đạt mốc công thực tế
      const payments = a.enrollments.flatMap((e) =>
        e.stages.flatMap((s) =>
          s.payments.map((p) => ({
            id: p.id,
            stageLabel: s.label,
            amount: p.amount,
            paidOn: p.paidOn,
            reference: p.reference,
            note: p.note,
          })),
        ),
      );

      // Bảng thưởng theo kỳ (DS_THUONG)
      const linkedBonuses = worker.bonusRecords.filter(
        (r) =>
          r.assignmentId === a.id ||
          (r.company &&
            (r.company === a.interviewFactory ||
              r.company === a.workingFactory)),
      );

      const totalBonusFromRecords = linkedBonuses.reduce(
        (sum, r) => sum + (r.totalBonus || 0),
        0,
      );
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        id: a.id,
        factory: a.workingFactory || a.interviewFactory,
        interviewFactory: a.interviewFactory,
        workingFactory: a.workingFactory,
        contractType: a.contractType || "Thời vụ",
        status: a.status,
        interviewDate: a.interviewDate || "—",
        startDate: a.startDate || a.passedDate || a.interviewDate || "—",
        leaveDate: a.leaveDate || null,
        leaveReason: a.leaveReason || null,
        confirmedWorkDays: a.confirmedWorkDays,
        onboardingMonth: a.onboardingMonth,
        recruiter: a.recruiter || "—",
        createdAt: a.createdAt,
        payments,
        bonuses: linkedBonuses.map((r) => ({
          id: r.id,
          month: r.month,
          totalBonus: r.totalBonus || 0,
          bonus1: r.bonus1 || 0,
          bonus2: r.bonus2 || 0,
          bonus3: r.bonus3 || 0,
          bonus4: r.bonus4 || 0,
          status: r.status,
        })),
        totalBonus: totalPayments > 0 ? totalPayments : totalBonusFromRecords,
      };
    });

    const primaryAssignment = worker.assignments[0];

    return NextResponse.json(
      {
        success: true,
        data: {
          id: worker.id,
          fullName: worker.fullName,
          idCard: "••••" + worker.idCard.slice(-4),
          phone: worker.phone
            ? worker.phone.slice(0, 3) + "••••" + worker.phone.slice(-3)
            : null,
          totalCompaniesWorked: companies.length,
          companies,
          // Tương thích ngược:
          assignment: primaryAssignment
            ? {
                status: primaryAssignment.status,
                interviewFactory: primaryAssignment.interviewFactory,
                workingFactory: primaryAssignment.workingFactory,
                onboardingMonth: primaryAssignment.onboardingMonth,
              }
            : null,
          bankAccount: b
            ? {
                accountNumber: "••••" + b.accountNumber.slice(-4),
                bankName: b.bankName,
                accountHolderName: b.accountHolderName,
              }
            : null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Không thể tra cứu lúc này" },
      { status: 500 },
    );
  }
}
