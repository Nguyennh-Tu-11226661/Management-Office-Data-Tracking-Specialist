const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const readline = require("node:readline");
const file = path.resolve(process.env.LOCAL_AUTH_FILE || ".local/auth.json");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));
(async () => {
  const username = (await ask("Tên đăng nhập (3-64 ký tự): ")).trim();
  const role = (await ask("Vai trò ADMIN / HR / FINANCE / VIEWER: "))
    .trim()
    .toUpperCase();
  rl.stdoutMuted = true;
  const originalWrite = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (text) => {
    if (!rl.stdoutMuted) originalWrite(text);
  };
  process.stdout.write("Mật khẩu (ít nhất 12 ký tự; không hiển thị): ");
  const password = await ask("");
  process.stdout.write("\nNhập lại mật khẩu: ");
  const confirm = await ask("");
  rl.stdoutMuted = false;
  process.stdout.write("\n");
  rl.close();
  if (
    !/^[a-zA-Z0-9_.-]{3,64}$/.test(username) ||
    !["ADMIN", "HR", "FINANCE", "VIEWER"].includes(role) ||
    password.length < 12 ||
    password.length > 128 ||
    password !== confirm
  )
    throw new Error("Thông tin không hợp lệ hoặc mật khẩu không khớp");
  if (fs.existsSync(file))
    throw new Error(
      "Tài khoản đã được khởi tạo. Hãy quản lý tài khoản tại màn hình Phân quyền.",
    );
  const config = { secret: crypto.randomBytes(32).toString("hex"), users: [] };
  if (!config.users.length && role !== "ADMIN")
    throw new Error("Tài khoản đầu tiên phải là ADMIN");
  if (config.users.some((u) => u.username === username))
    throw new Error("Tên đăng nhập đã tồn tại");
  const salt = crypto.randomBytes(16).toString("hex");
  config.users.push({
    username,
    role,
    salt,
    hash: crypto.scryptSync(password, salt, 64).toString("hex"),
    version: crypto.randomUUID(),
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(config, null, 2), {
    mode: 0o600,
    flag: "wx",
  });
  console.log("Đã tạo tài khoản. Không thay đổi CSDL lao động.");
})().catch((err) => {
  rl.close();
  console.error(err.message);
  process.exitCode = 1;
});
