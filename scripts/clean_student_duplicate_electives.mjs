import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)
const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)

async function cleanStudentElectives() {
  console.log("=== CHUẨN HÓA MÔN TỰ CHỌN HỌC SINH VÀ XÓA HẲN MÔN 'VẬT LÍ' (I NGẮN) ===");

  // Lấy ID môn Tin học hoặc Tiếng Anh để thay thế nếu bị đụng trùng 2 môn Vật lý
  const { data: monOther } = await supabase.from("mon").select("mon_id").ilike("ten_mon", "Tin %").limit(1);
  const fallbackId = monOther[0]?.mon_id;

  const { data: allUsers } = await supabase.from("tai_khoan").select("*");
  const affected = allUsers.filter(u => 
    u.mon_id === oldId || u.mon_tu_chon_1_id === oldId || u.mon_tu_chon_2_id === oldId
  );

  console.log(`Tìm thấy ${affected.length} tài khoản có chứa ID môn cũ.`);

  for (const u of affected) {
    let updateObj = {};

    let m1 = u.mon_tu_chon_1_id;
    let m2 = u.mon_tu_chon_2_id;

    if (m1 === oldId) m1 = newId;
    if (m2 === oldId) m2 = newId;

    // Nếu m1 và m2 bị trùng nhau sau khi đổi, thay m2 bằng fallbackId hoặc null
    if (m1 && m2 && m1 === m2) {
      m2 = fallbackId || null;
    }

    if (u.mon_id === oldId) updateObj.mon_id = newId;
    if (u.mon_tu_chon_1_id === oldId) updateObj.mon_tu_chon_1_id = m1;
    if (u.mon_tu_chon_2_id === oldId) updateObj.mon_tu_chon_2_id = m2;

    const { error } = await supabase.from("tai_khoan").update(updateObj).eq("tai_khoan_id", u.tai_khoan_id);
    if (error) {
      console.error(`Không thể cập nhật user ${u.ma_so}:`, error.message);
    } else {
      console.log(`✅ Đã cập nhật tài khoản ${u.ma_so}`);
    }
  }

  // Gỡ to_truong_tai_khoan_id ở bảng mon cũ
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("mon_id", oldId);

  // XÓA HẲN record oldId khỏi bảng mon
  const { data: deleted, error: deleteErr } = await supabase.from("mon").delete().eq("mon_id", oldId).select();

  if (deleteErr) {
    console.error("\n❌ LỖI KHI XÓA VĨNH VIỄN:", deleteErr);
  } else {
    console.log("\n🎉 ĐÃ XÓA VĨNH VIỄN BẢN GHI MÔN 'VẬT LÍ' (I NGẮN) THÀNH CÔNG!", deleted);
  }
}

cleanStudentElectives().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
