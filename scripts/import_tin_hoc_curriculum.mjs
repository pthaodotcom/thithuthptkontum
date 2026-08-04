import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const chuyenDeList = [
  {
    ma: "CD1",
    ten: "Chủ đề 1: Máy tính và xã hội tri thức",
    baiHoc: [
      { ma: "B1", ten: "Bài 1: Làm quen với Trí tuệ nhân tạo" },
      { ma: "B2", ten: "Bài 2: Trí tuệ nhân tạo trong khoa học và đời sống" }
    ]
  },
  {
    ma: "CD2",
    ten: "Chủ đề 2: Mạng máy tính và internet",
    baiHoc: [
      { ma: "B3", ten: "Bài 3: Một số thiết bị mạng thông dụng" },
      { ma: "B4", ten: "Bài 4: Giao thức mạng" },
      { ma: "B5", ten: "Bài 5: Thực hành chia sẻ tài nguyên trên mạng" }
    ]
  },
  {
    ma: "CD3",
    ten: "Chủ đề 3: Đạo đức, pháp luật và văn hóa trong môi trường số",
    baiHoc: [
      { ma: "B6", ten: "Bài 6: Giao tiếp và ứng xử trong không gian mạng" }
    ]
  },
  {
    ma: "CD4",
    ten: "Chủ đề 4: Giải quyết vấn đề với sự trợ giúp của máy tính",
    baiHoc: [
      { ma: "B7", ten: "Bài 7: HTML và cấu trúc trang web" },
      { ma: "B8", ten: "Bài 8: Định dạng văn bản" },
      { ma: "B9", ten: "Bài 9: Tạo danh sách, bảng" },
      { ma: "B10", ten: "Bài 10: Tạo liên kết" },
      { ma: "B11", ten: "Bài 11: Chèn tệp tin đa phương tiện và khung nội tuyến vào trang web" },
      { ma: "B12", ten: "Bài 12: Tạo biểu mẫu" },
      { ma: "B13", ten: "Bài 13: Khái niệm, vai trò của CSS" },
      { ma: "B14", ten: "Bài 14: Định dạng văn bản bằng CSS" },
      { ma: "B15", ten: "Bài 15: Tạo màu cho chữ và nền" },
      { ma: "B16", ten: "Bài 16: Định dạng khung" },
      { ma: "B17", ten: "Bài 17: Các mức ưu tiên của bộ chọn" },
      { ma: "B18", ten: "Bài 18: Thực hành tổng hợp thiết kế trang web" }
    ]
  },
  {
    ma: "CD5",
    ten: "Chủ đề 5: Hướng nghiệp với tin học",
    baiHoc: [
      { ma: "B19", ten: "Bài 19: Dịch vụ sửa chữa và bảo trì máy tính" },
      { ma: "B20", ten: "Bài 20: Nhóm nghề quản trị thuộc ngành Công nghệ thông tin" },
      { ma: "B21", ten: "Bài 21: Hội thảo hướng nghiệp" }
    ]
  },
  {
    ma: "CD6",
    ten: "Chủ đề 6: Máy tính và xã hội tri thức",
    baiHoc: [
      { ma: "B22", ten: "Bài 22: Thực hành kết nối các thiết bị số" }
    ]
  },
  {
    ma: "CD7",
    ten: "Chủ đề 7: Ứng dụng tin học",
    baiHoc: [
      { ma: "B23", ten: "Bài 23: Chuẩn bị xây dựng trang web" },
      { ma: "B24", ten: "Bài 24: Xây dựng phần đầu trang web" },
      { ma: "B25", ten: "Bài 25: Xây dựng phần thân và chân trang web" },
      { ma: "B26", ten: "Bài 26: Liên kết và thanh điều hướng" },
      { ma: "B27", ten: "Bài 27: Biểu mẫu trên trang web" },
      { ma: "B28", ten: "Bài 28: Thực hành tổng hợp" }
    ]
  }
];

async function seed() {
  console.log("Đang tìm môn Tin học...");
  const { data: monList, error: monErr } = await supabase
    .from("mon")
    .select("mon_id, ten_mon")
    .ilike("ten_mon", "Tin học")
    .eq("trang_thai", "DangDung");

  if (monErr || !monList || monList.length === 0) {
    console.error("Không tìm thấy môn Tin học!", monErr);
    process.exit(1);
  }

  const monId = monList[0].mon_id;
  console.log(`Đã tìm thấy môn Tin học (ID: ${monId})`);

  for (const cd of chuyenDeList) {
    // Upsert chuyen_de
    let cdId = null;
    const { data: existingCd } = await supabase
      .from("chuyen_de")
      .select("chuyen_de_id")
      .eq("mon_id", monId)
      .or(`ma_chuyen_de.eq.${cd.ma},ten_chuyen_de.ilike.${cd.ten}`)
      .maybeSingle();

    if (existingCd) {
      cdId = existingCd.chuyen_de_id;
      await supabase
        .from("chuyen_de")
        .update({
          ma_chuyen_de: cd.ma,
          ten_chuyen_de: cd.ten,
          trang_thai: "DangDung"
        })
        .eq("chuyen_de_id", cdId);
      console.log(`Cập nhật Chuyên đề: ${cd.ma} - ${cd.ten}`);
    } else {
      const { data: newCd, error: cdInsErr } = await supabase
        .from("chuyen_de")
        .insert({
          mon_id: monId,
          ma_chuyen_de: cd.ma,
          ten_chuyen_de: cd.ten,
          trang_thai: "DangDung"
        })
        .select("chuyen_de_id")
        .single();

      if (cdInsErr) {
        console.error(`Lỗi tạo chuyên đề ${cd.ma}:`, cdInsErr.message);
        continue;
      }
      cdId = newCd.chuyen_de_id;
      console.log(`Tạo mới Chuyên đề: ${cd.ma} - ${cd.ten}`);
    }

    // Insert/update bai_hoc
    for (const bh of cd.baiHoc) {
      const { data: existingBh } = await supabase
        .from("bai_hoc")
        .select("bai_hoc_id")
        .eq("chuyen_de_id", cdId)
        .or(`ma_bai_hoc.ilike.${bh.ma},ten_bai_hoc.ilike.${bh.ten}`)
        .maybeSingle();

      if (existingBh) {
        await supabase
          .from("bai_hoc")
          .update({
            ma_bai_hoc: bh.ma,
            ten_bai_hoc: bh.ten,
            trang_thai: "DangDung"
          })
          .eq("bai_hoc_id", existingBh.bai_hoc_id);
        console.log(`  └─ Cập nhật Bài học: ${bh.ma} - ${bh.ten}`);
      } else {
        const { error: bhInsErr } = await supabase
          .from("bai_hoc")
          .insert({
            chuyen_de_id: cdId,
            ma_bai_hoc: bh.ma,
            ten_bai_hoc: bh.ten,
            trang_thai: "DangDung"
          });
        if (bhInsErr) {
          console.error(`  └─ Lỗi tạo bài học ${bh.ma}:`, bhInsErr.message);
        } else {
          console.log(`  └─ Tạo mới Bài học: ${bh.ma} - ${bh.ten}`);
        }
      }
    }
  }

  console.log("✅ Đã import thành công Khung chuyên đề & Bài học cho Môn Tin học!");
}

seed().catch(err => {
  console.error("Lỗi thực thi:", err);
  process.exit(1);
});
