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

const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi"];
const demNam = ["Văn", "Minh", "Đức", "Quang", "Thanh", "Gia", "Hữu", "Anh"];
const tenNam = [
  "Anh", "Bảo", "Duy", "Đạt", "Đức", "Huy", "Khang", "Kiên", "Long", "Minh",
  "Nam", "Phúc", "Quân", "Sơn", "Thành", "Thắng", "Thiện", "Toàn", "Trí", "Trung",
  "Tú", "Tùng", "Việt", "Vinh", "Khôi", "Lâm", "Mạnh", "Nhật", "Phong", "Tài",
  "Thịnh", "Thuận", "Tiến", "Tuấn", "Vũ", "Xuân", "Yên", "Bình", "Cường", "Hòa",
];
const demNu = ["Thị", "Ngọc", "Thanh", "Minh", "Khánh", "Gia", "Bảo", "Thu"];
const tenNu = [
  "Anh", "An", "Chi", "Diễm", "Giang", "Hà", "Hạnh", "Hiền", "Hoa", "Hương",
  "Lan", "Linh", "Ly", "Mai", "My", "Ngân", "Nga", "Ngọc", "Nhi", "Như",
  "Oanh", "Phương", "Quỳnh", "Thảo", "Thu", "Trang", "Trâm", "Tú", "Uyên", "Vân",
  "Vy", "Xuân", "Yến", "Yên", "Ánh", "Bích", "Cẩm", "Diệu", "Khôi", "Tâm",
];

const tenDotThi = new Map([
  ["M4 E2E Realtime Offline Load", { ten: "Khảo sát đầu năm lớp 12", namHoc: "2026-2027" }],
  ["Đề mẫu M4 Tin học", { ten: "Luyện tập môn Tin học", namHoc: "2026-2027" }],
  ["Đợt 1", { ten: "Thi thử tốt nghiệp THPT – Lần 1", namHoc: "2026-2027" }],
  ["Đợt 2", { ten: "Thi thử tốt nghiệp THPT – Lần 2", namHoc: "2026-2027" }],
  ["M5PIPE26_DOT_THI", { ten: "Đợt luyện tập tổng hợp", namHoc: "2026-2027" }],
  ["Đợt thi bypass 16/08/2026 17:24", { ten: "Thi thử tháng 8", namHoc: "2026-2027" }],
  ["bypass", { ten: "Thi thử tháng 9", namHoc: "2026-2027" }],
]);

function fail(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function tenNguoi(index, gioiTinh) {
  const dem = gioiTinh === "Nam" ? demNam : demNu;
  const ten = gioiTinh === "Nam" ? tenNam : tenNu;
  return `${ho[index % ho.length]} ${dem[(index * 3) % dem.length]} ${ten[(index * 7) % ten.length]}`;
}

function ngaySinh(nam, index) {
  const month = String((index * 5) % 12 + 1).padStart(2, "0");
  const day = String((index * 11) % 27 + 1).padStart(2, "0");
  return `${nam}-${month}-${day}`;
}

function phanLoaiBinhLuan(diem, mon) {
  const score = Number(diem ?? 0);
  const diemManh = score >= 8
    ? `Em nắm khá chắc kiến thức ${mon} và làm bài ổn định.`
    : score >= 6.5
      ? `Em đã nắm được phần kiến thức cơ bản của môn ${mon}.`
      : `Em đã có cố gắng khi hoàn thành bài thi ${mon}.`;
  return [
    `Điểm mạnh: ${diemManh}`,
    "Cần ôn thêm: Rà soát các câu chưa đúng, ưu tiên các chuyên đề có tỉ lệ đúng thấp.",
    "Gợi ý: Làm lại đề sau khi ôn để kiểm tra tiến bộ.",
  ].join("\n");
}

function taoHoSo(accounts, classById) {
  const admins = accounts.filter((item) => item.vai_tro === "Admin").sort((a, b) => a.ma_so.localeCompare(b.ma_so));
  const teachers = accounts.filter((item) => item.vai_tro === "GiaoVien").sort((a, b) => a.tai_khoan_id.localeCompare(b.tai_khoan_id));
  const students = accounts.filter((item) => item.vai_tro === "HocSinh").sort((a, b) => a.tai_khoan_id.localeCompare(b.tai_khoan_id));
  const studentSequenceByClass = new Map();
  const profiles = [];

  admins.forEach((account, index) => {
    const gender = index % 2 === 0 ? "Nu" : "Nam";
    profiles.push({
      tai_khoan_id: account.tai_khoan_id,
      ma_so: account.ma_so === "admin01" ? "admin01" : `QT${String(index + 1).padStart(3, "0")}`,
      ho_ten: tenNguoi(index + 100, gender),
      nam_sinh: 1978 + index * 4,
      ngay_sinh: ngaySinh(1978 + index * 4, index + 100),
      gioi_tinh: gender,
    });
  });

  const teacherWithExistingCode = teachers.find((item) => item.ma_so === "GV001");
  let teacherSequence = 2;
  teachers.forEach((account, index) => {
    const gender = index % 2 === 0 ? "Nam" : "Nu";
    const birthYear = 1972 + (index % 21);
    profiles.push({
      tai_khoan_id: account.tai_khoan_id,
      ma_so: account.tai_khoan_id === teacherWithExistingCode?.tai_khoan_id
        ? "GV001"
        : `GV${String(teacherSequence++).padStart(3, "0")}`,
      ho_ten: tenNguoi(index + 10, gender),
      nam_sinh: birthYear,
      ngay_sinh: ngaySinh(birthYear, index + 10),
      gioi_tinh: gender,
    });
  });

  students.forEach((account, index) => {
    const gender = index % 2 === 0 ? "Nu" : "Nam";
    const className = classById.get(account.lop_id) ?? "12A1";
    const next = (studentSequenceByClass.get(className) ?? 0) + 1;
    studentSequenceByClass.set(className, next);
    const birthYear = index % 5 === 0 ? 2007 : 2008;
    profiles.push({
      tai_khoan_id: account.tai_khoan_id,
      ma_so: `HS${className.replace(/\s/g, "")}${String(next).padStart(3, "0")}`,
      ho_ten: tenNguoi(index + 200, gender),
      nam_sinh: birthYear,
      ngay_sinh: ngaySinh(birthYear, index + 200),
      gioi_tinh: gender,
    });
  });

  const duplicateCodes = profiles.filter((item, index) => profiles.findIndex((other) => other.ma_so === item.ma_so) !== index);
  const duplicateNames = profiles.filter((item, index) => profiles.findIndex((other) => other.ho_ten === item.ho_ten) !== index);
  if (duplicateCodes.length || duplicateNames.length) throw new Error("Bộ dữ liệu chuẩn hóa có mã hoặc họ tên bị trùng.");
  return profiles;
}

async function docHienTrang() {
  const [accounts, classes, batches, skills, comments, attempts, sessions, subjects, notices] = await Promise.all([
    db.from("tai_khoan").select("tai_khoan_id,ma_so,ho_ten,vai_tro,nam_sinh,ngay_sinh,gioi_tinh,lop_id").order("tai_khoan_id"),
    db.from("lop").select("lop_id,ten_lop,khoi,trang_thai").order("lop_id"),
    db.from("dot_thi").select("dot_thi_id,ten_dot_thi,nam_hoc").order("dot_thi_id"),
    db.from("nang_luc_hoc_sinh").select("id,nam_hoc"),
    db.from("nhan_xet_ai").select("id,bai_lam_id,noi_dung"),
    db.from("bai_lam_thi").select("bai_lam_id,diem_tong,ca_thi_mon_id"),
    db.from("ca_thi_mon").select("id,mon_id"),
    db.from("mon").select("mon_id,ten_mon"),
    db.from("thong_bao_admin").select("id,loai,noi_dung"),
  ]);
  for (const [result, label] of [[accounts, "Đọc tài khoản"], [classes, "Đọc lớp"], [batches, "Đọc đợt thi"], [skills, "Đọc năng lực"], [comments, "Đọc nhận xét"], [attempts, "Đọc bài làm"], [sessions, "Đọc ca môn"], [subjects, "Đọc môn"], [notices, "Đọc thông báo"]]) fail(result.error, label);
  return { accounts: accounts.data, classes: classes.data, batches: batches.data, skills: skills.data, comments: comments.data, attempts: attempts.data, sessions: sessions.data, subjects: subjects.data, notices: notices.data };
}

function taoKeHoach(snapshot) {
  const classById = new Map(snapshot.classes.map((item) => [item.lop_id, item.ten_lop === "12 M4 E2E" ? "12A3" : item.ten_lop === "12 M4 Tin học" ? "12A4" : item.ten_lop]));
  const profiles = taoHoSo(snapshot.accounts, classById);
  const monById = new Map(snapshot.subjects.map((item) => [item.mon_id, item.ten_mon]));
  const caMonById = new Map(snapshot.sessions.map((item) => [item.id, item.mon_id]));
  const attemptById = new Map(snapshot.attempts.map((item) => [item.bai_lam_id, item]));
  const comments = snapshot.comments.flatMap((item) => {
    const attempt = attemptById.get(item.bai_lam_id);
    const mon = attempt ? monById.get(caMonById.get(attempt.ca_thi_mon_id)) : null;
    return attempt && mon ? [{ id: item.id, noi_dung: phanLoaiBinhLuan(attempt.diem_tong, mon) }] : [];
  });
  return {
    classUpdates: snapshot.classes.flatMap((item) => {
      const ten_lop = classById.get(item.lop_id);
      return ten_lop !== item.ten_lop ? [{ lop_id: item.lop_id, ten_lop, khoi: "12" }] : [];
    }),
    batchUpdates: snapshot.batches.flatMap((item) => {
      const target = tenDotThi.get(item.ten_dot_thi);
      return target && (target.ten !== item.ten_dot_thi || target.namHoc !== item.nam_hoc)
        ? [{ dot_thi_id: item.dot_thi_id, ten_dot_thi: target.ten, nam_hoc: target.namHoc }]
        : [];
    }),
    profileUpdates: profiles,
    skillUpdates: snapshot.skills.filter((item) => item.nam_hoc === "2098-2099").map((item) => ({ id: item.id, nam_hoc: "2026-2027" })),
    commentUpdates: comments,
    noticeUpdates: snapshot.notices.map((item) => ({
      id: item.id,
      noi_dung: item.loai === "ViPhamSLA"
        ? "Phân tích kết quả ca thi vượt quá thời hạn xử lý."
        : item.loai === "EmailThatBai"
          ? "Có email kết quả chưa gửi được, cần kiểm tra lại."
          : "Có kết quả chấm điểm đang chờ xử lý.",
    })),
  };
}

function luuBanSao(snapshot) {
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const output = join(backupDir, `system-demo-before-normalization-${stamp}.json`);
  writeFileSync(output, JSON.stringify(snapshot, null, 2), "utf8");
  return output;
}

async function apDungKeHoach(plan) {
  for (const row of plan.classUpdates) fail((await db.from("lop").update({ ten_lop: row.ten_lop, khoi: row.khoi }).eq("lop_id", row.lop_id)).error, "Chuẩn hóa lớp");
  for (const row of plan.batchUpdates) fail((await db.from("dot_thi").update({ ten_dot_thi: row.ten_dot_thi, nam_hoc: row.nam_hoc }).eq("dot_thi_id", row.dot_thi_id)).error, "Chuẩn hóa đợt thi");
  for (const row of plan.profileUpdates) {
    const { tai_khoan_id, ...profile } = row;
    fail((await db.from("tai_khoan").update(profile).eq("tai_khoan_id", tai_khoan_id)).error, "Chuẩn hóa tài khoản");
  }
  for (const row of plan.skillUpdates) fail((await db.from("nang_luc_hoc_sinh").update({ nam_hoc: row.nam_hoc }).eq("id", row.id)).error, "Chuẩn hóa năm học năng lực");
  for (const row of plan.commentUpdates) fail((await db.from("nhan_xet_ai").update({ noi_dung: row.noi_dung }).eq("id", row.id)).error, "Chuẩn hóa nhận xét");
  for (const row of plan.noticeUpdates) fail((await db.from("thong_bao_admin").update({ noi_dung: row.noi_dung }).eq("id", row.id)).error, "Chuẩn hóa thông báo quản trị");
}

async function khoiPhuc(file) {
  const snapshot = JSON.parse(readFileSync(resolve(file), "utf8"));
  for (const row of snapshot.classes) fail((await db.from("lop").update({ ten_lop: row.ten_lop, khoi: row.khoi, trang_thai: row.trang_thai }).eq("lop_id", row.lop_id)).error, "Khôi phục lớp");
  for (const row of snapshot.batches) fail((await db.from("dot_thi").update({ ten_dot_thi: row.ten_dot_thi, nam_hoc: row.nam_hoc }).eq("dot_thi_id", row.dot_thi_id)).error, "Khôi phục đợt thi");
  for (const [index, row] of snapshot.accounts.entries()) fail((await db.from("tai_khoan").update({ ma_so: `RB${String(index + 1).padStart(4, "0")}` }).eq("tai_khoan_id", row.tai_khoan_id)).error, "Chuẩn bị khôi phục tài khoản");
  for (const row of snapshot.accounts) fail((await db.from("tai_khoan").update({ ma_so: row.ma_so, ho_ten: row.ho_ten, nam_sinh: row.nam_sinh, ngay_sinh: row.ngay_sinh, gioi_tinh: row.gioi_tinh }).eq("tai_khoan_id", row.tai_khoan_id)).error, "Khôi phục tài khoản");
  for (const row of snapshot.skills) fail((await db.from("nang_luc_hoc_sinh").update({ nam_hoc: row.nam_hoc }).eq("id", row.id)).error, "Khôi phục năm học năng lực");
  for (const row of snapshot.comments) fail((await db.from("nhan_xet_ai").update({ noi_dung: row.noi_dung }).eq("id", row.id)).error, "Khôi phục nhận xét");
  for (const row of snapshot.notices) fail((await db.from("thong_bao_admin").update({ noi_dung: row.noi_dung }).eq("id", row.id)).error, "Khôi phục thông báo quản trị");
  console.log(JSON.stringify({ restored: true, source: resolve(file) }, null, 2));
}

if (restoreArg) {
  await khoiPhuc(restoreArg.slice("--restore=".length));
  process.exit(0);
}

const snapshot = await docHienTrang();
const plan = taoKeHoach(snapshot);
const summary = {
  accounts: plan.profileUpdates.length,
  classes: plan.classUpdates.length,
  examBatches: plan.batchUpdates.length,
  academicPerformanceRows: plan.skillUpdates.length,
  reportComments: plan.commentUpdates.length,
  adminNotices: plan.noticeUpdates.length,
};

if (!apply) {
  console.log(JSON.stringify({ dryRun: true, summary, apply: "node --env-file=.env.local scripts/normalize-system-demo-data.mjs --apply" }, null, 2));
  process.exit(0);
}

const backup = luuBanSao(snapshot);
await apDungKeHoach(plan);
console.log(JSON.stringify({ applied: true, summary, backup, rollback: `node --env-file=.env.local scripts/normalize-system-demo-data.mjs --restore=${backup}` }, null, 2));
