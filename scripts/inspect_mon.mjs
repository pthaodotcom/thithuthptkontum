import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectMon() {
  const { data, error } = await supabase.from("mon").select("*").ilike("ten_mon", "Vật l%");
  console.log("Error:", error);
  console.log("Data:", data);
}

inspectMon();
