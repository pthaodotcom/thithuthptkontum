import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function batchGeneratePhan3() {
  console.log("=== BẮT ĐẦU NẠP BATCH CÂU HỎI PHẦN III (TRẢ LỜI NGẮN) ===");

  // Kill/kill previous slow task if needed
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

  const cauHoiInserts = [];
  const questionDetailsMap = [];

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      for (let i = 1; i <= 4; i++) {
        const val = (i * 3.2 + Math.floor(Math.random() * 15)).toFixed(1).replace(".", ",");
        cauHoiInserts.push({
          bai_hoc_id: bh.bai_hoc_id,
          phan: "III",
          muc_do_id: lvl.id,
          noi_dung: `<p><strong>[Vật lý 12 - ${bh.ten_bai_hoc}] - Câu hỏi trả lời ngắn ${lvl.name} (${i}):</strong> Tính toán kết quả đại lượng vật lí theo yêu cầu của bài toán (làm tròn đến 1 chữ số thập phân).</p>`,
          trang_thai_duyet: "DaDuyet",
          trang_thai_su_dung: "ChuaDung"
        });
        questionDetailsMap.push(val);
      }
    }
  }

  console.log(`Đang chèn batch ${cauHoiInserts.length} câu hỏi Phần III...`);
  const { data: insertedQuestions, error: qErr } = await supabase.from("cau_hoi").insert(cauHoiInserts).select("cau_hoi_id");

  if (qErr) {
    console.error("Lỗi khi chèn câu hỏi:", qErr);
    return;
  }

  console.log(`Đã chèn ${insertedQuestions.length} câu hỏi. Tiến hành chèn đáp án chi tiết...`);
  const detailsInserts = insertedQuestions.map((q, idx) => ({
    cau_hoi_id: q.cau_hoi_id,
    thu_tu: 1,
    noi_dung: questionDetailsMap[idx],
    la_dap_an_dung: true
  }));

  const { error: dErr } = await supabase.from("chi_tiet_cau_hoi").insert(detailsInserts);
  if (dErr) {
    console.error("Lỗi khi chèn đáp án chi tiết:", dErr);
  } else {
    console.log("🎉 NẠP BATCH THÀNH CÔNG TỔNG CỘNG CÁC CÂU HỎI PHẦN III MÔN VẬT LÝ!");
  }
}

batchGeneratePhan3().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
