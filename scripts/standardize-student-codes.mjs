import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const currentDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const backupDir = resolve(currentDir, "../data-backups");
const args = new Set(process.argv.slice(2));
const restoreArg = process.argv.find((arg) => arg.startsWith("--restore="));
const apply = args.has("--apply");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Thiếu biến môi trường Supabase. Chạy bằng node --env-file=.env.local.");
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function fail(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function restore(backupFile) {
  const backup = JSON.parse(readFileSync(resolve(backupFile), "utf8"));
  if (backup.kind !== "student-code-standardization" || !Array.isArray(backup.students)) {
    throw new Error("Tệp sao lưu không phù hợp.");
  }

  for (const student of backup.students) {
    const { error } = await db.from("tai_khoan")
      .update({ ma_so: student.ma_so })
      .eq("tai_khoan_id", student.tai_khoan_id);
    fail(error, `Không thể khôi phục mã học sinh ${student.tai_khoan_id}`);
  }

  console.log(`Đã khôi phục ${backup.students.length} mã học sinh.`);
}

async function main() {
  if (restoreArg) {
    await restore(restoreArg.slice("--restore=".length));
    return;
  }

  const { data: students, error } = await db.from("tai_khoan")
    .select("tai_khoan_id, ma_so, lop_id")
    .eq("vai_tro", "HocSinh")
    .order("ma_so", { ascending: true });
  fail(error, "Không thể đọc danh sách học sinh");

  const mappings = students.map((student, index) => ({
    ...student,
    ma_so_moi: `HS${String(index + 1).padStart(5, "0")}`,
  }));

  const targetCodes = new Set(mappings.map((item) => item.ma_so_moi));
  if (targetCodes.size !== mappings.length) throw new Error("Mã học sinh đích bị trùng lặp.");

  const { data: existingTargetCodes, error: targetCodeError } = await db.from("tai_khoan")
    .select("tai_khoan_id, ma_so")
    .in("ma_so", [...targetCodes]);
  fail(targetCodeError, "Không thể kiểm tra trùng mã học sinh");

  const targetOwner = new Map(mappings.map((item) => [item.ma_so_moi, item.tai_khoan_id]));
  const conflicts = existingTargetCodes.filter((item) => targetOwner.get(item.ma_so) !== item.tai_khoan_id);
  if (conflicts.length > 0) {
    throw new Error(`Mã đích đang thuộc tài khoản khác: ${conflicts.map((item) => item.ma_so).join(", ")}`);
  }

  const changed = mappings.filter((item) => item.ma_so !== item.ma_so_moi);
  console.log(JSON.stringify({
    studentCount: mappings.length,
    changedCount: changed.length,
    firstCode: mappings[0]?.ma_so_moi ?? null,
    lastCode: mappings.at(-1)?.ma_so_moi ?? null,
    mode: apply ? "apply" : "dry-run",
  }, null, 2));

  if (!apply || changed.length === 0) return;

  mkdirSync(backupDir, { recursive: true });
  const backupFile = join(backupDir, `student-codes-before-standardization-${new Date().toISOString().replaceAll(":", "-")}.json`);
  writeFileSync(backupFile, JSON.stringify({
    kind: "student-code-standardization",
    createdAt: new Date().toISOString(),
    students: mappings.map(({ tai_khoan_id, ma_so }) => ({ tai_khoan_id, ma_so })),
  }, null, 2));

  for (const student of changed) {
    const { error: updateError } = await db.from("tai_khoan")
      .update({ ma_so: student.ma_so_moi })
      .eq("tai_khoan_id", student.tai_khoan_id);
    fail(updateError, `Không thể cập nhật mã học sinh ${student.ma_so}`);
  }

  console.log(`Đã chuẩn hóa ${changed.length} mã học sinh. Sao lưu: ${backupFile}`);
}

await main();
