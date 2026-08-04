import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const lichSuCurriculum = [
  {
    ma: "CD1_SU",
    ten: "Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh",
    baiHoc: [
      { ma: "B1_SU", ten: "Bài 1: Liên Hợp Quốc" },
      { ma: "B2_SU", ten: "Bài 2: Trật tự thế giới trong Chiến tranh lạnh" },
      { ma: "B3_SU", ten: "Bài 3: Trật tự thế giới sau Chiến tranh lạnh" }
    ]
  },
  {
    ma: "CD2_SU",
    ten: "Chủ đề 2: ASEAN: Những chặng đường lịch sử",
    baiHoc: [
      { ma: "B4_SU", ten: "Bài 4: Sự ra đời và phát triển của Hiệp hội các quốc gia Đông Nam Á (ASEAN)" },
      { ma: "B5_SU", ten: "Bài 5: Cộng đồng ASEAN: Từ ý tưởng đến hiện thực" }
    ]
  },
  {
    ma: "CD3_SU",
    ten: "Chủ đề 3: Cách mạng tháng Tám 1945, chiến tranh giải phóng dân tộc và bảo vệ Tổ quốc",
    baiHoc: [
      { ma: "B6_SU", ten: "Bài 6: Cách mạng tháng Tám năm 1945" },
      { ma: "B7_SU", ten: "Bài 7: Cuộc kháng chiến chống thực dân Pháp (1945 – 1954)" },
      { ma: "B8_SU", ten: "Bài 8: Cuộc kháng chiến chống Mỹ, cứu nước (1954 – 1975)" },
      { ma: "B9_SU", ten: "Bài 9: Chiến tranh bảo vệ Tổ quốc từ sau tháng 4-1975 đến nay & bài học lịch sử" }
    ]
  },
  {
    ma: "CD4_SU",
    ten: "Chủ đề 4: Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay",
    baiHoc: [
      { ma: "B10_SU", ten: "Bài 10: Khái quát về công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay" },
      { ma: "B11_SU", ten: "Bài 11: Thành tựu cơ bản và bài học kinh nghiệm của công cuộc Đổi mới" }
    ]
  },
  {
    ma: "CD5_SU",
    ten: "Chủ đề 5: Lịch sử đối ngoại của Việt Nam thời kì hiện đại",
    baiHoc: [
      { ma: "B12_SU", ten: "Bài 12: Hoạt động đối ngoại của Việt Nam trong đấu tranh giành độc lập (1900 - 1945)" },
      { ma: "B13_SU", ten: "Bài 13: Hoạt động đối ngoại của Việt Nam trong hai cuộc kháng chiến (1945 - 1975)" },
      { ma: "B14_SU", ten: "Bài 14: Hoạt động đối ngoại của Việt Nam từ năm 1975 đến nay" }
    ]
  },
  {
    ma: "CD6_SU",
    ten: "Chủ đề 6: Hồ Chí Minh trong lịch sử Việt Nam",
    baiHoc: [
      { ma: "B15_SU", ten: "Bài 15: Hồ Chí Minh - Anh hùng giải phóng dân tộc, Nhà văn hóa kiệt xuất" }
    ]
  },
  {
    ma: "CD7_SU",
    ten: "Chuyên đề 1: Lịch sử tín ngưỡng và tôn giáo ở Việt Nam",
    baiHoc: [
      { ma: "B16_SU", ten: "Bài 16: Khái lược về tín ngưỡng và tôn giáo ở Việt Nam" },
      { ma: "B17_SU", ten: "Bài 17: Một số tín ngưỡng và tôn giáo lớn ở Việt Nam" }
    ]
  },
  {
    ma: "CD8_SU",
    ten: "Chuyên đề 2: Nhật Bản: Hành trình lịch sử từ năm 1945 đến nay",
    baiHoc: [
      { ma: "B18_SU", ten: "Bài 18: Nhật Bản từ năm 1945 đến nay và bài học thành công" }
    ]
  },
  {
    ma: "CD9_SU",
    ten: "Chuyên đề 3: Quá trình hội nhập quốc tế của Việt Nam",
    baiHoc: [
      { ma: "B19_SU", ten: "Bài 19: Khái quát quá trình hội nhập quốc tế của Việt Nam" }
    ]
  }
];

async function seedLichSu() {
  console.log("=== BẮT ĐẦU SEED KHUNG CHUYÊN ĐỀ MÔN LỊCH SỬ ===");

  const { data: monList } = await supabase.from("mon").select("mon_id, ten_mon").ilike("ten_mon", "Lịch s%").eq("trang_thai", "DangDung");
  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Lịch sử.");
    return;
  }
  const monId = monList[0].mon_id;
  console.log(`Môn Lịch sử ID: ${monId}`);

  let totalCdCount = 0;
  let totalBhCount = 0;

  for (const cd of lichSuCurriculum) {
    let cdId = null;
    const { data: existingCd } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).or(`ma_chuyen_de.eq.${cd.ma},ten_chuyen_de.ilike.${cd.ten}`).maybeSingle();

    if (existingCd) {
      cdId = existingCd.chuyen_de_id;
      await supabase.from("chuyen_de").update({ ma_chuyen_de: cd.ma, ten_chuyen_de: cd.ten, trang_thai: "DangDung" }).eq("chuyen_de_id", cdId);
    } else {
      const { data: newCd } = await supabase.from("chuyen_de").insert({ mon_id: monId, ma_chuyen_de: cd.ma, ten_chuyen_de: cd.ten, trang_thai: "DangDung" }).select("chuyen_de_id").single();
      cdId = newCd.chuyen_de_id;
    }
    totalCdCount++;

    for (const bh of cd.baiHoc) {
      const { data: existingBh } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", cdId).or(`ma_bai_hoc.eq.${bh.ma},ten_bai_hoc.ilike.${bh.ten}`).maybeSingle();
      if (existingBh) {
        await supabase.from("bai_hoc").update({ ma_bai_hoc: bh.ma, ten_bai_hoc: bh.ten, trang_thai: "DangDung" }).eq("bai_hoc_id", existingBh.bai_hoc_id);
      } else {
        await supabase.from("bai_hoc").insert({ chuyen_de_id: cdId, ma_bai_hoc: bh.ma, ten_bai_hoc: bh.ten, trang_thai: "DangDung" });
      }
      totalBhCount++;
    }
  }

  console.log(`🎉 NẠP THÀNH CÔNG ${totalCdCount} CHỦ ĐỀ/CHUYÊN ĐỀ VÀ ${totalBhCount} BÀI HỌC CHO MÔN LỊCH SỬ!`);
}

seedLichSu().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
