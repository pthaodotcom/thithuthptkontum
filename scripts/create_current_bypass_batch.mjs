import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Thiếu cấu hình Supabase service role.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function must(result, context) {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
}

function localDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function cloneFirstExamCode({ sourceExamId, targetCaThiMonId }) {
  const sourceExam = must(
    await supabase
      .from("de_thi")
      .select(
        "de_thi_id,nguoi_tao_tai_khoan_id,phan1_so_cau,phan1_diem_moi_cau,phan2_so_cau,phan2_diem_1y,phan2_diem_2y,phan2_diem_3y,phan2_diem_4y,phan3_so_cau,phan3_diem_moi_cau,ma_tran"
      )
      .eq("de_thi_id", sourceExamId)
      .single(),
    `Đọc đề nguồn ${sourceExamId}`
  );
  const sourceCode = must(
    await supabase
      .from("ma_de")
      .select("thu_tu_hien_thi")
      .eq("de_thi_id", sourceExamId)
      .order("so_thu_tu_ma")
      .limit(1)
      .single(),
    `Đọc mã đề nguồn ${sourceExamId}`
  );

  const displayOrder = Array.isArray(sourceCode.thu_tu_hien_thi)
    ? sourceCode.thu_tu_hien_thi
    : [];
  const oldSnapshotIds = displayOrder.map((item) => item.snapshot_id).filter(Boolean);
  if (!oldSnapshotIds.length) throw new Error(`Đề nguồn ${sourceExamId} không có câu hỏi.`);

  const sourceSnapshots = must(
    await supabase
      .from("cau_hoi_snapshot")
      .select("snapshot_id,cau_hoi_goc_id,phan,chuyen_de_id,muc_do_id,noi_dung,dap_an_phan3")
      .in("snapshot_id", oldSnapshotIds),
    `Đọc câu hỏi của đề nguồn ${sourceExamId}`
  );
  const sourceDetails = must(
    await supabase
      .from("chi_tiet_cau_hoi_snapshot")
      .select("cau_hoi_snapshot_id,thu_tu,noi_dung,la_dap_an_dung")
      .in("cau_hoi_snapshot_id", oldSnapshotIds),
    `Đọc phương án của đề nguồn ${sourceExamId}`
  );

  const newExamId = randomUUID();
  const snapshotIdMap = new Map(oldSnapshotIds.map((id) => [id, randomUUID()]));
  try {
    must(
      await supabase.from("de_thi").insert({
        de_thi_id: newExamId,
        ca_thi_mon_id: targetCaThiMonId,
        trang_thai: "DaGiaoChuaBatDau",
        so_ma_de: 1,
        nguoi_tao_tai_khoan_id: sourceExam.nguoi_tao_tai_khoan_id,
        phan1_so_cau: sourceExam.phan1_so_cau,
        phan1_diem_moi_cau: sourceExam.phan1_diem_moi_cau,
        phan2_so_cau: sourceExam.phan2_so_cau,
        phan2_diem_1y: sourceExam.phan2_diem_1y,
        phan2_diem_2y: sourceExam.phan2_diem_2y,
        phan2_diem_3y: sourceExam.phan2_diem_3y,
        phan2_diem_4y: sourceExam.phan2_diem_4y,
        phan3_so_cau: sourceExam.phan3_so_cau,
        phan3_diem_moi_cau: sourceExam.phan3_diem_moi_cau,
        ma_tran: sourceExam.ma_tran ?? [],
      }),
      `Tạo bản đề bypass từ ${sourceExamId}`
    );

    must(
      await supabase.from("cau_hoi_snapshot").insert(
        sourceSnapshots.map((row) => ({
          snapshot_id: snapshotIdMap.get(row.snapshot_id),
          de_thi_id: newExamId,
          cau_hoi_goc_id: row.cau_hoi_goc_id,
          phan: row.phan,
          chuyen_de_id: row.chuyen_de_id,
          muc_do_id: row.muc_do_id,
          noi_dung: row.noi_dung,
          dap_an_phan3: row.dap_an_phan3,
        }))
      ),
      `Sao chép câu hỏi cho đề ${newExamId}`
    );

    if (sourceDetails.length) {
      must(
        await supabase.from("chi_tiet_cau_hoi_snapshot").insert(
          sourceDetails.map((row) => ({
            id: randomUUID(),
            cau_hoi_snapshot_id: snapshotIdMap.get(row.cau_hoi_snapshot_id),
            thu_tu: row.thu_tu,
            noi_dung: row.noi_dung,
            la_dap_an_dung: row.la_dap_an_dung,
          }))
        ),
        `Sao chép phương án cho đề ${newExamId}`
      );
    }

    must(
      await supabase.from("ma_de").insert({
        ma_de_id: randomUUID(),
        de_thi_id: newExamId,
        so_thu_tu_ma: 1,
        thu_tu_hien_thi: displayOrder.map((item) => ({
          ...item,
          snapshot_id: snapshotIdMap.get(item.snapshot_id),
        })),
      }),
      `Tạo mã đề cho ${newExamId}`
    );
  } catch (error) {
    await supabase.from("de_thi").delete().eq("de_thi_id", newExamId);
    throw error;
  }
  return newExamId;
}

async function cleanupBatch(dotThiId) {
  const sessions = must(
    await supabase.from("ca_thi").select("ca_thi_id").eq("dot_thi_id", dotThiId),
    "Đọc ca thi để hoàn tác"
  );
  const sessionIds = sessions.map((row) => row.ca_thi_id);
  if (sessionIds.length) {
    const subjectSessions = must(
      await supabase.from("ca_thi_mon").select("id").in("ca_thi_id", sessionIds),
      "Đọc ca thi môn để hoàn tác"
    );
    const subjectSessionIds = subjectSessions.map((row) => row.id);
    if (subjectSessionIds.length) {
      must(
        await supabase.from("bai_lam_thi").delete().in("ca_thi_mon_id", subjectSessionIds),
        "Xóa bài làm khi hoàn tác"
      );
      must(
        await supabase.from("de_thi").delete().in("ca_thi_mon_id", subjectSessionIds),
        "Xóa đề thi khi hoàn tác"
      );
    }
  }
  must(await supabase.from("dot_thi").delete().eq("dot_thi_id", dotThiId), "Xóa đợt thi khi hoàn tác");
}

async function main() {
  const now = new Date();
  const local = localDateParts(now);
  const today = `${local.year}-${local.month}-${local.day}`;
  const tomorrowDate = new Date(`${today}T12:00:00+07:00`);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowLocal = localDateParts(tomorrowDate);
  const tomorrow = `${tomorrowLocal.year}-${tomorrowLocal.month}-${tomorrowLocal.day}`;
  const batchName = `Đợt thi bypass ${local.day}/${local.month}/${local.year} ${local.hour}:${local.minute}`;

  const [classes, students, subjects, admins] = await Promise.all([
    supabase.from("lop").select("lop_id").eq("trang_thai", "HoatDong"),
    supabase
      .from("tai_khoan")
      .select("tai_khoan_id,lop_id,mon_tu_chon_1_id,mon_tu_chon_2_id")
      .eq("vai_tro", "HocSinh")
      .eq("trang_thai", "HoatDong"),
    supabase
      .from("mon")
      .select("mon_id,ten_mon,to_truong_tai_khoan_id")
      .eq("trang_thai", "DangDung"),
    supabase
      .from("tai_khoan")
      .select("tai_khoan_id")
      .eq("vai_tro", "Admin")
      .eq("trang_thai", "HoatDong")
      .limit(1),
  ]);
  const classRows = must(classes, "Đọc danh sách lớp");
  const studentRows = must(students, "Đọc danh sách học sinh");
  const subjectRows = must(subjects, "Đọc danh sách môn");
  const adminRows = must(admins, "Đọc tài khoản quản trị");
  if (!classRows.length || !studentRows.length || !adminRows.length) {
    throw new Error("Thiếu lớp, học sinh hoặc tài khoản quản trị để tạo đợt thi.");
  }

  const subjectByName = new Map(subjectRows.map((row) => [row.ten_mon, row]));
  const math = subjectByName.get("Toán");
  if (!math) throw new Error("Không tìm thấy môn Toán đang sử dụng.");

  const sourceExamBySubject = new Map();
  for (const subject of subjectRows) {
    const exams = must(
      await supabase
        .from("de_thi")
        .select("de_thi_id,created_at,ca_thi_mon!inner(mon_id)")
        .eq("ca_thi_mon.mon_id", subject.mon_id)
        .order("created_at", { ascending: false })
        .limit(20),
      `Tìm đề nguồn môn ${subject.ten_mon}`
    );
    for (const exam of exams) {
      const codes = must(
        await supabase.from("ma_de").select("ma_de_id").eq("de_thi_id", exam.de_thi_id).limit(1),
        `Kiểm tra mã đề môn ${subject.ten_mon}`
      );
      if (codes.length) {
        sourceExamBySubject.set(subject.mon_id, exam.de_thi_id);
        break;
      }
    }
  }

  let dotThiId;
  try {
    dotThiId = must(
      await supabase.rpc("tao_dot_thi_day_du", {
        p_ten: batchName,
        p_ngay_1: today,
        p_ngay_2: tomorrow,
        p_lop_ids: classRows.map((row) => row.lop_id),
      }),
      "Tạo đợt thi"
    );

    const sessions = must(
      await supabase
        .from("ca_thi")
        .select("ca_thi_id,so_thu_tu_ca")
        .eq("dot_thi_id", dotThiId)
        .order("so_thu_tu_ca"),
      "Đọc bốn ca thi vừa tạo"
    );
    const sessionByNumber = new Map(sessions.map((row) => [row.so_thu_tu_ca, row]));
    const firstSession = sessionByNumber.get(1);
    const secondSession = sessionByNumber.get(2);
    if (!firstSession || !secondSession || sessions.length !== 4) throw new Error("Đợt thi không có đủ bốn ca.");

    const mandatorySubjectSessions = must(
      await supabase
        .from("ca_thi_mon")
        .select("id,ca_thi_id,mon_id")
        .in("ca_thi_id", [firstSession.ca_thi_id, secondSession.ca_thi_id]),
      "Đọc ca môn bắt buộc"
    );
    const firstSubjectSession = mandatorySubjectSessions.find((row) => row.ca_thi_id === firstSession.ca_thi_id);
    const secondSubjectSession = mandatorySubjectSessions.find((row) => row.ca_thi_id === secondSession.ca_thi_id);
    if (!firstSubjectSession || !secondSubjectSession) throw new Error("Thiếu ca môn bắt buộc.");

    must(
      await supabase.from("bai_lam_thi").delete().eq("ca_thi_mon_id", firstSubjectSession.id),
      "Bỏ danh sách Ngữ Văn thi giấy"
    );
    must(
      await supabase.from("ca_thi_mon").delete().eq("id", firstSubjectSession.id),
      "Bỏ môn Ngữ Văn thi giấy khỏi hệ thống"
    );
    must(
      await supabase.from("ca_thi").delete().eq("ca_thi_id", firstSession.ca_thi_id),
      "Bỏ Ca 1 thi giấy khỏi hệ thống"
    );
    must(
      await supabase.from("ca_thi_mon").update({ mon_id: math.mon_id }).eq("id", secondSubjectSession.id),
      "Đưa Toán vào Ca 2"
    );

    const schedule = [
      { number: 2, start: addMinutes(now, -2), end: addMinutes(now, 90), status: "DangMo" },
      { number: 3, start: addMinutes(now, 230), end: addMinutes(now, 280), status: "SapDienRa" },
      { number: 4, start: addMinutes(now, 290), end: addMinutes(now, 340), status: "SapDienRa" },
    ];
    for (const slot of schedule) {
      const session = sessionByNumber.get(slot.number);
      must(
        await supabase
          .from("ca_thi")
          .update({
            gio_bat_dau: slot.start.toISOString(),
            gio_ket_thuc: slot.end.toISOString(),
            trang_thai: slot.status,
          })
          .eq("ca_thi_id", session.ca_thi_id),
        `Cập nhật giờ ca ${slot.number}`
      );
    }

    const allSubjectSessions = must(
      await supabase
        .from("ca_thi_mon")
        .select("id,ca_thi_id,mon_id")
        .in("ca_thi_id", sessions.map((row) => row.ca_thi_id)),
      "Đọc các môn trong đợt thi"
    );
    // Khi tạo bypass vào cuối ngày, cron có thể kịp đóng các khung giờ chuẩn
    // trước khi lịch mới được ghi và đánh dấu học sinh là vắng mặt. Chỉ reset
    // các bài của chính đợt vừa tạo; không chạm vào lịch sử của đợt khác.
    must(
      await supabase
        .from("bai_lam_thi")
        .update({
          trang_thai: "ChuaDangNhap",
          de_thi_id: null,
          ma_de_id: null,
          thoi_diem_vao_thi: null,
          thoi_diem_nop: null,
          diem_tong: null,
          so_cau_dung: null,
          so_cau_sai: null,
          thu_tu_hien_thi: [],
        })
        .in(
          "ca_thi_mon_id",
          allSubjectSessions.map((row) => row.id)
        )
        .eq("trang_thai", "VangMat"),
      "Khôi phục trạng thái chờ thi của đợt bypass"
    );
    const sessionNumberById = new Map(sessions.map((row) => [row.ca_thi_id, row.so_thu_tu_ca]));
    allSubjectSessions.sort(
      (a, b) => (sessionNumberById.get(a.ca_thi_id) ?? 99) - (sessionNumberById.get(b.ca_thi_id) ?? 99)
    );

    const firstTargetBySubject = new Map();
    for (const row of allSubjectSessions) {
      if (!firstTargetBySubject.has(row.mon_id)) firstTargetBySubject.set(row.mon_id, row.id);
    }

    const cloned = [];
    const missing = [];
    for (const [subjectId, targetCaThiMonId] of firstTargetBySubject) {
      const subject = subjectRows.find((row) => row.mon_id === subjectId);
      const sourceExamId = sourceExamBySubject.get(subjectId);
      if (!sourceExamId) {
        missing.push(subject?.ten_mon ?? subjectId);
        continue;
      }
      const newExamId = await cloneFirstExamCode({ sourceExamId, targetCaThiMonId });
      cloned.push({ mon: subject?.ten_mon ?? subjectId, deThiId: newExamId });
    }

    const mathAttempts = must(
      await supabase
        .from("bai_lam_thi")
        .select("bai_lam_id")
        .eq("ca_thi_mon_id", secondSubjectSession.id),
      "Đọc danh sách thi Toán"
    );
    must(
      await supabase.from("log_xu_ly_ngoai_le").insert(
        mathAttempts.map((row) => ({
          bai_lam_id: row.bai_lam_id,
          loai_xu_ly: "MoKhoaVaoTre",
          nguoi_thuc_hien_tai_khoan_id: adminRows[0].tai_khoan_id,
          ly_do: "Đợt thi bypass mở ngay theo yêu cầu kiểm thử",
        }))
      ),
      "Mở khóa vào thi Toán cho toàn bộ học sinh"
    );

    must(
      await supabase.from("audit_log").insert({
        hanh_dong: "TaoDotThiBypass",
        doi_tuong: "DotThi",
        doi_tuong_id: dotThiId,
        nguoi_thuc_hien_tai_khoan_id: adminRows[0].tai_khoan_id,
        du_lieu: {
          ten: batchName,
          so_hoc_sinh: studentRows.length,
          thu_tu: ["Toán (Ca 2)", "Tự chọn 1 (Ca 3)", "Tự chọn 2 (Ca 4)"],
          mon_chua_co_de: missing,
        },
      }),
      "Ghi nhật ký tạo đợt thi bypass"
    );

    console.log(
      JSON.stringify(
        {
          dotThiId,
          tenDotThi: batchName,
          soHocSinh: studentRows.length,
          toanCaThiMonId: secondSubjectSession.id,
          toanBatDau: schedule[0].start.toISOString(),
          toanKetThuc: schedule[0].end.toISOString(),
          soDeDaGan: cloned.length,
          deDaGan: cloned,
          monChuaCoDeNguon: missing,
        },
        null,
        2
      )
    );
  } catch (error) {
    if (dotThiId) {
      try {
        await cleanupBatch(dotThiId);
      } catch (cleanupError) {
        console.error("Không hoàn tác trọn vẹn:", cleanupError instanceof Error ? cleanupError.message : cleanupError);
      }
    }
    throw error;
  }
}

await main();
