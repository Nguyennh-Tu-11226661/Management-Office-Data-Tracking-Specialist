const groups = {
  TRAINING: ["Đỗ", "Đạt phỏng vấn", "Đang làm việc", "Đang đào tạo"],
  NEW: [
    "Đang chờ phỏng vấn",
    "Chưa đào tạo",
    "Đợi tháng mới",
    "Chờ xử lý/tiếp nhận mới",
  ],
  STOP: [
    "Trượt phỏng vấn",
    "Bỏ phỏng vấn",
    "Bỏ đào tạo",
    "Bỏ khác",
    "Bỏ xưởng",
    "Bỏ vì sức khỏe",
    "Đã nghỉ việc",
    "Nghỉ hẳn",
    "Hết hợp đồng",
    "Chuyển chính thức",
    "Hết phí",
  ],
};
module.exports = async function seedCatalogs(db) {
  for (const [category, names] of Object.entries(groups))
    for (const name of names)
      await db.laborStatus.upsert({
        where: { name },
        create: {
          name,
          category,
          warnsDuplicate: ["Đang làm việc", "Chưa đào tạo"].includes(name),
          endsAssignment: category === "STOP",
        },
        update: {},
      });
};
