import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)
const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)

async function execute() {
  console.log("=== CHUYỂN TOÀN BỘ TÀI KHOẢN HỌC SINH SANG 'VẬT LÝ' (Y DÀI) VÀ XÓA HẲN MÔN 'VẬT LÍ' (I NGẮN) ===");

  // 1. Gỡ to_truong_tai_khoan_id nếu có
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("mon_id", oldId);

  // 2. Lấy tất cả tài khoản liên quan
  const { data: allUsers } = await supabase.from("tai_khoan").select("*");
  const affectedUsers = allUsers.filter(u => 
    u.mon_id === oldId || u.mon_tu_chon_1_id === oldId || u.mon_tu_chon_2_id === oldId
  );

  console.log(`Tìm thấy ${affectedUsers.length} tài khoản cần cập nhật...`);

  for (const u of affectedUsers) {
    const updateObj = {};
    if (u.mon_id === oldId) updateObj.mon_id = newId;
    if (u.mon_tu_chon_1_id === oldId) updateObj.mon_tu_chon_1_id = newId;
    if (u.mon_tu_chon_2_id === oldId) updateObj.mon_tu_chon_2_id = newId;

    const { error: uErr } = await supabase
      .from("tai_khoan")
      .update(updateObj)
      .eq("tai_khoan_id", u.tai_khoan_id);

    if (uErr) {
      console.error(`Lỗi khi cập nhật tài khoản ${u.ma_so}:`, uErr.message);
    } else {
      console.log(`✅ Đã chuyển môn cho tài khoản ${u.ma_so} thành công.`);
    }
  }

  // 3. Chuyển bất kỳ chuyên đề nào thuộc oldId
  await supabase.from("chuyen_de").update({ mon_id: newId }).eq("mon_id", oldId);

  // 4. Chuyển bất kỳ ca thi nào thuộc oldId
  try {
    await supabase.from("ca_thi_mon").update({ mon_id: newId }).eq("mon_id", oldId);
  } catch (e) {}

  // 5. Thử XÓA HẲN record môn oldId khỏi bảng `mon`
  const { data: deleted, error: delErr } = await supabase
    .from("mon")
    .delete()
    .eq("mon_id", oldId)
    .select();

  if (delErr) {
    console.error("\n❌ KHÔNG THỂ XÓA HẲN:", delErr);
  } else {
    console.log("\n🎉 ĐÃ XÓA HẲN HOÀN TOÀN RECORD 'VẬT LÍ' (I NGẮN) KHỎI DATABASE THÀNH CÔNG!", deleted);
  }
}

execute().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
