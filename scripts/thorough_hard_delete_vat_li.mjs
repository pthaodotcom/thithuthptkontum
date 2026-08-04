import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function thoroughHardDelete() {
  const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)
  const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)

  console.log("=== BẮT ĐẦU DỌN SẠCH CÁC RÀNG BUỘC ĐỂ XÓA HẲN MÔN VẬT LÍ (I NGẮN) ===");

  // 1. Gỡ to_truong_tai_khoan_id khỏi môn cũ
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("mon_id", oldId);

  // 2. Cập nhật tai_khoan
  const { data: tk1 } = await supabase.from("tai_khoan").update({ mon_id: newId }).eq("mon_id", oldId).select();
  console.log(`Cập nhật tai_khoan.mon_id: ${tk1?.length || 0} bản ghi`);

  const { data: tk2 } = await supabase.from("tai_khoan").update({ mon_tu_chon_1_id: newId }).eq("mon_tu_chon_1_id", oldId).select();
  console.log(`Cập nhật tai_khoan.mon_tu_chon_1_id: ${tk2?.length || 0} bản ghi`);

  const { data: tk3 } = await supabase.from("tai_khoan").update({ mon_tu_chon_2_id: newId }).eq("mon_tu_chon_2_id", oldId).select();
  console.log(`Cập nhật tai_khoan.mon_tu_chon_2_id: ${tk3?.length || 0} bản ghi`);

  // 3. Cập nhật chuyen_de
  const { data: cd } = await supabase.from("chuyen_de").update({ mon_id: newId }).eq("mon_id", oldId).select();
  console.log(`Cập nhật chuyen_de.mon_id: ${cd?.length || 0} bản ghi`);

  // 4. Thử XÓA HẲN khỏi bảng mon
  const { data: delData, error: delErr } = await supabase.from("mon").delete().eq("mon_id", oldId).select();

  if (delErr) {
    console.error("❌ Xóa thất bại:", delErr);
  } else {
    console.log("🎉 ĐÃ XÓA HẲN RECORD 'VẬT LÍ' (I NGẮN) THÀNH CÔNG VỚI ID:", delData);
  }
}

thoroughHardDelete().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
