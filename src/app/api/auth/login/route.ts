import { NextRequest, NextResponse } from "next/server";
import {
  authenticate,
  issueSession,
  COOKIE,
  sameOrigin,
  rateLimit,
} from "@/lib/auth";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { success: false, message: "Nguồn yêu cầu không hợp lệ" },
      { status: 403 },
    );
  if (!rateLimit("login:global", 100))
    return NextResponse.json(
      {
        success: false,
        message: "Quá nhiều lần đăng nhập. Thử lại sau 15 phút.",
      },
      { status: 429 },
    );
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Dữ liệu không hợp lệ" },
      { status: 400 },
    );
  }
  if (
    typeof body?.username !== "string" ||
    typeof body?.password !== "string" ||
    body.username.length > 64 ||
    body.password.length > 128
  )
    return NextResponse.json(
      { success: false, message: "Thông tin không hợp lệ" },
      { status: 400 },
    );
  if (!rateLimit(`login:${body.username}`, 10))
    return NextResponse.json(
      {
        success: false,
        message: "Quá nhiều lần đăng nhập. Thử lại sau 15 phút.",
      },
      { status: 429 },
    );
  try {
    const user = await authenticate(body.username, body.password);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Tên đăng nhập hoặc mật khẩu không đúng" },
        { status: 401 },
      );
    const response = NextResponse.json({
      success: true,
      data: { username: user.username, role: user.role },
    });
    response.cookies.set(COOKIE, await issueSession(user), {
      httpOnly: true,
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Chưa cấu hình tài khoản. Quản trị viên chạy npm run auth:setup tại máy cục bộ.",
      },
      { status: 503 },
    );
  }
}
