import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: mon } = await supabase.from("mon").select("mon_id, ten_mon").ilike("ten_mon", "Tin học").single();
  const { data: bh } = await supabase.from("chuyen_de").select("chuyen_de_id, bai_hoc(bai_hoc_id)").eq("mon_id", mon.mon_id);
  const bhIds = bh.flatMap(c => c.bai_hoc.map(b => b.bai_hoc_id));

  const { count: p1Count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds).eq("phan", "I");
  const { count: p2Count } = await supabase.from("cau_hoi").select("*", { count: "exact", head: true }).in("bai_hoc_id", bhIds).eq("phan", "II");

  console.log(`=== BÁO CÁO CÂU HỎI MÔN TIN HỌC ===`);
  console.log(`- Phần I (4 lựa chọn): ${p1Count} câu`);
  console.log(`- Phần II (Đúng / Sai): ${p2Count} câu`);
  console.log(`- Tổng số câu trong ngân hàng: ${p1Count + p2Count} câu`);
}

check();
