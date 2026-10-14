const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const preview = fs.existsSync(".local/evolution-preview.json")
  ? JSON.parse(fs.readFileSync(".local/evolution-preview.json", "utf8"))
  : null;
const localAutoView = process.env.LOCAL_DEMO_AUTO_VIEW !== "0";
const mode = process.argv[2];
if (!["dev", "build", "start"].includes(mode))
  throw new Error("Invalid Next.js mode");
const args = [
  path.resolve("node_modules/next/dist/bin/next"),
  mode,
  ...(mode === "build"
    ? []
    : ["-H", "127.0.0.1", "-p", process.env.LOCAL_APP_PORT || "3000"]),
];
const child = spawn(process.execPath, args, {
  env: {
    ...process.env,
    LOCAL_DEMO_AUTO_VIEW: localAutoView ? "1" : "0",
    ...(preview ? { LOCAL_APPLICATION_DATABASE_URL: preview.databaseUrl } : {}),
    LOCAL_BUILD_DIR: mode === "dev" ? ".next-local" : ".next-evolution",
  },
  stdio: "inherit",
});
child.on("exit", (code) => {
  process.exitCode = code || 0;
});
child.on("error", () => {
  console.error("Không thể khởi động Next.js");
  process.exitCode = 1;
});
