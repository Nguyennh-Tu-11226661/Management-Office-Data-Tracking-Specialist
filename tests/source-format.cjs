const fs = require("fs"),
  ts = require("typescript"),
  vm = require("vm"),
  assert = require("assert/strict");
function load(file, deps) {
  const m = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { module: m, exports: m.exports, Date, require: (n) => deps[n] },
  );
  return m.exports;
}
const v = load("src/lib/worker-validation.ts", {});
const s = load("src/lib/source-format.ts", { "@/lib/worker-validation": v });
assert.equal(s.sourceMonth("Tháng 05", "04/05/2026"), "T05.2026");
assert.throws(() => s.sourceMonth("Tháng 05", ""));
assert.equal(s.sourceRewardAmount("500,000 - 7 công"), 500000);
assert.equal(s.sourceRewardAmount("2,000,000 - HTHĐ 3 tháng"), 2000000);
assert.equal(s.sourceRewardAmount("Tặng quạt Senko"), 0);
assert.equal(s.sourceRewardAmount("Ko đạt thưởng"), 0);
assert.equal(s.sourceHeader("Nhà \r\nmáy làm việc"), "Nhà máy làm việc");
console.log(
  "PASS source headers, month from source date, reward amount excludes work-day digits, gifts retained separately",
);
