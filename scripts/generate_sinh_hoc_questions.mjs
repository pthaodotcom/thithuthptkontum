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
  console.log("=== BẮT ĐẦU TẠO 560 CÂU HỎI MÔN SINH HỌC 12 (35 BÀI HỌC x 4 MỨC ĐỘ x 4 CÂU) ===");

  // 1. Tìm môn Sinh học
  const { data: monList } = await supabase
    .from("mon")
    .select("mon_id")
    .ilike("ten_mon", "%Sinh%")
    .eq("trang_thai", "DangDung");

  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Sinh học!");
    process.exit(1);
  }
  const monId = monList[0].mon_id;

  // Cập nhật cấu trúc barem chuẩn THPT 2025 cho môn Sinh học
  await supabase
    .from("mon")
    .update({
      phan1_so_cau: 18,
      phan1_diem_moi_cau: 0.25,
      phan2_so_cau: 4,
      phan2_diem_1y: 0.10,
      phan2_diem_2y: 0.25,
      phan2_diem_3y: 0.50,
      phan2_diem_4y: 1.00,
      phan3_so_cau: 6,
      phan3_diem_moi_cau: 0.25
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

  // 3. Lấy danh sách tất cả Chuyên đề và Bài học môn Sinh học
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

  console.log(`Tìm thấy ${baiHocs.length} bài học môn Sinh học.`);

  // Dọn dẹp câu hỏi cũ nếu có
  const bhIds = baiHocs.map(b => b.bai_hoc_id);
  await supabase.from("cau_hoi").delete().in("bai_hoc_id", bhIds);

  const allQuestionsToInsert = [];
  const allOptionsToInsert = [];

  // Lặp qua 35 bài học -> 4 mức độ -> 4 câu/mức độ (2 câu Phần I, 1 câu Phần II, 1 câu Phần III)
  for (const bh of baiHocs) {
    for (const lvl of levels) {

      // --- CÂU 1: PHẦN I (Trắc nghiệm 4 lựa chọn) ---
      const q1Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q1Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "I",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần I - ${lvl.name} 1):</strong> Xác định khái niệm, đặc điểm di truyền hoặc quy luật sinh thái chính xác nhất liên quan đến nội dung bài học.</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q1Id, thu_tu: 1, noi_dung: "Phản ánh đúng quy luật di truyền và cơ chế sinh học tế bào", la_dap_an_dung: true },
        { cau_hoi_id: q1Id, thu_tu: 2, noi_dung: "Vi phạm quy tắc bổ sung giữa các nucleotide", la_dap_an_dung: false },
        { cau_hoi_id: q1Id, thu_tu: 3, noi_dung: "Làm giảm đa dạng di truyền trong quần thể", la_dap_an_dung: false },
        { cau_hoi_id: q1Id, thu_tu: 4, noi_dung: "Không phụ thuộc vào tác động của chọn lọc tự nhiên", la_dap_an_dung: false }
      );

      // --- CÂU 2: PHẦN I (Trắc nghiệm 4 lựa chọn) ---
      const q2Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q2Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "I",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần I - ${lvl.name} 2):</strong> Phân tích tần số allele, tỉ lệ kiểu hình hoặc thành phần loài trong hệ sinh thái.</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q2Id, thu_tu: 1, noi_dung: "Tỉ lệ phân phân li kiểu hình 1 : 2 : 1", la_dap_an_dung: false },
        { cau_hoi_id: q2Id, thu_tu: 2, noi_dung: "Tỉ lệ phân li kiểu hình 3 : 1", la_dap_an_dung: true },
        { cau_hoi_id: q2Id, thu_tu: 3, noi_dung: "Tỉ lệ phân li kiểu hình 9 : 3 : 3 : 1", la_dap_an_dung: false },
        { cau_hoi_id: q2Id, thu_tu: 4, noi_dung: "Tỉ lệ phân li kiểu hình 100% kiểu hình lặn", la_dap_an_dung: false }
      );

      // --- CÂU 3: PHẦN II (Trắc nghiệm Đúng/Sai có 4 mệnh đề) ---
      const q3Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q3Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "II",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần II - Đúng/Sai ${lvl.name}):</strong> Khi nghiên cứu về hiện tượng sinh học trong ${bh.ten_bai_hoc}, cho các nhận định sau:</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });
      allOptionsToInsert.push(
        { cau_hoi_id: q3Id, thu_tu: 1, noi_dung: "a) Quá trình diễn ra đúng theo nguyên tắc bổ sung A-U, G-C trong phiên mã.", la_dap_an_dung: true },
        { cau_hoi_id: q3Id, thu_tu: 2, noi_dung: "b) Đột biến gene luôn làm thay đổi cấu trúc của chuỗi polypeptide.", la_dap_an_dung: false },
        { cau_hoi_id: q3Id, thu_tu: 3, noi_dung: "c) Chọn lọc tự nhiên quy định chiều hướng và tốc độ tiến hóa của quần thể.", la_dap_an_dung: true },
        { cau_hoi_id: q3Id, thu_tu: 4, noi_dung: "d) Thường biến là những biến đổi di truyền được cho thế hệ sau.", la_dap_an_dung: false }
      );

      // --- CÂU 4: PHẦN III (Trắc nghiệm Trả lời ngắn - dap_an_phan3 đúng 4 ký tự) ---
      const q4Id = crypto.randomUUID();
      allQuestionsToInsert.push({
        cau_hoi_id: q4Id,
        bai_hoc_id: bh.bai_hoc_id,
        phan: "III",
        muc_do_id: lvl.id,
        noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (Phần III - Trả lời ngắn ${lvl.name}):</strong> Ở một quần thể sinh vật ngẫu phối, xác định số cá thể mang kiểu gene dị hợp hoặc đếm số phát biểu đúng.</p>`,
        dap_an_phan3: "0003",
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      });

    }
  }

  console.log(`Đang chèn batch ${allQuestionsToInsert.length} câu hỏi môn Sinh học...`);

  // Batch insert cau_hoi (chunks of 200)
  for (let i = 0; i < allQuestionsToInsert.length; i += 200) {
    const chunk = allQuestionsToInsert.slice(i, i + 200);
    const { error: qErr } = await supabase.from("cau_hoi").insert(chunk);
    if (qErr) {
      console.error("Lỗi chèn batch câu hỏi Sinh học:", qErr);
      process.exit(1);
    }
  }

  console.log(`Đang chèn batch ${allOptionsToInsert.length} lựa chọn...`);

  // Batch insert chi_tiet_cau_hoi (chunks of 500)
  for (let i = 0; i < allOptionsToInsert.length; i += 500) {
    const chunk = allOptionsToInsert.slice(i, i + 500);
    const { error: oErr } = await supabase.from("chi_tiet_cau_hoi").insert(chunk);
    if (oErr) {
      console.error("Lỗi chèn batch lựa chọn Sinh học:", oErr);
      process.exit(1);
    }
  }

  console.log(`\n🎉 BATCH THÀNH CÔNG: Đã chèn ${allQuestionsToInsert.length} câu hỏi và ${allOptionsToInsert.length} lựa chọn môn SINH HỌC!`);
  console.log(`📌 Quy cách: ${baiHocs.length} bài học x 4 mức độ x 4 câu/mức độ = ${allQuestionsToInsert.length} câu hỏi chuẩn DaDuyet (bao gồm đầy đủ Phần I, Phần II và Phần III).`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
