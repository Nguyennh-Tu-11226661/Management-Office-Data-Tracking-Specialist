import { splitImportReview } from "@/lib/import-review";
import { dateKey } from "@/lib/worker-validation";
import { matchFactory } from "@/lib/factory-matching";
import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readImportSources } from "@/lib/import-source-store";
import { workerSourceView } from "@/lib/worker-source-view";
import { sourceHeader } from "@/lib/source-format";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const [sources, workers] = await Promise.all([
      readImportSources(),
      prisma.worker.findMany({
        where: {
          archivedAt:
            request.nextUrl.searchParams.get("archived") === "true"
              ? { not: null }
              : null,
        },
        include: {
          assignments: {
            include: {
              events: { orderBy: { createdAt: "desc" } },
              bonusRecords: true,
            },
          },
          bankAccounts: true,
        },
      }),
    ]);
    const people = new Map(workers.map((w) => [w.idCard, w]));
    const bonusRows = sources
      .filter((s) => s.type === "DS_THUONG")
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file, "vi") ||
          a.createdAt.localeCompare(b.createdAt),
      )
      .flatMap((s) =>
        s.rows
          .filter(
            (r: any) =>
              !splitImportReview([
                ...(r.warnings || []),
                ...(r.duplicates || []),
              ]).duplicates.length,
          )
          .map((r: any) => ({
            ...r,
            id: `${s.id}-${r.row}`,
            values: Object.fromEntries(
              Object.entries(r.values).map(([k, v]) => [sourceHeader(k), v]),
            ),
            file: s.file,
          })),
      );
    const stored = sources
      .filter((s) => s.type === "DS_TONG")
      .sort(
        (a, b) =>
          a.file.localeCompare(b.file, "vi") ||
          a.createdAt.localeCompare(b.createdAt),
      );
    const sourceRows = stored.flatMap((s) =>
      s.rows.map((r: any) => {
        const values = Object.fromEntries(
          Object.entries(r.values).map(([k, v]) => [sourceHeader(k), v]),
        );
        const card = String(
          values["Số CCCD"] || values["số CCCD"] || values.CCCD || "",
        ).trim();
        const worker = people.get(card);
        const rev = splitImportReview([
          ...(r.warnings || []),
          ...(r.duplicates || []),
        ]);
        const cleanAssignments = worker
          ? worker.assignments.map((a: any) => ({
              id: a.id,
              contractType: a.contractType,
              status: a.status,
              interviewFactory: a.interviewFactory,
              workingFactory: a.workingFactory,
              leaveDate: a.leaveDate,
              leaveReason: a.leaveReason,
              employeeCode: a.employeeCode,
              recruiter: a.recruiter,
              team: a.team,
            }))
          : [];
        const cleanBanks = worker?.bankAccounts
          ? worker.bankAccounts.map((b: any) => ({
              accountNumber: b.accountNumber,
              bankName: b.bankName,
              accountHolderName: b.accountHolderName,
            }))
          : [];
        return {
          id: `source-${s.id}-${r.row}`,
          sourceValues: values,
          sourceWarnings: rev.warnings.map((i) => i.message),
          sourceDuplicates: rev.duplicates.map((i) => i.message),
          sourceFile: s.file,
          sourceRow: r.row,
          workerId: worker?.id,
          fullName: values["Họ và tên"],
          idCard: card,
          assignments: cleanAssignments,
          bankAccounts: cleanBanks,
          isSourceRow: true,
        };
      }),
    );
    const pendingDuplicateRows = sourceRows.filter(
      (r) => r.sourceDuplicates.length > 0,
    );
    const mainSourceRows = sourceRows.filter((r) => !r.sourceDuplicates.length);
    const sourceKey = (card: string, v: any) =>
      [
        card,
        String(v["Nhà máy PV"] || ""),
        dateKey(String(v["Ngày PV"] || "")) || String(v["Ngày PV"] || ""),
        String(v["Mã NV"] || ""),
      ].join("|");
    const sourcedKeys = new Set(
      mainSourceRows.map((r) => sourceKey(r.idCard, r.sourceValues)),
    );
    const canonical = workers
      .flatMap((w) =>
        w.assignments.map((a) => {
          const source = workerSourceView(w, a);
          const rev = splitImportReview(source.warnings);
          return {
            id: `${w.id}-${a.id}`,
            workerId: w.id,
            fullName: w.fullName,
            idCard: w.idCard,
            phone: w.phone,
            assignments: [{
              id: a.id,
              contractType: a.contractType,
              status: a.status,
              interviewFactory: a.interviewFactory,
              workingFactory: a.workingFactory,
              leaveDate: a.leaveDate,
              leaveReason: a.leaveReason,
              employeeCode: a.employeeCode,
              recruiter: a.recruiter,
              team: a.team,
            }],
            assignmentCount: w.assignments.length,
            bankAccounts: w.bankAccounts ? w.bankAccounts.map((b: any) => ({
              accountNumber: b.accountNumber,
              bankName: b.bankName,
              accountHolderName: b.accountHolderName,
            })) : [],
            sourceValues: source.values,
            sourceWarnings: rev.warnings.map((i) => i.message),
            sourceDuplicates: rev.duplicates.map((i) => i.message),
            sourceFile: source.hasSource
              ? "Import trước khi lưu bản nguồn"
              : "Hồ sơ nội bộ",
          };
        }),
      )
      .filter((r) => !sourcedKeys.has(sourceKey(r.idCard, r.sourceValues)));
    const bonusRowsByCccd = new Map<string, any[]>();
    for (const b of bonusRows) {
      const card = String(b.values["Số CCCD"] || b.values["số CCCD"] || b.values.CCCD || "").trim();
      if (!card) continue;
      let list = bonusRowsByCccd.get(card);
      if (!list) {
        list = [];
        bonusRowsByCccd.set(card, list);
      }
      list.push(b);
    }

    const rows = [...mainSourceRows, ...canonical].map((r) => {
      const candidateBonuses = bonusRowsByCccd.get(r.idCard);
      const rewardSource = candidateBonuses
        ? candidateBonuses.filter(
            (b) =>
              matchFactory(
                String(b.values["Công ty"] || ""),
                String(r.sourceValues["Nhà máy PV"] || ""),
              ) ||
              matchFactory(
                String(b.values["Công ty"] || ""),
                String(r.sourceValues["Nhà máy làm việc"] || ""),
              ),
          )
        : [];
      return {
        ...r,
        rewardSource,
      };
    });
    const linkedRewards = new Set(
      rows.flatMap((r) => r.rewardSource.map((b) => b.id)),
    );
    const unlinkedBonusRows = bonusRows.filter((b) => !linkedRewards.has(b.id));
    const options: Record<string, string[]> = {};
    for (const column of [
      "Nhà máy PV",
      "Nhà máy làm việc",
      "Tình trạng",
      "Tháng nhận việc",
      "Tuyển dụng",
      "Giới tính",
      "Loại HĐ",
      "Tình trạng đào tạo",
    ])
      options[column] = [
        ...new Set(
          rows.map((r) => String(r.sourceValues[column] ?? "")).filter(Boolean),
        ),
      ].sort();
    const p = request.nextUrl.searchParams;
    const filtered = rows.filter((r) => {
      const v = r.sourceValues;
      return (
        (!p.get("month") ||
          dateKey(String(v["Ngày PV"] || ""))?.slice(0, 7) ===
            p.get("month")) &&
        (!p.get("factory") || String(v["Nhà máy PV"]) === p.get("factory")) &&
        (!p.get("status") || String(v["Tình trạng"]) === p.get("status")) &&
        (!p.get("sourceMonth") ||
          String(v["Tháng nhận việc"]) === p.get("sourceMonth")) &&
        (!p.get("recruiter") ||
          String(v["Tuyển dụng"]) === p.get("recruiter")) &&
        (!p.get("warningsOnly") || r.sourceWarnings.length > 0) &&
        (!p.get("search") ||
          Object.values(v).some((x) =>
            String(x ?? "")
              .toLocaleLowerCase("vi")
              .includes(p.get("search")!.toLocaleLowerCase("vi")),
          )) &&
        (!p.get("columnValue") ||
          String(v[p.get("column") || ""] ?? "")
            .toLocaleLowerCase("vi")
            .includes(p.get("columnValue")!.toLocaleLowerCase("vi")))
      );
    });
    let pendingDuplicateCount = 0;
    let systemWarningCount = 0;
    for (const s of sources) {
      for (const r of s.rows) {
        const rawW = r.warnings || [];
        const rawD = r.duplicates || [];
        if (!rawW.length && !rawD.length) continue;
        const rev = splitImportReview([...rawW, ...rawD]);
        if (rev.duplicates.length > 0) pendingDuplicateCount++;
        if (rev.warnings.length > 0) systemWarningCount++;
      }
    }
    return NextResponse.json({
      success: true,
      data: filtered,
      options,
      pendingDuplicateCount,
      systemWarningCount,
      unlinkedBonusRows,
      bonusSourceRows: bonusRows.length,
      totalRows: rows.length,
      sourceRows: mainSourceRows.length,
      warningRows: rows.filter((r) => r.sourceWarnings.length).length,
      duplicateRows: rows.filter((r) => r.sourceDuplicates.length).length,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Không tải được dữ liệu nguồn" },
      { status: 500 },
    );
  }
}
