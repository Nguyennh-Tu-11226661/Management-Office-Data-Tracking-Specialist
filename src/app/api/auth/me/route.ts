import { NextRequest, NextResponse } from "next/server";
import { identity, grants } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const user = await identity(request);
  return NextResponse.json(
    user
      ? {
          success: true,
          data: {
            username: user.username,
            role: user.role,
            permissions: grants[user.role],
            localAutoView: user.version === "local-auto-view",
          },
        }
      : { success: false, message: "Vui lòng đăng nhập" },
    { status: user ? 200 : 401, headers: { "Cache-Control": "no-store" } },
  );
}
