import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateLichSuQuestions() {
  console.log("=== BẮT ĐẦU TẠO NGÂN HÀNG CÂU HỎI MÔN LỊCH SỬ (4 CÂU / MỨC ĐỘ / BÀI HỌC) ===");

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
  console.log(`Tìm thấy ${baiHocs.length} bài học môn Lịch sử.`);

  let totalQuestionsInserted = 0;

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      // 3 câu Phần I (Trắc nghiệm 4 lựa chọn)
      for (let i = 1; i <= 3; i++) {
        const { data: q1 } = await supabase.from("cau_hoi").insert({
          bai_hoc_id: bh.bai_hoc_id, phan: "I", muc_do_id: lvl.id,
          noi_dung: `<p><strong>[Lịch sử 12 - ${bh.ten_bai_hoc}] - Câu hỏi ${lvl.name} (${i}):</strong> Xác định sự kiện lịch sử hoặc nhận định chính xác nhất liên quan đến bài học.</p>`,
          trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
        }).select("cau_hoi_id").single();

        if (q1) {
          totalQuestionsInserted++;
          await supabase.from("chi_tiet_cau_hoi").insert([
            { cau_hoi_id: q1.cau_hoi_id, thu_tu: 1, noi_dung: "Sự kiện A: Khẳng định đúng theo tiến trình lịch sử Việt Nam và thế giới", la_dap_an_dung: true },
            { cau_hoi_id: q1.cau_hoi_id, thu_tu: 2, noi_dung: "Sự kiện B: Khái niệm sai lệch về mốc thời gian lịch sử", la_dap_an_dung: false },
            { cau_hoi_id: q1.cau_hoi_id, thu_tu: 3, noi_dung: "Sự kiện C: Đánh giá sai ý nghĩa lịch sử của phong trào", la_dap_an_dung: false },
            { cau_hoi_id: q1.cau_hoi_id, thu_tu: 4, noi_dung: "Sự kiện D: Không liên quan đến nội dung bài học", la_dap_an_dung: false }
          ]);
        }
      }

      // 1 câu Phần II (Trắc nghiệm Đúng/Sai có 4 lệnh)
      const { data: q2 } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bh.bai_hoc_id, phan: "II", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Lịch sử 12 - ${bh.ten_bai_hoc}] - Câu hỏi Đúng/Sai ${lvl.name}:</strong> Cho tư liệu lịch sử và các phát biểu sau:</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (q2) {
        totalQuestionsInserted++;
        await supabase.from("chi_tiet_cau_hoi").insert([
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 1, noi_dung: "a) Tư liệu phản ánh đúng bối cảnh lịch sử diễn ra thời kỳ đó.", la_dap_an_dung: true },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 2, noi_dung: "b) Sự kiện này đánh dấu kết thúc hoàn toàn cuộc chiến tranh.", la_dap_an_dung: false },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 3, noi_dung: "c) Bài học kinh nghiệm thu được có giá trị thực tiễn sâu sắc.", la_dap_an_dung: true },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 4, noi_dung: "d) Lực lượng tham gia chỉ gồm giai cấp công nhân và nông dân.", la_dap_an_dung: false }
        ]);
      }
    }
  }

  console.log(`\n🎉 THÀNH CÔNG: Đã tạo và chèn ${totalQuestionsInserted} câu hỏi cho môn LỊCH SỬ!`);
}

generateLichSuQuestions().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
