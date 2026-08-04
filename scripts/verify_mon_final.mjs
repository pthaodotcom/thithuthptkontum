import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyFinal() {
  const { data: monList } = await supabase.from("mon").select("mon_id, ten_mon, trang_thai").ilike("ten_mon", "Vật l%");
  console.log("Danh sách môn Vật lí / Vật lý còn lại trong CSDL:", monList);
}

verifyFinal();
