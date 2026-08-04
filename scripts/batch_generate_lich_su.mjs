import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function batchLichSu() {
  console.log("=== NẠP BATCH CÂU HỎI MÔN LỊCH SỬ ===");

  const { data: monList } = await supabase.from("mon").select("mon_id").ilike("ten_mon", "Lịch s%").eq("trang_thai", "DangDung");
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

  const qInserts = [];
  const detailsMap = [];

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      // 3 câu Phần I
      for (let i = 1; i <= 3; i++) {
        qInserts.push({
          bai_hoc_id: bh.bai_hoc_id, phan: "I", muc_do_id: lvl.id,
          noi_dung: `<p><strong>[Lịch sử 12 - ${bh.ten_bai_hoc}] - Câu hỏi ${lvl.name} (${i}):</strong> Xác định sự kiện lịch sử chính xác nhất.</p>`,
          trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
        });
        detailsMap.push({
          type: "I",
          items: [
            { thu_tu: 1, noi_dung: "Nhận định đúng theo tiến trình lịch sử", la_dap_an_dung: true },
            { thu_tu: 2, noi_dung: "Nhận định sai mốc thời gian", la_dap_an_dung: false },
            { thu_tu: 3, noi_dung: "Đánh giá không chính xác bản chất sự kiện", la_dap_an_dung: false },
            { thu_tu: 4, noi_dung: "Không thuộc nội dung chương trình", la_dap_an_dung: false }
          ]
        });
      }

      // 1 câu Phần II (Đúng / Sai)
      qInserts.push({
        bai_hoc_id: bh.bai_hoc_id, phan: "II", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Lịch sử 12 - ${bh.ten_bai_hoc}] - Câu hỏi Đúng/Sai ${lvl.name}:</strong> Phân tích các phát biểu lịch sử sau:</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      });
      detailsMap.push({
        type: "II",
        items: [
          { thu_tu: 1, noi_dung: "a) Sự kiện phản ánh đúng bối cảnh lịch sử.", la_dap_an_dung: true },
          { thu_tu: 2, noi_dung: "b) Diễn biến kết thúc hoàn toàn trong năm đầu.", la_dap_an_dung: false },
          { thu_tu: 3, noi_dung: "c) Bài học kinh nghiệm có giá trị lâu dài.", la_dap_an_dung: true },
          { thu_tu: 4, noi_dung: "d) Lực lượng tham gia chỉ gồm quy mô nhỏ.", la_dap_an_dung: false }
        ]
      });
    }
  }

  console.log(`Chèn batch ${qInserts.length} câu hỏi Lịch sử...`);
  const { data: insertedQuestions, error: qErr } = await supabase.from("cau_hoi").insert(qInserts).select("cau_hoi_id");

  if (qErr) {
    console.error("Lỗi khi chèn câu hỏi:", qErr);
    return;
  }

  const allDetails = [];
  insertedQuestions.forEach((q, idx) => {
    const dObj = detailsMap[idx];
    dObj.items.forEach(it => {
      allDetails.push({
        cau_hoi_id: q.cau_hoi_id,
        thu_tu: it.thu_tu,
        noi_dung: it.noi_dung,
        la_dap_an_dung: it.la_dap_an_dung
      });
    });
  });

  const { error: dErr } = await supabase.from("chi_tiet_cau_hoi").insert(allDetails);
  if (dErr) {
    console.error("Lỗi chèn chi tiết:", dErr);
  } else {
    console.log(`🎉 NẠP THÀNH CÔNG ${insertedQuestions.length} CÂU HỎI VÀ ${allDetails.length} CHI TIẾT ĐÁP ÁN MÔN LỊCH SỬ!`);
  }
}

batchLichSu().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
