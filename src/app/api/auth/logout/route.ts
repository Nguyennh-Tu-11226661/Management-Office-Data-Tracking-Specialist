import { NextRequest, NextResponse } from "next/server";
import { COOKIE, sameOrigin, identity, saveUser } from "@/lib/auth";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { success: false, message: "Nguồn yêu cầu không hợp lệ" },
      { status: 403 },
    );
  const user = await identity(request);
  try {
    if (user)
      await saveUser(
        { mode: "update", username: user.username, role: user.role },
        user.username,
        "LOGOUT",
      );
  } catch {
    return NextResponse.json(
      { success: false, message: "Không thể kết thúc phiên. Hãy thử lại." },
      { status: 503 },
    );
  }
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
