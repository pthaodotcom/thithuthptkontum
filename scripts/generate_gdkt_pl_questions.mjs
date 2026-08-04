import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import crypto from "crypto";

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

async function main() {
  console.log("=== BẮT ĐẦU TẠO 256 CÂU HỎI MÔN GIÁO DỤC KINH TẾ VÀ PHÁP LUẬT 12 (16 BÀI HỌC x 4 MỨC ĐỘ x 4 CÂU) ===");

  // 1. Tìm môn Giáo dục kinh tế và pháp luật
  const { data: monList } = await supabase
    .from("mon")
    .select("mon_id")
    .ilike("ten_mon", "%kinh tế%")
    .eq("trang_thai", "DangDung");

  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Giáo dục kinh tế và pháp luật!");
    process.exit(1);
  }
  const monId = monList[0].mon_id;

  // Cập nhật cấu trúc barem chuẩn THPT 2025 cho môn GDKT&PL
  await supabase
    .from("mon")
    .update({
      phan1_so_cau: 24,
      phan1_diem_moi_cau: 0.25,
      phan2_so_cau: 4,
      phan2_diem_1y: 0.10,
      phan2_diem_2y: 0.25,
      phan2_diem_3y: 0.50,
      phan2_diem_4y: 1.00,
      phan3_so_cau: null,
      phan3_diem_moi_cau: null
    })
    .eq("mon_id", monId);

  // 2. Lấy Mức độ nhận thức
  const { data: mucDoList } = await supabase
    .from("muc_do_nhan_thuc")
    .select("muc_do_id, thu_tu, ten_muc")
    .order("thu_tu", { ascending: true });

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

  // 3. Lấy danh sách tất cả Chuyên đề và Bài học môn GDKT&PL
  const { data: chuyenDes } = await supabase
    .from("chuyen_de")
    .select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de")
    .eq("mon_id", monId);

  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase
    .from("bai_hoc")
    .select("bai_hoc_id, ma_bai_hoc, ten_bai_hoc, chuyen_de_id")
    .in("chuyen_de_id", cdIds)
    .order("ma_bai_hoc");

  console.log(`Tìm thấy ${baiHocs.length} bài học môn GDKT&PL.`);

  // Dọn dẹp câu hỏi cũ nếu có
  const bhIds = baiHocs.map(b => b.bai_hoc_id);
  await supabase.from("cau_hoi").delete().in("bai_hoc_id", bhIds);

  const allQuestionsToInsert = [];
  const allOptionsToInsert = [];

  // Lặp qua 16 bài học -> 4 mức độ -> 4 câu/mức độ (3 câu Phần I, 1 câu Phần II)
  for (const bh of baiHocs) {
    for (const lvl of levels) {

      // --- CÂU 1: PHẦN I (Trắc nghiệm 4 lựa chọn) ---
      const q1Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q1Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "I",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần I - ${lvl.name} 1):</strong> Xác định quyền, nghĩa vụ công dân hoặc quy định pháp luật / kinh tế chính xác nhất liên quan đến bài học.</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q1Id, thu_tu: 1, noi_dung: "Thực hiện đúng quyền và nghĩa vụ công dân theo quy định của Pháp luật Việt Nam", la_dap_an_dung: true },
        { cau_hoi_id: q1Id, thu_tu: 2, noi_dung: "Xâm phạm quyền và lợi ích hợp pháp của cá nhân, tổ chức khác", la_dap_an_dung: false },
        { cau_hoi_id: q1Id, thu_tu: 3, noi_dung: "Tự ý thay đổi nội dung quy định kinh tế mà không qua cơ quan nhà nước", la_dap_an_dung: false },
        { cau_hoi_id: q1Id, thu_tu: 4, noi_dung: "Bỏ qua các nghĩa vụ bảo hiểm và an sinh xã hội đối với người lao động", la_dap_an_dung: false }
      );

      // --- CÂU 2: PHẦN I (Trắc nghiệm 4 lựa chọn) ---
      const q2Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q2Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "I",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần I - ${lvl.name} 2):</strong> Hành vi nào dưới đây thể hiện sự tuân thủ pháp luật và đạo đức kinh doanh chuẩn mực?</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q2Id, thu_tu: 1, noi_dung: "Khai báo gian lận doanh thu để trốn thuế doanh nghiệp", la_dap_an_dung: false },
        { cau_hoi_id: q2Id, thu_tu: 2, noi_dung: "Nộp thuế đầy đủ và đảm bảo trách nhiệm bảo vệ môi trường trong sản xuất", la_dap_an_dung: true },
        { cau_hoi_id: q2Id, thu_tu: 3, noi_dung: "Kinh doanh hàng giả, hàng nhái kém chất lượng để tối đa hóa lợi nhuận", la_dap_an_dung: false },
        { cau_hoi_id: q2Id, thu_tu: 4, noi_dung: "Cạnh tranh không lành mạnh và tung tin đồn thất thiệt về đối thủ", la_dap_an_dung: false }
      );

      // --- CÂU 3: PHẦN I (Trắc nghiệm 4 lựa chọn) ---
      const q3Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q3Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "I",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần I - ${lvl.name} 3):</strong> Phân tích vai trò của hội nhập kinh tế quốc tế và an sinh xã hội đối với sự phát triển đất nước.</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q3Id, thu_tu: 1, noi_dung: "Tạo điều kiện thu hút vốn đầu tư và nâng cao đời sống nhân dân", la_dap_an_dung: true },
        { cau_hoi_id: q3Id, thu_tu: 2, noi_dung: "Bế quan tỏa cảng và hạn chế giao thương với các đối tác nước ngoài", la_dap_an_dung: false },
        { cau_hoi_id: q3Id, thu_tu: 3, noi_dung: "Triệt tiêu hoàn toàn sự cạnh tranh trên thị trường nội địa", la_dap_an_dung: false },
        { cau_hoi_id: q3Id, thu_tu: 4, noi_dung: "Gia tăng áp lực lạm phát và suy thoái kinh tế diện rộng", la_dap_an_dung: false }
      );

      // --- CÂU 4: PHẦN II (Trắc nghiệm Đúng/Sai có 4 mệnh đề) ---
      const q4Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q4Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "II",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần II - Đúng/Sai ${lvl.name}):</strong> Cho tình huống thực tế về thực hiện pháp luật và quản lí kinh tế liên quan đến ${bh.ten_bai_hoc}. Cho các phát biểu sau:</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q4Id, thu_tu: 1, noi_dung: "a) Chủ doanh nghiệp có trách nhiệm đăng ký kinh doanh và đóng bảo hiểm đầy đủ cho lao động.", la_dap_an_dung: true },
        { cau_hoi_id: q4Id, thu_tu: 2, noi_dung: "b) Người tiêu dùng không có quyền khiếu nại khi mua phải hàng kém chất lượng.", la_dap_an_dung: false },
        { cau_hoi_id: q4Id, thu_tu: 3, noi_dung: "c) Tăng cường kiểm tra, xử lý vi phạm giúp đảm bảo tính thượng tôn pháp luật.", la_dap_an_dung: true },
        { cau_hoi_id: q4Id, thu_tu: 4, noi_dung: "d) Công dân có thể tự ý đơn phương hủy bỏ hợp đồng lao động mà không cần báo trước.", la_dap_an_dung: false }
      );

    }
  }

  console.log(`Đang chèn batch ${allQuestionsToInsert.length} câu hỏi môn GDKT&PL...`);

  // Batch insert cau_hoi (chunks of 200)
  for (let i = 0; i < allQuestionsToInsert.length; i += 200) {
    const chunk = allQuestionsToInsert.slice(i, i + 200);
    const { error: qErr } = await supabase.from("cau_hoi").insert(chunk);
    if (qErr) {
      console.error("Lỗi chèn batch câu hỏi GDKT&PL:", qErr);
      process.exit(1);
    }
  }

  console.log(`Đang chèn batch ${allOptionsToInsert.length} lựa chọn...`);

  // Batch insert chi_tiet_cau_hoi (chunks of 500)
  for (let i = 0; i < allOptionsToInsert.length; i += 500) {
    const chunk = allOptionsToInsert.slice(i, i + 500);
    const { error: oErr } = await supabase.from("chi_tiet_cau_hoi").insert(chunk);
    if (oErr) {
      console.error("Lỗi chèn batch lựa chọn GDKT&PL:", oErr);
      process.exit(1);
    }
  }

  console.log(`\n🎉 BATCH THÀNH CÔNG: Đã chèn ${allQuestionsToInsert.length} câu hỏi và ${allOptionsToInsert.length} lựa chọn môn GIÁO DỤC KINH TẾ VÀ PHÁP LUẬT!`);
  console.log(`📌 Quy cách: ${baiHocs.length} bài học x 4 mức độ x 4 câu/mức độ = ${allQuestionsToInsert.length} câu hỏi chuẩn DaDuyet (bao gồm Phần I và Phần II).`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
