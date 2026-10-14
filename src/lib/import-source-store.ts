import { splitImportReview } from "@/lib/import-review";
import { mkdir, writeFile, rename, readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
const directory = path.resolve(".local/source-imports");
export async function saveImportSource(
  type: string,
  file: string,
  sheet: string,
  rows: any[],
  warnings: string[],
  errors: string[],
) {
  await mkdir(directory, { recursive: true });
  const id = randomUUID(),
    target = path.join(directory, id + ".json");
  const payload = {
    id,
    type,
    file,
    sheet,
    createdAt: new Date().toISOString(),
    rows: rows.map((e) => ({
      row: e.row,
      values: e.raw,
      ...(() => {
        const review = splitImportReview(
          [...warnings, ...errors].filter((s) =>
            s.startsWith(`Dòng ${e.row}:`),
          ),
        );
        return {
          warnings: review.warnings.map((i) => i.message),
          duplicates: review.duplicates.map((i) => i.message),
        };
      })(),
    })),
  };
  await writeFile(target + ".tmp", JSON.stringify(payload), "utf8");
  await rename(target + ".tmp", target);
  return id;
}
export async function readImportSources() {
  let files: string[];
  try {
    files = await readdir(directory);
  } catch (e: any) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
  return Promise.all(
    files
      .filter((f) => /^[a-f0-9-]+\.json$/.test(f))
      .map(async (f) =>
        JSON.parse(await readFile(path.join(directory, f), "utf8")),
      ),
  );
}
