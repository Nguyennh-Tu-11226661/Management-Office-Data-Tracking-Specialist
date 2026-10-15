import { PrismaClient } from "../../.generated/client";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
const settings = path.resolve(".local/evolution-preview.json");
const preview = existsSync(settings)
  ? JSON.parse(readFileSync(settings, "utf8"))
  : null;
let url =
  process.env.LOCAL_TEST_DATABASE_URL ||
  process.env.LOCAL_APPLICATION_DATABASE_URL ||
  preview?.databaseUrl;
if (url && url.startsWith("file:")) {
  const filePath = url.slice(5);
  if (!existsSync(filePath)) {
    const localDb = path.resolve(".local/evolution/preview/dev.db");
    if (existsSync(localDb)) {
      url = "file:" + localDb.replace(/\\/g, "/");
    }
  }
}
if (!url)
  throw new Error(
    "Schema mở rộng yêu cầu CSDL bản sao. Chạy node scripts/prepare-preview.cjs, không tự nâng cấp dữ liệu gốc.",
  );
const cache = globalThis as typeof globalThis & {
  evolutionPrisma?: PrismaClient;
};
export const prisma =
  cache.evolutionPrisma ||
  new PrismaClient({ datasources: { db: { url } }, log: ["error"] });
if (process.env.NODE_ENV !== "production") cache.evolutionPrisma = prisma;
