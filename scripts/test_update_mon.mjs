import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  const { data, error } = await supabase
    .from("mon")
    .update({ trang_thai: "VoHieuHoa" })
    .eq("mon_id", "80ace72e-6743-4c13-a87b-6f9b34ea1f80")
    .select();
  
  console.log("Update Result:", { data, error });
}

testUpdate();
