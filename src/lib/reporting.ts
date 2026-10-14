import { monthOf, today } from "@/lib/domain";
import { dateKey } from "@/lib/worker-validation";
export function matchesAssignment(a: any, p: URLSearchParams) {
  const d = a.interviewDate ? dateKey(a.interviewDate) : null;
  const search = p.get("search")?.toLowerCase();
  return (
    (!p.get("month") || monthOf(a.interviewDate) === p.get("month")) &&
    (!p.get("factory") ||
      (a.workingFactory || a.interviewFactory) === p.get("factory")) &&
    (!p.get("interviewFactory") ||
      a.interviewFactory === p.get("interviewFactory")) &&
    (!p.get("orderId") || a.orderId === p.get("orderId")) &&
    (!p.get("batchId") || a.batchId === p.get("batchId")) &&
    (!p.get("recruiter") || a.recruiter === p.get("recruiter")) &&
    (!p.get("team") || a.team === p.get("team")) &&
    (!p.get("from") || (!!d && d >= p.get("from")!)) &&
    (!p.get("to") || (!!d && d <= p.get("to")!)) &&
    (!search ||
      [
        a.worker?.fullName,
        a.worker?.idCard,
        a.employeeCode,
        a.worker?.code,
      ].some((v) => v?.toLowerCase().includes(search)))
  );
}
const worked = (a: any) =>
  !!a.startDate ||
  [
    "Đang làm việc",
    "Đã nghỉ việc",
    "Nghỉ hẳn",
    "Hết hợp đồng",
    "Chuyển chính thức",
  ].includes(a.status);
export function recruitmentReport(workers: any[], p: URLSearchParams) {
  const all = workers
    .filter((w) => !w.archivedAt)
    .flatMap((w) => w.assignments.map((a: any) => ({ ...a, worker: w })));
  const rows = all.filter((a) => matchesAssignment(a, p));
  const samePerson = new Map<string, any>();
  for (const a of rows) {
    const old = samePerson.get(a.workerId);
    if (
      !old ||
      (dateKey(a.interviewDate || "") || "") >
        (dateKey(old.interviewDate || "") || "")
    )
      samePerson.set(a.workerId, a);
  }
  const rate = (a: number, b: number) =>
    b ? Math.round((a / b) * 10000) / 100 : null;
  function returning(a: any, factoryOnly = false) {
    const d = dateKey(a.interviewDate || "");
    return (
      !!d &&
      a.worker.assignments.some(
        (old: any) =>
          old.id !== a.id &&
          worked(old) &&
          dateKey(old.interviewDate || "") &&
          dateKey(old.interviewDate)! < d &&
          (!factoryOnly ||
            (old.workingFactory || old.interviewFactory) ===
              (a.workingFactory || a.interviewFactory)),
      )
    );
  }
  function summarize(list: any[]) {
    const isPassed = (a: any) =>
      a.interviewResult === "PASS" ||
      [
        "Đang làm việc",
        "Đạt phỏng vấn",
        "Đang đào tạo",
        "Đã nghỉ việc",
        "Chuyển chính thức",
      ].includes(a.status);
    const isFailed = (a: any) =>
      a.interviewResult === "FAIL" || a.status === "Trượt phỏng vấn";
    const isAbandon = (a: any) =>
      a.interviewResult === "ABANDONED" || a.status.startsWith("Bỏ");
    const total = list.length,
      passed = list.filter(isPassed).length,
      failed = list.filter(isFailed).length;
    const abandon = list.filter(isAbandon).length;
    const working = list.filter((a) =>
      ["Đang làm việc", "Chuyển chính thức"].includes(a.status),
    ).length;
    const training = list.filter((a) => a.status === "Đang đào tạo").length;
    const returned = list.filter((a) => returning(a)).length;
    return {
      total,
      people: new Set(list.map((a) => a.workerId)).size,
      passed,
      failed,
      abandoned: abandon,
      working,
      training,
      returning: returned,
      returningSameFactory: list.filter((a) => returning(a, true)).length,
      returnRate: rate(returned, total),
      passRate: rate(passed, total),
      trainingRate: rate(training, total),
      abandonRate: rate(abandon, total),
      statusCounts: Object.fromEntries(
        [...new Set(list.map((a) => a.status))].map((status) => [
          status,
          list.filter((a) => a.status === status).length,
        ]),
      ),
      unknownInterview: list.filter(
        (a) => !isPassed(a) && !isFailed(a) && !isAbandon(a),
      ).length,
    };
  }
  function group(key: (a: any) => string) {
    const groups = new Map<string, any[]>();
    for (const a of rows) {
      const k = key(a) || "Chưa gán";
      groups.set(k, [...(groups.get(k) || []), a]);
    }
    return [...groups].map(([name, list]) => ({ name, ...summarize(list) }));
  }
  const statuses = group((a) => a.status),
    orders = group((a) => a.order?.name || "Chưa gán đơn hàng");
  // Use batch IDs for target totals, never repeat the same target for each worker.
  const targets = new Map<string, number>();
  for (const a of rows)
    if (a.batch?.target != null) targets.set(a.batch.id, a.batch.target);
  const targetTotal = [...targets.values()].reduce((n, v) => n + v, 0);
  const demographics = (list: any[]) => {
    const people = new Map<string, any>();
    for (const a of list) {
      const old = people.get(a.workerId);
      if (
        !old ||
        (dateKey(a.interviewDate || "") || "") >
          (dateKey(old.interviewDate || "") || "")
      )
        people.set(a.workerId, a);
    }
    const genders: Record<string, number> = {},
      provinces: Record<string, number> = {},
      ages: Record<string, number> = {};
    for (const a of people.values()) {
      const w = a.worker;
      genders[w.gender || "Chưa xác định"] =
        (genders[w.gender || "Chưa xác định"] || 0) + 1;
      provinces[w.province || "Chưa xác định"] =
        (provinces[w.province || "Chưa xác định"] || 0) + 1;
      const birth = dateKey(w.dob || ""),
        reference = dateKey(a.interviewDate || "");
      let label = "Chưa xác định";
      if (birth && reference && birth <= reference) {
        const b = new Date(birth),
          d = new Date(reference);
        let age = d.getUTCFullYear() - b.getUTCFullYear();
        if (
          d.getUTCMonth() < b.getUTCMonth() ||
          (d.getUTCMonth() === b.getUTCMonth() &&
            d.getUTCDate() < b.getUTCDate())
        )
          age--;
        label =
          age < 18
            ? "Dưới 18"
            : age <= 24
              ? "18–24"
              : age <= 34
                ? "25–34"
                : age <= 44
                  ? "35–44"
                  : "45 trở lên";
      }
      ages[label] = (ages[label] || 0) + 1;
    }
    const arr = (obj: Record<string, number>) =>
      Object.entries(obj).map(([name, count]) => ({ name, count }));
    return {
      people: people.size,
      genders: arr(genders),
      provinces: arr(provinces),
      ages: arr(ages),
    };
  };
  const factories = group((a) => a.interviewFactory),
    companies = [
      ...new Set(rows.map((a) => a.workingFactory || a.interviewFactory)),
    ].map((factory) => ({
      factory,
      ...demographics(
        rows.filter(
          (a) => (a.workingFactory || a.interviewFactory) === factory,
        ),
      ),
    }));
  const orderReports = Array.from(
    new Set(rows.map((a) => a.orderId || "UNKNOWN")),
  ).map((id) => {
    const list = rows.filter((a) => (a.orderId || "UNKNOWN") === id);
    const batches = new Map<string, number>();
    for (const a of list)
      if (a.batch?.target != null) batches.set(a.batch.id, a.batch.target);
    const target = [...batches.values()].reduce((n, v) => n + v, 0);
    const stats = summarize(list);
    return {
      id,
      name: list[0]?.order?.name || "Chưa gán đơn hàng",
      factory: list[0]?.interviewFactory,
      target: target || null,
      ...stats,
      targetPassRate: target ? rate(stats.passed, target) : null,
    };
  });
  return {
    summary: {
      ...summarize(rows),
      target: targetTotal || null,
      missingInterviewDate: rows.filter((a) => !dateKey(a.interviewDate || ""))
        .length,
    },
    months: group((a) => monthOf(a.interviewDate)),
    factories,
    statuses,
    orders: orderReports,
    recruiters: group((a) => a.recruiter || "Chưa gán"),
    teams: group((a) => a.team || "Chưa gán"),
    demographics: demographics(rows),
    companyDemographics: companies,
  };
}
export function rewardReport(enrollments: any[], p: URLSearchParams) {
  const rows = enrollments.filter(
    (e) =>
      !e.assignment.worker.archivedAt && matchesAssignment(e.assignment, p),
  );
  const summarize = (list: any[]) => {
    const stages = list.flatMap((e) => e.stages),
      eligible = stages.filter((s) => s.eligible).length,
      achieved = stages.filter((s) => s.eligible && s.achieved).length;
    const scheduled = stages.reduce((n, s) => n + s.amount, 0),
      earned = stages
        .filter((s) => s.achieved)
        .reduce((n, s) => n + s.amount, 0),
      paid = stages
        .flatMap((s) => s.payments)
        .reduce((n, v) => n + v.amount, 0);
    return {
      applications: list.length,
      eligible,
      achieved,
      achieveRate: eligible
        ? Math.round((achieved / eligible) * 10000) / 100
        : null,
      scheduled,
      earned,
      paid,
      outstanding: earned - paid,
    };
  };
  function group(key: (e: any) => string) {
    const map = new Map<string, any[]>();
    for (const e of rows) {
      const k = key(e) || "Chưa xác định";
      map.set(k, [...(map.get(k) || []), e]);
    }
    return [...map].map(([name, list]) => ({ name, ...summarize(list) }));
  }
  const map = new Map<string, any[]>();
  for (const e of rows)
    for (const s of e.stages) {
      const name = `${e.factory} · ${e.policyName} · ${s.label}`;
      map.set(name, [...(map.get(name) || []), s]);
    }
  const stages = [...map].map(([name, list]) => {
    const eligible = list.filter((s) => s.eligible).length,
      achieved = list.filter((s) => s.achieved && s.eligible).length;
    return {
      name,
      eligible,
      achieved,
      achieveRate: eligible
        ? Math.round((achieved / eligible) * 10000) / 100
        : null,
      earned: list.filter((s) => s.achieved).reduce((n, s) => n + s.amount, 0),
      paid: list.flatMap((s) => s.payments).reduce((n, p) => n + p.amount, 0),
    };
  });
  const conditions = new Map<string, any[]>();
  for (const e of rows)
    for (const s of e.stages) {
      const name = `${e.factory} · ${s.label} · ${s.thresholdDays == null ? "Không theo số công" : s.thresholdDays + " công"}`;
      conditions.set(name, [...(conditions.get(name) || []), s]);
    }
  const milestones = [...conditions].map(([name, list]) => {
    const eligible = list.filter((s) => s.eligible).length,
      achieved = list.filter((s) => s.eligible && s.achieved).length,
      earned = list.filter((s) => s.achieved).reduce((n, s) => n + s.amount, 0),
      paid = list.flatMap((s) => s.payments).reduce((n, p) => n + p.amount, 0);
    return {
      name,
      applications: list.length,
      eligible,
      achieved,
      achieveRate: eligible
        ? Math.round((achieved / eligible) * 10000) / 100
        : null,
      earned,
      paid,
      outstanding: earned - paid,
    };
  });
  return {
    milestones,
    summary: summarize(rows),
    months: group((e) => monthOf(e.assignment.interviewDate)),
    companies: group((e) => e.factory),
    orders: group((e) => e.assignment.order?.name || "Chưa gán đơn hàng"),
    policies: group((e) => e.policyName + " · " + e.factory),
    stages,
  };
}
