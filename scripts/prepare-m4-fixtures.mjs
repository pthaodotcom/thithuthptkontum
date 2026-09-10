import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const db = createClient(url, key, { auth: { persistSession: false } });
const fixed = (n) => `e2000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const ids = {
  lop: fixed(1),
  admin: fixed(3),
  primaryStudent: fixed(4),
  dot: fixed(5),
  ca: [11, 12, 13, 14].map(fixed),
  ctm: [21, 22, 23, 24].map(fixed),
  de: [31, 32, 33, 34].map(fixed),
  snapshot: [41, 42, 43, 44].map(fixed),
  choice: [51, 52, 53, 54].map(fixed),
  maDe: [61, 62, 63, 64].map(fixed),
  primaryAttempts: [71, 72, 73, 74].map(fixed),
  loadStudents: Array.from({ length: 20 }, (_, index) => fixed(100 + index)),
  loadAttempts: Array.from({ length: 20 }, (_, index) => fixed(200 + index)),
};
const adminCode = process.env.E2E_ADMIN_MA_SO || "m4-admin";
const adminPassword = process.env.E2E_ADMIN_MAT_KHAU || "M4Admin@123";
const studentCode = process.env.E2E_HOC_SINH_MA_SO || "m4-student";
const studentPassword = process.env.E2E_HOC_SINH_MAT_KHAU || "M4Student@123";
const loadPassword = process.env.K6_HOC_SINH_MAT_KHAU || "M4Load@123";

async function upsert(table, rows, onConflict) {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
}

const { data: subjects, error: subjectError } = await db
  .from("mon")
  .select("mon_id,ten_mon")
  .in("ten_mon", ["Tin học", "Vật lí"])
  .eq("loai_mon", "TuChon")
  .eq("trang_thai", "DangDung");
if (subjectError) throw subjectError;
const tinHocId = subjects?.find((item) => item.ten_mon === "Tin học")?.mon_id;
const vatLiId = subjects?.find((item) => item.ten_mon === "Vật lí")?.mon_id;
if (!tinHocId || !vatLiId) {
  throw new Error("Apply migration 0019 before preparing M4 fixtures");
}

await upsert("lop", {
  lop_id: ids.lop,
  ten_lop: "12 M4 E2E",
  khoi: "12",
  trang_thai: "HoatDong",
}, "lop_id");

const [adminHash, studentHash, loadHash] = await Promise.all([
  bcrypt.hash(adminPassword, 10),
  bcrypt.hash(studentPassword, 10),
  bcrypt.hash(loadPassword, 10),
]);
await upsert("tai_khoan", [{
  tai_khoan_id: ids.admin,
  ma_so: adminCode,
  ho_ten: "Admin M4 E2E",
  mat_khau_hash: adminHash,
  vai_tro: "Admin",
  nam_sinh: 1990,
  phai_doi_mat_khau: false,
  trang_thai: "HoatDong",
}, {
  tai_khoan_id: ids.primaryStudent,
  ma_so: studentCode,
  ho_ten: "Học sinh M4 E2E",
  mat_khau_hash: studentHash,
  vai_tro: "HocSinh",
  nam_sinh: 2008,
  lop_id: ids.lop,
  mon_tu_chon_1_id: tinHocId,
  mon_tu_chon_2_id: vatLiId,
  phai_doi_mat_khau: false,
  trang_thai: "HoatDong",
}, ...ids.loadStudents.map((studentId, index) => ({
  tai_khoan_id: studentId,
  ma_so: `m4-load-${String(index + 1).padStart(2, "0")}`,
  ho_ten: `Học sinh tải M4 ${index + 1}`,
  mat_khau_hash: loadHash,
  vai_tro: "HocSinh",
  nam_sinh: 2008,
  lop_id: ids.lop,
  mon_tu_chon_1_id: tinHocId,
  mon_tu_chon_2_id: vatLiId,
  phai_doi_mat_khau: false,
  trang_thai: "HoatDong",
}))], "tai_khoan_id");

await upsert("dot_thi", {
  dot_thi_id: ids.dot,
  ten_dot_thi: "M4 E2E Realtime Offline Load",
  nam_hoc: "2026-2027",
  ngay_thi_1: "2026-09-05",
  ngay_thi_2: "2026-09-06",
}, "dot_thi_id");

// Remove only disposable E2E attempts before rebuilding their immutable papers.
await db.from("bai_lam_thi").delete().in("de_thi_id", ids.de);
for (const deId of ids.de) {
  await db.from("de_thi").update({ trang_thai: "DangSoan" }).eq("de_thi_id", deId);
}
await db.from("de_thi").delete().in("de_thi_id", ids.de);

const start = new Date(Date.now() - 5 * 60_000).toISOString();
const end = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
for (let index = 0; index < 4; index += 1) {
  await upsert("ca_thi", {
    ca_thi_id: ids.ca[index],
    dot_thi_id: ids.dot,
    so_thu_tu_ca: index + 1,
    gio_bat_dau: start,
    gio_ket_thuc: end,
    trang_thai: "DangMo",
  }, "ca_thi_id");
  await upsert("ca_thi_mon", {
    id: ids.ctm[index],
    ca_thi_id: ids.ca[index],
    mon_id: tinHocId,
  }, "id");
  await upsert("de_thi", {
    de_thi_id: ids.de[index],
    ca_thi_mon_id: ids.ctm[index],
    trang_thai: "DangThi",
    so_ma_de: 1,
    nguoi_tao_tai_khoan_id: ids.admin,
    phan1_so_cau: 1,
    phan1_diem_moi_cau: 10,
  }, "de_thi_id");
  await upsert("cau_hoi_snapshot", {
    snapshot_id: ids.snapshot[index],
    de_thi_id: ids.de[index],
    phan: "I",
    noi_dung: `Câu E2E ${index + 1}: chọn đáp án đúng.`,
  }, "snapshot_id");
  await upsert("chi_tiet_cau_hoi_snapshot", {
    id: ids.choice[index],
    cau_hoi_snapshot_id: ids.snapshot[index],
    thu_tu: 1,
    noi_dung: "Đáp án đúng",
    la_dap_an_dung: true,
  }, "id");
  await upsert("ma_de", {
    ma_de_id: ids.maDe[index],
    de_thi_id: ids.de[index],
    so_thu_tu_ma: 1,
    thu_tu_hien_thi: [{
      snapshot_id: ids.snapshot[index],
      phan: "I",
      thu_tu_phuong_an: [1],
    }],
  }, "ma_de_id");
  await upsert("bai_lam_thi", {
    bai_lam_id: ids.primaryAttempts[index],
    ca_thi_mon_id: ids.ctm[index],
    hoc_sinh_tai_khoan_id: ids.primaryStudent,
    de_thi_id: ids.de[index],
    ma_de_id: ids.maDe[index],
    trang_thai: "DangThi",
    thoi_diem_vao_thi: new Date().toISOString(),
    thoi_diem_nop: null,
    diem_tong: null,
    so_cau_dung: null,
    so_cau_sai: null,
    ly_do_nop: null,
    canh_bao_luu_cuoi: false,
  }, "bai_lam_id");
}

for (let index = 0; index < 20; index += 1) {
  await upsert("bai_lam_thi", {
    bai_lam_id: ids.loadAttempts[index],
    ca_thi_mon_id: ids.ctm[3],
    hoc_sinh_tai_khoan_id: ids.loadStudents[index],
    de_thi_id: ids.de[3],
    ma_de_id: ids.maDe[3],
    trang_thai: "DangThi",
    thoi_diem_vao_thi: new Date().toISOString(),
    thoi_diem_nop: null,
    diem_tong: null,
    so_cau_dung: null,
    so_cau_sai: null,
    ly_do_nop: null,
    canh_bao_luu_cuoi: false,
  }, "bai_lam_id");
}

console.log([
  `E2E_ADMIN_MA_SO=${adminCode}`,
  `E2E_ADMIN_MAT_KHAU=${adminPassword}`,
  `E2E_HOC_SINH_MA_SO=${studentCode}`,
  `E2E_HOC_SINH_MAT_KHAU=${studentPassword}`,
  `E2E_VI_PHAM_BAI_LAM_ID=${ids.primaryAttempts[0]}`,
  `E2E_POLLING_BAI_LAM_ID=${ids.primaryAttempts[1]}`,
  `E2E_SUBMIT_BAI_LAM_ID=${ids.primaryAttempts[2]}`,
  `E2E_OFFLINE_BAI_LAM_ID=${ids.primaryAttempts[3]}`,
  `E2E_OFFLINE_CA_THI_MON_ID=${ids.ctm[3]}`,
  `K6_HOC_SINH_MAT_KHAU=${loadPassword}`,
  `K6_BAI_LAM_IDS_JSON=${JSON.stringify(ids.loadAttempts)}`,
  `K6_TRA_LOI_JSON=${JSON.stringify([{
    cauHoiSnapshotId: ids.snapshot[3],
    chiTietThuTu: 0,
    dapAnLuaChonId: ids.choice[3],
  }])}`,
].join("\n"));
