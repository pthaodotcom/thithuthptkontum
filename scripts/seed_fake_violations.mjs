import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase credentials");

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function seedViolations() {
  console.log("Fetching students...");
  const { data: students, error: studentError } = await supabase
    .from("tai_khoan")
    .select("tai_khoan_id, ma_so, ho_ten")
    .eq("vai_tro", "HocSinh")
    .limit(10);

  if (studentError || !students || students.length < 6) {
    throw new Error("Could not find at least 6 students");
  }

  // Find an active ca_thi_mon
  const { data: ctmList, error: ctmError } = await supabase
    .from("ca_thi_mon")
    .select("id, mon(ten_mon), ca_thi(ca_thi_id, so_thu_tu_ca, dot_thi(ten_dot_thi))")
    .limit(5);

  if (ctmError || !ctmList || ctmList.length === 0) {
    throw new Error("No ca_thi_mon found");
  }

  const selectedCtm = ctmList[0];
  console.log(`Using CaThiMon: ${selectedCtm.id} (${selectedCtm.mon?.ten_mon} - ${selectedCtm.ca_thi?.dot_thi?.ten_dot_thi})`);

  // Define 6 student violation profiles
  const violationProfiles = [
    {
      studentIndex: 0,
      violations: [
        { loai_vi_pham: "ChuyenTab", minutesAgo: 25 },
        { loai_vi_pham: "ChuyenTab", minutesAgo: 18 },
        { loai_vi_pham: "ChuyenTab", minutesAgo: 8 },
        { loai_vi_pham: "Copy", minutesAgo: 3 },
      ],
      trang_thai: "DangThi",
    },
    {
      studentIndex: 1,
      violations: [
        { loai_vi_pham: "Copy", minutesAgo: 30 },
        { loai_vi_pham: "Copy", minutesAgo: 15 },
      ],
      trang_thai: "DangThi",
    },
    {
      studentIndex: 2,
      violations: [
        { loai_vi_pham: "ChuyenTab", minutesAgo: 22 },
        { loai_vi_pham: "MatKetNoi", minutesAgo: 12 },
      ],
      trang_thai: "DangThi",
    },
    {
      studentIndex: 3,
      violations: [
        { loai_vi_pham: "ChuyenTab", minutesAgo: 35 },
        { loai_vi_pham: "ChuyenTab", minutesAgo: 28 },
        { loai_vi_pham: "ChuyenTab", minutesAgo: 10 },
      ],
      trang_thai: "BiKhoaChoXuLy",
    },
    {
      studentIndex: 4,
      violations: [
        { loai_vi_pham: "MatKetNoi", minutesAgo: 19 },
      ],
      trang_thai: "DangThi",
    },
    {
      studentIndex: 5,
      violations: [
        { loai_vi_pham: "Copy", minutesAgo: 27 },
        { loai_vi_pham: "ChuyenTab", minutesAgo: 16 },
        { loai_vi_pham: "Copy", minutesAgo: 5 },
      ],
      trang_thai: "DangThi",
    },
  ];

  for (const prof of violationProfiles) {
    const student = students[prof.studentIndex];
    console.log(`Processing student: ${student.ho_ten} (${student.ma_so})`);

    // Ensure attempt exists
    let { data: attempt } = await supabase
      .from("bai_lam_thi")
      .select("bai_lam_id")
      .eq("ca_thi_mon_id", selectedCtm.id)
      .eq("hoc_sinh_tai_khoan_id", student.tai_khoan_id)
      .maybeSingle();

    if (!attempt) {
      const { data: newAttempt, error: createError } = await supabase
        .from("bai_lam_thi")
        .insert({
          ca_thi_mon_id: selectedCtm.id,
          hoc_sinh_tai_khoan_id: student.tai_khoan_id,
          trang_thai: prof.trang_thai,
          thoi_diem_vao_thi: new Date(Date.now() - 40 * 60_000).toISOString(),
        })
        .select("bai_lam_id")
        .single();

      if (createError) {
        console.error("Error creating attempt:", createError);
        continue;
      }
      attempt = newAttempt;
    } else {
      await supabase
        .from("bai_lam_thi")
        .update({ trang_thai: prof.trang_thai })
        .eq("bai_lam_id", attempt.bai_lam_id);
    }

    // Clean any old violations for this attempt
    await supabase.from("vi_pham").delete().eq("bai_lam_id", attempt.bai_lam_id);

    // Insert new violations
    const violationRows = prof.violations.map((v) => ({
      bai_lam_id: attempt.bai_lam_id,
      loai_vi_pham: v.loai_vi_pham,
      thoi_diem: new Date(Date.now() - v.minutesAgo * 60_000).toISOString(),
    }));

    const { error: insertError } = await supabase.from("vi_pham").insert(violationRows);
    if (insertError) {
      console.error(`Error inserting violations for ${student.ho_ten}:`, insertError);
    } else {
      console.log(`Inserted ${violationRows.length} violations for ${student.ho_ten}`);
    }
  }

  console.log("Finished seeding violations successfully!");
}

seedViolations().catch((err) => {
  console.error("Failed to seed violations:", err);
  process.exit(1);
});
