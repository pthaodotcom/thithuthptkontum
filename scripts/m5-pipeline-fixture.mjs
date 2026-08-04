import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Thieu NEXT_PUBLIC_SUPABASE_URL hoac SUPABASE_SERVICE_ROLE_KEY");

const db = createClient(url, key, { auth: { persistSession: false } });
const PREFIX = "M5PIPE26";
const DOT_NAME = `${PREFIX}_DOT_THI`;
const STUDENTS = Array.from({ length: 24 }, (_, index) => `${PREFIX}_HS_${String(index + 1).padStart(2, "0")}`);
const DEMO_SCORES = [9.2, 8.8, 8.4, 7.9, 7.5, 7.1, 6.8, 6.4, 6.0, 5.6, 5.2, 4.8, 8.1, 7.7, 7.2, 6.6, 6.1, 5.8, 5.4, 4.6, 4.2, 3.8, 3.4, 2.8];
const ALLOWED_ELECTIVES = [
  "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Địa lí",
  "Giáo dục kinh tế và pháp luật", "Tin học", "Công nghệ", "Ngoại ngữ",
];

async function must(query, label) {
  const { data, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function fixtureIds() {
  const students = await must(
    db.from("tai_khoan").select("tai_khoan_id,ma_so").like("ma_so", `${PREFIX}%`),
    "doc hoc sinh fixture",
  );
  const dot = await must(
    db.from("dot_thi").select("dot_thi_id").eq("ten_dot_thi", DOT_NAME).maybeSingle(),
    "doc dot thi fixture",
  );
  let caIds = [];
  let ctmIds = [];
  let baiIds = [];
  if (dot) {
    caIds = (await must(db.from("ca_thi").select("ca_thi_id").eq("dot_thi_id", dot.dot_thi_id), "doc ca"))
      .map((row) => row.ca_thi_id);
    if (caIds.length) {
      ctmIds = (await must(db.from("ca_thi_mon").select("id").in("ca_thi_id", caIds), "doc ca mon"))
        .map((row) => row.id);
    }
    if (ctmIds.length) {
      baiIds = (await must(db.from("bai_lam_thi").select("bai_lam_id").in("ca_thi_mon_id", ctmIds), "doc bai"))
        .map((row) => row.bai_lam_id);
    }
  }
  if (students.length) {
    const studentBaiIds = (await must(
      db.from("bai_lam_thi").select("bai_lam_id")
        .in("hoc_sinh_tai_khoan_id", students.map((row) => row.tai_khoan_id)),
      "doc bai cua hoc sinh fixture",
    )).map((row) => row.bai_lam_id);
    baiIds = [...new Set([...baiIds, ...studentBaiIds])];
  }
  return { students, dot, caIds, ctmIds, baiIds };
}

async function cleanup() {
  const ids = await fixtureIds();
  if (ids.baiIds.length) {
    await must(db.from("job_hang_doi").delete().in("tham_chieu_id", ids.baiIds), "xoa job bai");
    await must(db.from("thong_bao_admin").delete().in("tham_chieu_id", ids.baiIds), "xoa thong bao bai");
    await must(db.from("bai_lam_thi").delete().in("bai_lam_id", ids.baiIds), "xoa bai");
  }
  if (ids.caIds.length) {
    await must(db.from("job_hang_doi").delete().in("tham_chieu_id", ids.caIds), "xoa job ca");
    await must(db.from("thong_bao_admin").delete().in("tham_chieu_id", ids.caIds), "xoa thong bao ca");
  }
  if (ids.dot) await must(db.from("dot_thi").delete().eq("dot_thi_id", ids.dot.dot_thi_id), "xoa dot");
  if (ids.students.length) {
    await must(
      db.from("nang_luc_hoc_sinh").delete()
        .in("hoc_sinh_tai_khoan_id", ids.students.map((row) => row.tai_khoan_id)),
      "xoa nang luc hoc sinh",
    );
    await must(
      db.from("tai_khoan").delete().in("tai_khoan_id", ids.students.map((row) => row.tai_khoan_id)),
      "xoa hoc sinh",
    );
  }
  console.log(JSON.stringify({ action: "cleanup", removed: ids }, null, 2));
}

async function setup() {
  await cleanup();
  const classes = await must(db.from("lop").select("lop_id,ten_lop").eq("trang_thai", "HoatDong").order("ten_lop").limit(3), "tim lop");
  if (!classes.length) throw new Error("Can it nhat mot lop dang hoat dong");
  const electiveSubjects = await must(
    db.from("mon").select("mon_id").eq("loai_mon", "TuChon").eq("trang_thai", "DangDung")
      .in("ten_mon", ALLOWED_ELECTIVES).limit(2),
    "tim hai mon tu chon",
  );
  if (electiveSubjects.length < 2) throw new Error("Can it nhat hai mon tu chon dang dung");
  const seedSnapshot = await must(
    db.from("cau_hoi_snapshot")
      .select("de_thi_id")
      .not("chuyen_de_id", "is", null)
      .limit(1)
      .maybeSingle(),
    "tim snapshot co chuyen de",
  );
  if (!seedSnapshot) throw new Error("Khong co snapshot co chuyen de de tao fixture");
  const de = await must(
    db.from("de_thi").select("de_thi_id,ca_thi_mon!inner(mon_id)")
      .eq("de_thi_id", seedSnapshot.de_thi_id).single(),
    "doc de cua snapshot",
  );
  const snapshots = await must(
    db.from("cau_hoi_snapshot")
      .select("snapshot_id,phan,chuyen_de_id,dap_an_phan3,chi_tiet_cau_hoi_snapshot(id,thu_tu,la_dap_an_dung)")
      .eq("de_thi_id", de.de_thi_id).not("chuyen_de_id", "is", null),
    "doc snapshot cua de",
  );
  const now = Date.now();
  const dot = await must(db.from("dot_thi").insert({
    ten_dot_thi: DOT_NAME,
    nam_hoc: "2026-2027",
    ngay_thi_1: "2026-07-29",
    ngay_thi_2: "2026-07-30",
  }).select("dot_thi_id").single(), "tao dot");
  await must(db.from("dot_thi_lop").insert(classes.map((lop) => ({
    dot_thi_id: dot.dot_thi_id,
    lop_id: lop.lop_id,
  }))), "gan lop vao dot thi");
  const ca = await must(db.from("ca_thi").insert({
    dot_thi_id: dot.dot_thi_id,
    so_thu_tu_ca: 1,
    gio_bat_dau: new Date(now - 3_600_000).toISOString(),
    gio_ket_thuc: new Date(now - 60_000).toISOString(),
    trang_thai: "DangMo",
  }).select("ca_thi_id").single(), "tao ca");
  const monId = Array.isArray(de.ca_thi_mon) ? de.ca_thi_mon[0].mon_id : de.ca_thi_mon.mon_id;
  const ctm = await must(db.from("ca_thi_mon").insert({
    ca_thi_id: ca.ca_thi_id, mon_id: monId,
  }).select("id").single(), "tao ca mon");
  const studentRows = await must(db.from("tai_khoan").insert(STUDENTS.map((maSo, index) => ({
    ma_so: maSo, ho_ten: `Học sinh Demo ${String(index + 1).padStart(2, "0")}`,
    mat_khau_hash: "fixture-not-for-login", vai_tro: "HocSinh", phai_doi_mat_khau: false,
    lop_id: classes[index % classes.length].lop_id, nam_sinh: 2008,
    mon_tu_chon_1_id: electiveSubjects[0].mon_id, mon_tu_chon_2_id: electiveSubjects[1].mon_id,
    email_phu_huynh: "phuongthao2005daodao@gmail.com",
  }))).select("tai_khoan_id,ma_so"), "tao hoc sinh");
  const baiRows = await must(db.from("bai_lam_thi").insert(studentRows.map((student, index) => ({
    ca_thi_mon_id: ctm.id,
    hoc_sinh_tai_khoan_id: student.tai_khoan_id,
    de_thi_id: de.de_thi_id,
    trang_thai: "DaNopBai",
    thoi_diem_vao_thi: new Date(now - 30 * 60_000).toISOString(),
    thoi_diem_nop: new Date(now - 5 * 60_000).toISOString(),
    diem_tong: DEMO_SCORES[index],
    so_cau_dung: Math.round(snapshots.length * DEMO_SCORES[index] / 10),
    so_cau_sai: snapshots.length - Math.round(snapshots.length * DEMO_SCORES[index] / 10),
  }))).select("bai_lam_id,hoc_sinh_tai_khoan_id"), "tao bai");
  const answers = [];
  for (let rowIndex = 0; rowIndex < baiRows.length; rowIndex++) {
    const bai = baiRows[rowIndex];
    const studentIndex = studentRows.findIndex((student) => student.tai_khoan_id === bai.hoc_sinh_tai_khoan_id);
    const targetCorrect = Math.round(snapshots.length * DEMO_SCORES[studentIndex] / 10);
    for (let questionIndex = 0; questionIndex < snapshots.length; questionIndex++) {
      const q = snapshots[questionIndex];
      const correct = ((questionIndex * 7 + studentIndex * 3) % snapshots.length) < targetCorrect;
      if (q.phan === "I") {
        const choices = q.chi_tiet_cau_hoi_snapshot ?? [];
        const choice = choices.find((x) => x.la_dap_an_dung === correct) ?? choices[0];
        if (choice) answers.push({ bai_lam_id: bai.bai_lam_id, cau_hoi_snapshot_id: q.snapshot_id, chi_tiet_thu_tu: 0, dap_an_lua_chon_id: choice.id });
      } else if (q.phan === "II") {
        for (const choice of q.chi_tiet_cau_hoi_snapshot ?? []) {
          answers.push({ bai_lam_id: bai.bai_lam_id, cau_hoi_snapshot_id: q.snapshot_id, chi_tiet_thu_tu: choice.thu_tu, dap_an_dung_sai: correct ? choice.la_dap_an_dung : !choice.la_dap_an_dung });
        }
      } else {
        answers.push({ bai_lam_id: bai.bai_lam_id, cau_hoi_snapshot_id: q.snapshot_id, chi_tiet_thu_tu: 0, dap_an_chuoi: correct ? q.dap_an_phan3 : "__SAI__" });
      }
    }
  }
  if (answers.length) await must(db.from("tra_loi").insert(answers), "tao cau tra loi");
  await must(db.from("ca_thi").update({ trang_thai: "KetThuc" }).eq("ca_thi_id", ca.ca_thi_id), "ket thuc ca");
  console.log(JSON.stringify({ action: "setup", dotId: dot.dot_thi_id, caId: ca.ca_thi_id, baiIds: baiRows.map((x) => x.bai_lam_id) }, null, 2));
}

async function advance() {
  const ids = await fixtureIds();
  if (!ids.baiIds.length) throw new Error("Fixture chua duoc tao");
  const refs = [...ids.baiIds, ...ids.caIds];
  await must(
    db.from("job_hang_doi").update({ chay_luc: new Date(Date.now() - 1000).toISOString() })
      .in("tham_chieu_id", refs).eq("trang_thai", "ChoXuLy")
      .neq("loai_job", "thu_lai_nhan_xet_ai"),
    "day nhanh job fixture",
  );
  console.log(JSON.stringify({ action: "advance", refs }, null, 2));
}

async function status() {
  const ids = await fixtureIds();
  const refs = [...ids.baiIds, ...ids.caIds];
  const [jobs, analyses, comments, emails] = await Promise.all([
    refs.length ? must(db.from("job_hang_doi").select("*").in("tham_chieu_id", refs).order("created_at"), "doc jobs") : [],
    ids.baiIds.length ? must(db.from("phan_tich_chuyen_de").select("*").in("bai_lam_id", ids.baiIds), "doc phan tich") : [],
    ids.baiIds.length ? must(db.from("nhan_xet_ai").select("*").in("bai_lam_id", ids.baiIds), "doc nhan xet") : [],
    ids.baiIds.length ? must(db.from("email_log").select("*").in("bai_lam_id", ids.baiIds), "doc email") : [],
  ]);
  console.log(JSON.stringify({ ids, jobs, analyses, comments, emails }, null, 2));
}

async function retrigger() {
  const ids = await fixtureIds();
  if (ids.caIds.length !== 1) throw new Error("Fixture phai co dung mot ca");
  await must(db.from("ca_thi").update({ trang_thai: "DangMo" }).eq("ca_thi_id", ids.caIds[0]), "mo lai ca fixture");
  await must(db.from("ca_thi").update({ trang_thai: "KetThuc" }).eq("ca_thi_id", ids.caIds[0]), "ket thuc lai ca fixture");
  const jobs = await must(
    db.from("job_hang_doi").select("id").eq("tham_chieu_id", ids.caIds[0]).eq("loai_job", "phan_tich_ket_qua"),
    "dem job phan tich",
  );
  console.log(JSON.stringify({ action: "retrigger", analysisJobCount: jobs.length }, null, 2));
}

const action = process.argv[2];
if (action === "setup") await setup();
else if (action === "advance") await advance();
else if (action === "status") await status();
else if (action === "cleanup") await cleanup();
else if (action === "retrigger") await retrigger();
else throw new Error("Dung: setup | advance | status | cleanup | retrigger");
