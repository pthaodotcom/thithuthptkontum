import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyLichSu() {
  const { data: monList } = await supabase.from("mon").select("mon_id, ten_mon").ilike("ten_mon", "Lịch s%").eq("trang_thai", "DangDung");
  const monId = monList[0].mon_id;

  const { data: chuyenDes } = await supabase.from("chuyen_de").select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de").eq("mon_id", monId);
  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase.from("bai_hoc").select("bai_hoc_id").in("chuyen_de_id", cdIds);
  const bhIds = baiHocs.map(b => b.bai_hoc_id);

  const { count: totalQuestions } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds);

  console.log(`=== BÁO CÁO MÔN LỊCH SỬ ===`);
  console.log(`Số Chủ đề / Chuyên đề: ${chuyenDes.length}`);
  console.log(`Số Bài học: ${baiHocs.length}`);
  console.log(`Tổng số câu hỏi hiện tại: ${totalQuestions}`);
}

verifyLichSu();
