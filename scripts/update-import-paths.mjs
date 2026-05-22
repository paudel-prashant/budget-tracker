import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

const replacements = [
  ["@/auth.config", "@/auth/config"],
  ["@/lib/monthly-report-data", "@/lib/data/monthly-report-data"],
  ["@/lib/monthly-report", "@/lib/domain/monthly-report"],
  ["@/lib/export-monthly-report-pdf", "@/lib/services/export-monthly-report-pdf"],
  ["@/lib/category-mapping-service", "@/lib/domain/category-mapping-service"],
  ["@/lib/category-suggestion-engine", "@/lib/domain/category-suggestion-engine"],
  ["@/lib/dashboard-insights", "@/lib/domain/dashboard-insights"],
  ["@/lib/transaction-import-hash", "@/lib/domain/transaction-import-hash"],
  ["@/lib/transaction-categories", "@/lib/domain/transaction-categories"],
  ["@/lib/transaction-filters", "@/lib/domain/transaction-filters"],
  ["@/lib/recurring-processor", "@/lib/domain/recurring-processor"],
  ["@/lib/recurrence-dates", "@/lib/domain/recurrence-dates"],
  ["@/lib/budget-calculations", "@/lib/domain/budget-calculations"],
  ["@/lib/csv-transaction-import", "@/lib/services/csv-transaction-import"],
  ["@/lib/import-preview-service", "@/lib/data/import-preview-service"],
  ["@/lib/serialize-transaction", "@/lib/services/serialize-transaction"],
  ["@/lib/chart-data", "@/lib/domain/chart-data"],
  ["@/lib/dashboard-data", "@/lib/data/dashboard-data"],
  ["@/lib/insights-data", "@/lib/data/insights-data"],
  ["@/lib/budget-data", "@/lib/data/budget-data"],
  ["@/lib/layout-constants", "@/lib/config/layout-constants"],
  ["@/lib/transaction-validation", "@/lib/validation/transaction-validation"],
  ["@/lib/budget-validation", "@/lib/validation/budget-validation"],
  ["@/lib/recurring-validation", "@/lib/validation/recurring-validation"],
  ["@/lib/theme-context", "@/lib/theme/theme-context"],
  ["@/lib/chart-styles", "@/lib/theme/chart-styles"],
  ["@/lib/form-field", "@/lib/theme/form-field"],
  ["@/lib/api-auth", "@/lib/auth/api-auth"],
  ["@/lib/revalidate-pages", "@/lib/utils/revalidate-pages"],
  ["@/lib/api-utils", "@/lib/utils/api-utils"],
  ["@/lib/csv-utils", "@/lib/services/csv-utils"],
  ["@/lib/navigation", "@/lib/config/navigation"],
  ["@/lib/prisma", "@/lib/db/prisma"],
  ["@/lib/env", "@/lib/config/env"],
  ["@/lib/format", "@/lib/utils/format"],
  ['from "@/lib/theme"', 'from "@/lib/theme/theme"'],
  ["@/components/providers/", "@/components/shared/providers/"],
  ["@/components/layout/", "@/components/shared/layout/"],
  ["@/components/ui/", "@/components/shared/ui/"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(root)) {
  if (file.includes(`${path.sep}scripts${path.sep}update-import-paths.mjs`)) {
    continue;
  }
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed += 1;
  }
}

console.log(`Updated imports in ${changed} files.`);
