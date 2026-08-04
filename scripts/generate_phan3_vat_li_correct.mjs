import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generatePhan3Correct() {
  console.log("=== BẮT ĐẦU NẠP CÂU HỎI PHẦN III (TRẢ LỜI NGẮN) MÔN VẬT LÝ ===");

  const { data: monList } = await supabase.from("mon").select("mon_id").ilike("ten_mon", "Vật l%").eq("trang_thai", "DangDung");
  const monId = monList[0].mon_id;

  const { data: mucDoList } = await supabase.from("muc_do_nhan_thuc").select("*").order("thu_tu", { ascending: true });
  const nb = mucDoList.find(m => m.thu_tu === 1)?.muc_do_id;
  const th = mucDoList.find(m => m.thu_tu === 2)?.muc_do_id;
  const vd = mucDoList.find(m => m.thu_tu === 3)?.muc_do_id;
  const vdc = mucDoList.find(m => m.thu_tu === 4)?.muc_do_id;

  const levels = [
    { name: "Nhận biết", id: nb },
    { name: "Thông hiểu", id: th },
    { name: "Vận dụng", id: vd },
    { name: "Vận dụng cao", id: vdc }
  ];

  const { data: chuyenDes } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId);
  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase.from("bai_hoc").select("bai_hoc_id, ma_bai_hoc, ten_bai_hoc").in("chuyen_de_id", cdIds);
  console.log(`Tìm thấy ${baiHocs.length} bài học môn Vật lý.`);

  const cauHoiInserts = [];
  const sampleAnswers = ["12,5", "25,0", "0,25", "3,14", "100,-", "50,0", "0,05", "1,73", "2,26", "9,81"];

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      // Mỗi mức độ sinh 4 câu hỏi Phần III (Trả lời ngắn)
      for (let i = 1; i <= 4; i++) {
        const ans = sampleAnswers[(i + cauHoiInserts.length) % sampleAnswers.length];

        cauHoiInserts.push({
          bai_hoc_id: bh.bai_hoc_id,
          phan: "III",
          muc_do_id: lvl.id,
          noi_dung: `<p><strong>[Vật lý 12 - ${bh.ten_bai_hoc}] - Câu hỏi trả lời ngắn ${lvl.name} (${i}):</strong> Tính toán kết quả đại lượng vật lí theo yêu cầu của bài toán (điền kết quả gồm 4 ký tự).</p>`,
          dap_an_phan3: ans,
          trang_thai_duyet: "DaDuyet",
          trang_thai_su_dung: "ChuaDung"
        });
      }
    }
  }

  console.log(`Đang chèn ${cauHoiInserts.length} câu hỏi Phần III vào CSDL...`);
  const { data: inserted, error } = await supabase.from("cau_hoi").insert(cauHoiInserts).select("cau_hoi_id");

  if (error) {
    console.error("❌ Lỗi khi chèn:", error);
  } else {
    console.log(`🎉 NẠP THÀNH CÔNG ${inserted.length} CÂU HỎI PHẦN III MÔN VẬT LÝ TRONG DATABASE!`);
  }
}

generatePhan3Correct().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
