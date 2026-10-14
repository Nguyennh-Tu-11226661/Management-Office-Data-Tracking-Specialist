const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

async function splitExcel() {
  const sourcePath =
    "C:\\Users\\nguye\\Downloads\\Mau_Du_Lieu_10000_LaoDong_2026.xlsx";
  console.log(`Đang đọc file nguồn: ${sourcePath}...`);
  const wbSource = XLSX.readFile(sourcePath);
  const sheet = wbSource.Sheets["DS_TONG"];
  if (!sheet) {
    throw new Error("Không tìm thấy sheet DS_TONG trong file nguồn!");
  }

  const allRows = XLSX.utils.sheet_to_json(sheet);
  console.log(`Tổng số dòng trong DS_TONG: ${allRows.length}`);

  const part1Rows = allRows.slice(0, 5000);
  const part2Rows = allRows.slice(5000, 10000);

  const userDownloadsDir = "C:\\Users\\nguye\\Downloads";
  const publicDir = path.join(process.cwd(), "public");

  // File 1
  const wb1 = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(part1Rows);
  XLSX.utils.book_append_sheet(wb1, ws1, "DS_TONG");
  const file1Name = "DS_TONG_Phan1_5000_UngVien.xlsx";
  const path1 = path.join(userDownloadsDir, file1Name);
  XLSX.writeFile(wb1, path1);
  XLSX.writeFile(wb1, path.join(publicDir, file1Name));
  console.log(`✅ Đã tạo Phần 1 (5.000 dòng): ${path1}`);

  // File 2
  const wb2 = XLSX.utils.book_new();
  const ws2 = XLSX.utils.json_to_sheet(part2Rows);
  XLSX.utils.book_append_sheet(wb2, ws2, "DS_TONG");
  const file2Name = "DS_TONG_Phan2_5000_UngVien.xlsx";
  const path2 = path.join(userDownloadsDir, file2Name);
  XLSX.writeFile(wb2, path2);
  XLSX.writeFile(wb2, path.join(publicDir, file2Name));
  console.log(`✅ Đã tạo Phần 2 (5.000 dòng): ${path2}`);
}

splitExcel().catch((err) => {
  console.error("Lỗi:", err);
  process.exit(1);
});
