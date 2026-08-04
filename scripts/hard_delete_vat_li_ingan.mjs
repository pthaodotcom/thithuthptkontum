import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function hardDeleteVatLi() {
  const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)
  const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)

  console.log(`=== BẮT ĐẦU XÓA VĨNH VIỄN MÔN 'VẬT LÍ' (ID: ${oldId}) ===`);

  // 1. Kiểm tra tai_khoan (mon_id, mon_tu_chon_1_id, mon_tu_chon_2_id)
  const { data: tkMon } = await supabase.from("tai_khoan").update({ mon_id: newId }).eq("mon_id", oldId).select("tai_khoan_id");
  console.log(`Chuyển ${tkMon?.length || 0} tài khoản (mon_id) sang môn mới.`);

  const { data: tkTc1 } = await supabase.from("tai_khoan").update({ mon_tu_chon_1_id: newId }).eq("mon_tu_chon_1_id", oldId).select("tai_khoan_id");
  console.log(`Chuyển ${tkTc1?.length || 0} tài khoản (mon_tu_chon_1_id) sang môn mới.`);

  const { data: tkTc2 } = await supabase.from("tai_khoan").update({ mon_tu_chon_2_id: newId }).eq("mon_tu_chon_2_id", oldId).select("tai_khoan_id");
  console.log(`Chuyển ${tkTc2?.length || 0} tài khoản (mon_tu_chon_2_id) sang môn mới.`);

  // 2. Kiểm tra chuyen_de (mon_id)
  const { data: cds } = await supabase.from("chuyen_de").update({ mon_id: newId }).eq("mon_id", oldId).select("chuyen_de_id");
  console.log(`Chuyển ${cds?.length || 0} chuyên đề sang môn mới.`);

  // 3. Kiểm tra các bảng đăng ký môn học sinh (nếu có)
  try {
    await supabase.from("dang_ky_mon_hoc_sinh").update({ mon_id: newId }).eq("mon_id", oldId);
  } catch (e) {}

  try {
    await supabase.from("dot_thi_mon").update({ mon_id: newId }).eq("mon_id", oldId);
  } catch (e) {}

  // 4. Thực hiện XÓA HẲN (DELETE) record môn oldId khỏi bảng `mon`
  const { error: deleteErr } = await supabase.from("mon").delete().eq("mon_id", oldId);

  if (deleteErr) {
    console.error("❌ Lỗi khi xóa vĩnh viễn:", deleteErr);
  } else {
    console.log("🎉 XÓA VĨNH VIỄN THÀNH CÔNG! Môn 'Vật lí' (i ngắn) đã hoàn toàn biến mất khỏi database.");
  }
}

hardDeleteVatLi().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
