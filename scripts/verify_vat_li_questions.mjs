import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  const { data: monList } = await supabase.from("mon").select("mon_id, ten_mon").ilike("ten_mon", "Vật l%").eq("trang_thai", "DangDung");
  const monId = monList[0].mon_id;

  const { data: chuyenDes } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId);
  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase.from("bai_hoc").select("bai_hoc_id").in("chuyen_de_id", cdIds);
  const bhIds = baiHocs.map(b => b.bai_hoc_id);

  const { count: totalQuestions } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds);
  const { count: phan1Count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds).eq("phan", "I");
  const { count: phan2Count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds).eq("phan", "II");
  const { count: phan3Count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds).eq("phan", "III");

  console.log(`=== BÁO CÁO CÂU HỎI MÔN VẬT LÝ ===`);
  console.log(`Môn: ${monList[0].ten_mon} (ID: ${monId})`);
  console.log(`Số Chuyên đề / Chương: ${chuyenDes.length}`);
  console.log(`Số Bài học: ${baiHocs.length}`);
  console.log(`Tổng số câu hỏi: ${totalQuestions}`);
  console.log(` - Phần I (Trắc nghiệm 4 lựa chọn): ${phan1Count}`);
  console.log(` - Phần II (Trắc nghiệm Đúng/Sai): ${phan2Count}`);
  console.log(` - Phần III (Trắc nghiệm Trả lời ngắn): ${phan3Count}`);
}

verify();
