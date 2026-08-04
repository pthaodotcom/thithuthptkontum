import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80";

async function inspectRows() {
  const { data: allUsers } = await supabase.from("tai_khoan").select("*");
  const affectedUsers = allUsers.filter(u => 
    u.mon_id === oldId || u.mon_tu_chon_1_id === oldId || u.mon_tu_chon_2_id === oldId
  );

  console.log("Số lượng tài khoản bị ảnh hưởng:", affectedUsers.length);
  console.log(JSON.stringify(affectedUsers, null, 2));
}

inspectRows();
