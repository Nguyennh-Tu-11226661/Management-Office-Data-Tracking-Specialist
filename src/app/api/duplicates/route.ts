import { guard, identity } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { phoneKey } from "@/lib/worker-validation";
import { prisma } from "@/lib/prisma";
import { matchFactory } from "@/lib/factory-matching";

export const dynamic = "force-dynamic";

function isInactiveStatus(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return (
    s === "đã nghỉ việc" ||
    s === "nghỉ việc" ||
    s === "bỏ xx" ||
    s === "hết hạn hợp đồng" ||
    s === "hhđ" ||
    s === "tự ý nghỉ việc"
  );
}

function isActiveAssignment(a: any): boolean {
  if (a.leaveDate) return false;
  if (isInactiveStatus(a.status)) return false;
  return true;
}

export async function GET(request: NextRequest) {
  const denied = await guard(request, "read");
  if (denied) return denied;

  try {
    const workers = await prisma.worker.findMany({
      include: {
        assignments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const activeFactoryAlerts: any[] = [];
    const activePhoneAlerts: any[] = [];
    const phoneMap = new Map<string, typeof workers>();

    // 1. Quét cảnh báo: CCCD ĐANG LÀM XƯỞNG KHÁC (CHƯA BÁO NGHỈ)
    for (const w of workers) {
      if (w.assignments.length > 1) {
        // Tìm các đợt đang hoạt động
        const activeList = w.assignments.filter(isActiveAssignment);
        if (activeList.length > 0) {
          // Có đợt đang hoạt động mà lại có đợt khác ở xưởng khác
          const otherAssignments = w.assignments.filter(
            (a) => !activeList.some((act) => act.id === a.id),
          );

          for (const act of activeList) {
            const actFactory =
              act.workingFactory || act.interviewFactory || "Chưa rõ xưởng";
            for (const other of otherAssignments) {
              const otherFactory =
                other.workingFactory ||
                other.interviewFactory ||
                "Chưa rõ xưởng";
              // Kiểm tra nếu là 2 xưởng khác nhau
              if (!matchFactory(actFactory, otherFactory)) {
                activeFactoryAlerts.push({
                  id: `${w.id}-${act.id}-${other.id}`,
                  type: "ĐANG LÀM XƯỞNG KHÁC (CHƯA BÁO NGHỈ)",
                  severity: "CRITICAL",
                  phone: w.phone,
                  idCard: w.idCard,
                  fullName: w.fullName,
                  currentFactory: actFactory,
                  currentStatus: act.status || "Đang làm việc",
                  currentInterviewDate: act.interviewDate || "—",
                  newFactory: otherFactory,
                  newStatus: other.status || "Mới phát sinh",
                  newInterviewDate: other.interviewDate || "—",
                  recruiter: act.recruiter || w.recruiter || "—",
                  newRecruiter: other.recruiter || "—",
                  warning: `Đang làm việc tại "${actFactory}" (chưa báo ngày nghỉ việc) nhưng phát sinh đợt mới tại "${otherFactory}".`,
                  actionRequired: `Cần liên hệ xưởng "${actFactory}" để xác minh đã nghỉ việc chính thức chưa trước khi nhận việc tại "${otherFactory}".`,
                });
              }
            }
          }
        }
      }

      if (w.phone) {
        const key = phoneKey(w.phone);
        const list = phoneMap.get(key) || [];
        list.push(w);
        phoneMap.set(key, list);
      }
    }

    // 2. Quét cảnh báo: SĐT ĐANG HOẠT ĐỘNG TẠI XƯỞNG KHÁC
    const generalPhoneAlerts: any[] = [];
    phoneMap.forEach((list, phone) => {
      if (list.length > 1) {
        // Kiểm tra xem trong các hồ sơ dùng chung SĐT có ai đang đi làm không
        const activeWorker = list.find((w) =>
          w.assignments.some(isActiveAssignment),
        );
        if (activeWorker) {
          const actAssignment =
            activeWorker.assignments.find(isActiveAssignment);
          const actFactory =
            actAssignment?.workingFactory ||
            actAssignment?.interviewFactory ||
            "Chưa rõ";
          for (const otherWorker of list) {
            if (otherWorker.id !== activeWorker.id) {
              const otherAssignment = otherWorker.assignments[0];
              const otherFactory =
                otherAssignment?.workingFactory ||
                otherAssignment?.interviewFactory ||
                "Chưa rõ";
              activePhoneAlerts.push({
                id: `phone-active-${phone}-${otherWorker.id}`,
                type: "SĐT ĐANG HOẠT ĐỘNG XƯỞNG KHÁC",
                severity: "CRITICAL",
                phone,
                idCard: otherWorker.idCard,
                fullName: otherWorker.fullName,
                currentFactory: actFactory,
                currentStatus: `${activeWorker.fullName} (Đang làm việc)`,
                newFactory: otherFactory,
                newStatus: otherAssignment?.status || "Mới phát sinh",
                newInterviewDate: otherAssignment?.interviewDate || "—",
                recruiter:
                  otherAssignment?.recruiter || otherWorker.recruiter || "—",
                warning: `SĐT ${phone} đang được công nhân ${activeWorker.fullName} đi làm tại "${actFactory}", nhưng lại đăng ký cho ${otherWorker.fullName} tại "${otherFactory}".`,
                actionRequired: `Xác minh danh tính chủ sở hữu thực sự của SĐT ${phone}.`,
              });
            }
          }
        } else {
          for (const w of list) {
            const assignment = w.assignments[0];
            generalPhoneAlerts.push({
              id: `phone-dup-${phone}-${w.id}`,
              type: "TRÙNG SĐT",
              severity: "WARNING",
              phone,
              idCard: w.idCard,
              fullName: w.fullName,
              currentFactory: assignment?.interviewFactory || "N/A",
              currentStatus: assignment?.status || "N/A",
              newFactory: "—",
              newStatus: "—",
              newInterviewDate: assignment?.interviewDate || "N/A",
              recruiter: w.recruiter || "N/A",
              warning: `SĐT ${phone} bị trùng lặp giữa ${list.length} hồ sơ`,
              actionRequired:
                "Kiểm tra xem ứng viên dùng chung số người thân hay bị nhập nhầm.",
            });
          }
        }
      }
    });

    // 3. Quét cảnh báo: TÁI TUYỂN DỤNG HỢP LỆ (ĐÃ BÁO NGHỈ)
    const rehireAlerts: any[] = [];
    const activeAlertCards = new Set(activeFactoryAlerts.map((a) => a.idCard));
    for (const w of workers) {
      if (w.assignments.length > 1 && !activeAlertCards.has(w.idCard)) {
        const latest = w.assignments[0];
        const prev = w.assignments[1];
        rehireAlerts.push({
          id: `rehire-${w.id}`,
          type: "TÁI TUYỂN DỤNG (ĐÃ BÁO NGHỈ)",
          severity: "INFO",
          phone: w.phone,
          idCard: w.idCard,
          fullName: w.fullName,
          currentFactory:
            prev?.workingFactory || prev?.interviewFactory || "Xưởng cũ",
          currentStatus: prev?.status || "Đã nghỉ việc",
          newFactory:
            latest?.workingFactory || latest?.interviewFactory || "Xưởng mới",
          newStatus: latest?.status || "Đợt mới",
          newInterviewDate: latest?.interviewDate || "—",
          recruiter: latest?.recruiter || w.recruiter || "—",
          warning: `Lao động quay lại làm việc: Đã từng làm tại ${prev?.workingFactory || prev?.interviewFactory || "Xưởng cũ"} (${w.assignments.length} đợt).`,
          actionRequired: "Lao động tái tuyển dụng hợp lệ, không cần chặn.",
        });
      }
    }

    const allAlerts = [
      ...activeFactoryAlerts,
      ...activePhoneAlerts,
      ...generalPhoneAlerts,
      ...rehireAlerts,
    ];

    return NextResponse.json({
      success: true,
      totalDuplicates: allAlerts.length,
      counts: {
        activeFactoryCount: activeFactoryAlerts.length,
        activePhoneCount: activePhoneAlerts.length,
        generalPhoneCount: generalPhoneAlerts.length,
        rehireCount: rehireAlerts.length,
      },
      data: allAlerts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Không thể xử lý yêu cầu lúc này" },
      { status: 500 },
    );
  }
}
