import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugTaiKhoan() {
  const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80";

  const { data: m1 } = await supabase.from("tai_khoan").select("tai_khoan_id, ho_ten, ten_dang_nhap, mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id").eq("mon_id", oldId);
  const { data: m2 } = await supabase.from("tai_khoan").select("tai_khoan_id, ho_ten, ten_dang_nhap, mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id").eq("mon_tu_chon_1_id", oldId);
  const { data: m3 } = await supabase.from("tai_khoan").select("tai_khoan_id, ho_ten, ten_dang_nhap, mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id").eq("mon_tu_chon_2_id", oldId);

  console.log("mon_id = oldId:", m1);
  console.log("mon_tu_chon_1_id = oldId:", m2);
  console.log("mon_tu_chon_2_id = oldId:", m3);
}

debugTaiKhoan();
