import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/auth";
import { resultError } from "@/lib/domain";
export const dynamic = "force-dynamic";
export async function GET(r: NextRequest) {
  const denied = await guard(r);
  if (denied) return denied;
  try {
    const p = r.nextUrl.searchParams,
      search = p.get("search")?.trim(),
      id = p.get("id");
    if (!search && !id) return NextResponse.json({ success: true, data: [] });
    const data = await prisma.worker.findMany({
      where: id
        ? { id }
        : {
            OR: [
              { idCard: search },
              { code: search },
              { assignments: { some: { employeeCode: search } } },
            ],
          },
      include: {
        bankAccounts: true,
        assignments: {
          include: {
            order: true,
            batch: true,
            events: { orderBy: [{ occurredOn: "asc" }, { createdAt: "asc" }] },
            bonusRecords: true,
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
      },
    });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return resultError(e);
  }
}
