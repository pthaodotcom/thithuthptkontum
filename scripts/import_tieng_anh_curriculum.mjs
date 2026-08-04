import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local variables
const env = fs.readFileSync(".env.local", "utf8");
const lines = env.split("\n");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

for (const line of lines) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) supabaseKey = line.split("=")[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const chuyenDeList = [
  {
    ma: "CD1_TA",
    ten: "Unit 1: Life stories we admire",
    baiHoc: [
      { ma: "B1_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B2_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B3_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B4_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD2_TA",
    ten: "Unit 2: A multicultural world",
    baiHoc: [
      { ma: "B5_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B6_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B7_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B8_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD3_TA",
    ten: "Unit 3: Green living",
    baiHoc: [
      { ma: "B9_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B10_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B11_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B12_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD4_TA",
    ten: "Review 1 (Units 1 - 2 - 3)",
    baiHoc: [
      { ma: "B13_TA", ten: "Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B14_TA", ten: "Bài 2: Skills Review (Reading, Speaking, Listening, Writing)" }
    ]
  },
  {
    ma: "CD5_TA",
    ten: "Unit 4: Urbanisation",
    baiHoc: [
      { ma: "B15_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B16_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B17_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B18_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD6_TA",
    ten: "Unit 5: The world of work",
    baiHoc: [
      { ma: "B19_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B20_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B21_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B22_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD7_TA",
    ten: "Review 2 (Units 4 - 5)",
    baiHoc: [
      { ma: "B23_TA", ten: "Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B24_TA", ten: "Bài 2: Skills Review (Reading, Speaking, Listening, Writing)" }
    ]
  },
  {
    ma: "CD8_TA",
    ten: "Unit 6: Artificial intelligence",
    baiHoc: [
      { ma: "B25_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B26_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B27_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B28_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD9_TA",
    ten: "Unit 7: The world of mass media",
    baiHoc: [
      { ma: "B29_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B30_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B31_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B32_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD10_TA",
    ten: "Unit 8: Wildlife conservation",
    baiHoc: [
      { ma: "B33_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B34_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B35_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B36_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD11_TA",
    ten: "Review 3 (Units 6 - 7 - 8)",
    baiHoc: [
      { ma: "B37_TA", ten: "Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B38_TA", ten: "Bài 2: Skills Review (Reading, Speaking, Listening, Writing)" }
    ]
  },
  {
    ma: "CD12_TA",
    ten: "Unit 9: Career paths",
    baiHoc: [
      { ma: "B39_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B40_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B41_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B42_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD13_TA",
    ten: "Unit 10: Lifelong learning",
    baiHoc: [
      { ma: "B43_TA", ten: "Bài 1: Getting Started & Language (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B44_TA", ten: "Bài 2: Reading & Listening Skills" },
      { ma: "B45_TA", ten: "Bài 3: Speaking & Writing Skills" },
      { ma: "B46_TA", ten: "Bài 4: Communication and Culture / CLIL & Looking Back" }
    ]
  },
  {
    ma: "CD14_TA",
    ten: "Review 4 (Units 9 - 10)",
    baiHoc: [
      { ma: "B47_TA", ten: "Bài 1: Language Review (Vocabulary, Pronunciation, Grammar)" },
      { ma: "B48_TA", ten: "Bài 2: Skills Review (Reading, Speaking, Listening, Writing)" }
    ]
  }
];

async function seed() {
  console.log("Đang tìm môn Tiếng Anh / Ngoại ngữ...");
  let { data: monList, error: monErr } = await supabase
    .from("mon")
    .select("mon_id, ten_mon")
    .in("ten_mon", ["Tiếng Anh", "Tiếng anh", "Ngoại ngữ", "Ngoại Ngữ"])
    .eq("trang_thai", "DangDung");

  let monId = null;

  if (monList && monList.length > 0) {
    monId = monList[0].mon_id;
    console.log(`Đã tìm thấy môn ${monList[0].ten_mon} (ID: ${monId})`);
    
    // Cập nhật tên chuẩn 'Tiếng Anh' và cấu trúc đề 40 câu trắc nghiệm
    await supabase
      .from("mon")
      .update({
        ten_mon: "Tiếng Anh",
        phan1_so_cau: 40,
        phan1_diem_moi_cau: 0.25,
        phan2_so_cau: null,
        phan2_diem_1y: null,
        phan2_diem_2y: null,
        phan2_diem_3y: null,
        phan2_diem_4y: null,
        phan3_so_cau: null,
        phan3_diem_moi_cau: null
      })
      .eq("mon_id", monId);
  } else {
    console.log("Tạo mới môn Tiếng Anh...");
    const { data: newMon, error: createErr } = await supabase
      .from("mon")
      .insert({
        ten_mon: "Tiếng Anh",
        loai_mon: "TuChon",
        trang_thai: "DangDung",
        phan1_so_cau: 40,
        phan1_diem_moi_cau: 0.25
      })
      .select("mon_id")
      .single();

    if (createErr) {
      console.error("Lỗi tạo môn Tiếng Anh:", createErr);
      process.exit(1);
    }
    monId = newMon.mon_id;
    console.log(`Đã tạo môn Tiếng Anh (ID: ${monId})`);
  }

  let totalCd = 0;
  let totalBh = 0;

  for (const cd of chuyenDeList) {
    // Check if chuyen_de exists
    const { data: existingCd } = await supabase
      .from("chuyen_de")
      .select("chuyen_de_id")
      .eq("mon_id", monId)
      .or(`ma_chuyen_de.eq.${cd.ma},ten_chuyen_de.eq.${cd.ten}`)
      .limit(1);

    let cdId;

    if (existingCd && existingCd.length > 0) {
      cdId = existingCd[0].chuyen_de_id;
      await supabase
        .from("chuyen_de")
        .update({ ma_chuyen_de: cd.ma, ten_chuyen_de: cd.ten, trang_thai: "DangDung" })
        .eq("chuyen_de_id", cdId);
    } else {
      const { data: newCd, error: cdErr } = await supabase
        .from("chuyen_de")
        .insert({
          mon_id: monId,
          ma_chuyen_de: cd.ma,
          ten_chuyen_de: cd.ten,
          trang_thai: "DangDung"
        })
        .select("chuyen_de_id")
        .single();

      if (cdErr) {
        console.error(`Lỗi tạo chuyên đề ${cd.ten}:`, cdErr);
        continue;
      }
      cdId = newCd.chuyen_de_id;
    }
    totalCd++;

    for (const bh of cd.baiHoc) {
      const { data: existingBh } = await supabase
        .from("bai_hoc")
        .select("bai_hoc_id")
        .eq("chuyen_de_id", cdId)
        .eq("ma_bai_hoc", bh.ma)
        .limit(1);

      if (existingBh && existingBh.length > 0) {
        await supabase
          .from("bai_hoc")
          .update({ ten_bai_hoc: bh.ten, trang_thai: "DangDung" })
          .eq("bai_hoc_id", existingBh[0].bai_hoc_id);
      } else {
        const { error: bhErr } = await supabase
          .from("bai_hoc")
          .insert({
            chuyen_de_id: cdId,
            ma_bai_hoc: bh.ma,
            ten_bai_hoc: bh.ten,
            trang_thai: "DangDung"
          });

        if (bhErr) {
          console.error(`Lỗi tạo bài học ${bh.ten}:`, bhErr);
        } else {
          totalBh++;
        }
      }
    }
  }

  console.log(`✅ Seed thành công ${totalCd} chuyên đề và ${totalBh} bài học môn Tiếng Anh!`);
}

seed().catch(err => {
  console.error("Lỗi seed:", err);
  process.exit(1);
});
