import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkLichSu() {
  const { data: monList } = await supabase.from("mon").select("*").ilike("ten_mon", "Lịch s%");
  console.log("Môn Lịch sử trong DB:", monList);

  if (monList && monList.length > 0) {
    const monId = monList[0].mon_id;
    const { data: cds } = await supabase.from("chuyen_de").select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de, bai_hoc(bai_hoc_id, ma_bai_hoc, ten_bai_hoc)").eq("mon_id", monId);
    console.log(`Số Chuyên đề hiện có của Lịch sử: ${cds.length}`);
    console.log(JSON.stringify(cds, null, 2));
  }
}

checkLichSu();
