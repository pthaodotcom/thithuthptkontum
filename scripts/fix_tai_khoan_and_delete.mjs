import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80";
const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a";

async function fix() {
  console.log("=== FIX CÁC THAM CHIẾU BẢNG TÀI KHOẢN VÀ XÓA HẲN MÔN VẬT LÍ (I NGẮN) ===");

  // 1. Cập nhật mon_id
  const { data: u1, error: e1 } = await supabase
    .from("tai_khoan")
    .update({ mon_id: newId })
    .eq("mon_id", oldId)
    .select("tai_khoan_id");
  console.log("Update mon_id:", u1?.length, e1);

  // 2. Cập nhật mon_tu_chon_1_id
  const { data: u2, error: e2 } = await supabase
    .from("tai_khoan")
    .update({ mon_tu_chon_1_id: newId })
    .eq("mon_tu_chon_1_id", oldId)
    .select("tai_khoan_id");
  console.log("Update mon_tu_chon_1_id:", u2?.length, e2);

  // 3. Cập nhật mon_tu_chon_2_id
  const { data: u3, error: e3 } = await supabase
    .from("tai_khoan")
    .update({ mon_tu_chon_2_id: newId })
    .eq("mon_tu_chon_2_id", oldId)
    .select("tai_khoan_id");
  console.log("Update mon_tu_chon_2_id:", u3?.length, e3);

  // 4. Xóa vĩnh viễn
  const { data: del, error: delErr } = await supabase
    .from("mon")
    .delete()
    .eq("mon_id", oldId)
    .select();

  if (delErr) {
    console.error("❌ XÓA VẪN THẤT BẠI:", delErr);
  } else {
    console.log("🎉 ĐÃ XÓA VĨNH VIỄN BẢN GHI MÔN 'VẬT LÍ' (I NGẮN) THÀNH CÔNG!", del);
  }
}

fix();
