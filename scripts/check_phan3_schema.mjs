import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPhan3() {
  const { data: qList } = await supabase.from("cau_hoi").select("cau_hoi_id, phan, noi_dung, bai_hoc_id").eq("phan", "III").limit(3);
  console.log("Mẫu câu hỏi Phần III trong DB:", qList);

  if (qList && qList.length > 0) {
    const { data: details } = await supabase.from("chi_tiet_cau_hoi").select("*").eq("cau_hoi_id", qList[0].cau_hoi_id);
    console.log("Chi tiết câu hỏi Phần III:", details);
  }
}

checkPhan3();
