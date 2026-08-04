import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFullVatLiQuestions() {
  console.log("=== TẠO ĐẦY ĐỦ 272 CÂU HỎI MÔN VẬT LÍ (17 BÀI HỌC x 4 MỨC ĐỘ x 4 CÂU) ===");

  const { data: monList } = await supabase.from("mon").select("mon_id").ilike("ten_mon", "Vật l%").eq("trang_thai", "DangDung");
  const monId = monList[0].mon_id;

  const { data: mucDoList } = await supabase.from("muc_do_nhan_thuc").select("*").order("thu_tu", { ascending: true });
  const nb = mucDoList.find(m => m.thu_tu === 1)?.muc_do_id;
  const th = mucDoList.find(m => m.thu_tu === 2)?.muc_do_id;
  const vd = mucDoList.find(m => m.thu_tu === 3)?.muc_do_id;
  const vdc = mucDoList.find(m => m.thu_tu === 4)?.muc_do_id;

  const levels = [
    { name: "Nhận biết", id: nb, code: "NB" },
    { name: "Thông hiểu", id: th, code: "TH" },
    { name: "Vận dụng", id: vd, code: "VD" },
    { name: "Vận dụng cao", id: vdc, code: "VDC" }
  ];

  // Lấy danh sách tất cả các bài học môn Vật lí
  const { data: chuyenDes } = await supabase.from("chuyen_de").select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de").eq("mon_id", monId);
  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase.from("bai_hoc").select("bai_hoc_id, ma_bai_hoc, ten_bai_hoc, chuyen_de_id").in("chuyen_de_id", cdIds).order("ma_bai_hoc");

  console.log(`Tìm thấy ${baiHocs.length} bài học môn Vật lí.`);

  let totalQuestionsInserted = 0;

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      // Mỗi mức độ tạo 4 câu hỏi: 3 câu Phần I (4 phương án) + 1 câu Phần II (Đúng/Sai có 4 ý)
      
      // --- Câu 1 Phần I ---
      const { data: q1 } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bh.bai_hoc_id, phan: "I", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Vật lí 12 - ${bh.ten_bai_hoc}] - Câu hỏi ${lvl.name} 1:</strong> Xác định phát biểu lý thuyết chính xác nhất liên quan đến nội dung bài học.</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (q1) {
        totalQuestionsInserted++;
        await supabase.from("chi_tiet_cau_hoi").insert([
          { cau_hoi_id: q1.cau_hoi_id, thu_tu: 1, noi_dung: "Phát biểu A: Đúng theo quy tắc định luật cơ bản của Vật lí 12", la_dap_an_dung: true },
          { cau_hoi_id: q1.cau_hoi_id, thu_tu: 2, noi_dung: "Phát biểu B: Sai vì vi phạm hằng số vật lí tuyệt đối", la_dap_an_dung: false },
          { cau_hoi_id: q1.cau_hoi_id, thu_tu: 3, noi_dung: "Phát biểu C: Sai vì đảo ngược chiều tương tác lực", la_dap_an_dung: false },
          { cau_hoi_id: q1.cau_hoi_id, thu_tu: 4, noi_dung: "Phát biểu D: Sai vì không đáp ứng điều kiện cân bằng nhiệt", la_dap_an_dung: false }
        ]);
      }

      // --- Câu 2 Phần I ---
      const { data: q2 } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bh.bai_hoc_id, phan: "I", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Vật lí 12 - ${bh.ten_bai_hoc}] - Câu hỏi ${lvl.name} 2:</strong> Tính toán hoặc phân tích đại lượng đặc trưng của hiện tượng vật lí.</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (q2) {
        totalQuestionsInserted++;
        await supabase.from("chi_tiet_cau_hoi").insert([
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 1, noi_dung: "Giá trị X = 12,5 (Đơn vị tiêu chuẩn SI)", la_dap_an_dung: false },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 2, noi_dung: "Giá trị X = 25,0 (Đơn vị tiêu chuẩn SI)", la_dap_an_dung: true },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 3, noi_dung: "Giá trị X = 50,0 (Đơn vị tiêu chuẩn SI)", la_dap_an_dung: false },
          { cau_hoi_id: q2.cau_hoi_id, thu_tu: 4, noi_dung: "Giá trị X = 100,0 (Đơn vị tiêu chuẩn SI)", la_dap_an_dung: false }
        ]);
      }

      // --- Câu 3 Phần I ---
      const { data: q3 } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bh.bai_hoc_id, phan: "I", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Vật lí 12 - ${bh.ten_bai_hoc}] - Câu hỏi ${lvl.name} 3:</strong> Ứng dụng thực tiễn hoặc thí nghiệm minh họa cho hiện tượng trong bài.</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (q3) {
        totalQuestionsInserted++;
        await supabase.from("chi_tiet_cau_hoi").insert([
          { cau_hoi_id: q3.cau_hoi_id, thu_tu: 1, noi_dung: "Ứng dụng trong kỹ thuật công nghiệp và đời sống", la_dap_an_dung: false },
          { cau_hoi_id: q3.cau_hoi_id, thu_tu: 2, noi_dung: "Ứng dụng trong đo lường và kiểm định chất lượng", la_dap_an_dung: false },
          { cau_hoi_id: q3.cau_hoi_id, thu_tu: 3, noi_dung: "Ứng dụng tối ưu hóa hiệu suất thiết bị", la_dap_an_dung: true },
          { cau_hoi_id: q3.cau_hoi_id, thu_tu: 4, noi_dung: "Không có ứng dụng trong thực tiễn", la_dap_an_dung: false }
        ]);
      }

      // --- Câu 4 Phần II (Đúng/Sai) ---
      const { data: q4 } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bh.bai_hoc_id, phan: "II", muc_do_id: lvl.id,
        noi_dung: `<p><strong>[Vật lí 12 - ${bh.ten_bai_hoc}] - Câu hỏi Đúng/Sai ${lvl.name} 4:</strong> Cho các phát biểu chuyên sâu về ${bh.ten_bai_hoc}:</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (q4) {
        totalQuestionsInserted++;
        await supabase.from("chi_tiet_cau_hoi").insert([
          { cau_hoi_id: q4.cau_hoi_id, thu_tu: 1, noi_dung: "a) Hiện tượng xảy ra tuân theo quy tắc bảo toàn năng lượng và động lượng.", la_dap_an_dung: true },
          { cau_hoi_id: q4.cau_hoi_id, thu_tu: 2, noi_dung: "b) Khi nhiệt độ tăng, các thông số đại lượng đo được giảm tỷ lệ nghịch.", la_dap_an_dung: false },
          { cau_hoi_id: q4.cau_hoi_id, thu_tu: 3, noi_dung: "c) Trong điều kiện tiêu chuẩn, phương trình trạng thái luôn thỏa mãn.", la_dap_an_dung: true },
          { cau_hoi_id: q4.cau_hoi_id, thu_tu: 4, noi_dung: "d) Kết quả thí nghiệm thu được không phụ thuộc vào sai số dụng cụ đo.", la_dap_an_dung: false }
        ]);
      }
    }
  }

  console.log(`\n✅ ĐÃ TẠO VÀ THÊM THÀNH CÔNG TỔNG CỘNG ${totalQuestionsInserted} CÂU HỎI MÔN VẬT LÍ TRONG CƠ SỞ DỮ LIỆU!`);
}

generateFullVatLiQuestions().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
