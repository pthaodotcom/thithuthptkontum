import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Record trùng lặp cần xóa hẳn
const keepId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Record duy nhất giữ lại

async function hardDelete() {
  console.log("=== BẮT ĐẦU XÓA HẲN RECORD VẬT LÍ TRÙNG LẶP ===");

  // 1. Đổi tên temporary để tránh vướng trigger tên môn
  await supabase.from("mon").update({ ten_mon: "Vật lí (tạm)" }).eq("mon_id", oldId);
  await supabase.from("mon").update({ ten_mon: "Vật lí" }).eq("mon_id", keepId);

  // Lấy ID môn thay thế nếu học sinh đã chọn cả 2 môn trùng
  const { data: monHoa } = await supabase.from("mon").select("mon_id").ilike("ten_mon", "Hóa%").limit(1);
  const fallbackId = monHoa[0]?.mon_id;

  // 2. Lấy danh sách tất cả tài khoản
  const { data: allUsers } = await supabase.from("tai_khoan").select("*");
  const affected = allUsers.filter(u => 
    u.mon_id === oldId || u.mon_tu_chon_1_id === oldId || u.mon_tu_chon_2_id === oldId
  );

  console.log(`Cần chuyển đổi dữ liệu cho ${affected.length} tài khoản...`);

  for (const u of affected) {
    let updateObj = {};

    let m1 = u.mon_tu_chon_1_id;
    let m2 = u.mon_tu_chon_2_id;

    if (m1 === oldId) m1 = keepId;
    if (m2 === oldId) m2 = keepId;

    if (m1 && m2 && m1 === m2) {
      m2 = fallbackId || null;
    }

    if (u.mon_id === oldId) updateObj.mon_id = keepId;
    if (u.mon_tu_chon_1_id === oldId) updateObj.mon_tu_chon_1_id = m1;
    if (u.mon_tu_chon_2_id === oldId) updateObj.mon_tu_chon_2_id = m2;

    const { error } = await supabase.from("tai_khoan").update(updateObj).eq("tai_khoan_id", u.tai_khoan_id);
    if (error) {
      console.error(`Lỗi cập nhật user ${u.ma_so}:`, error.message);
    }
  }

  // 3. Gỡ to_truong_tai_khoan_id ở record oldId
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("mon_id", oldId);

  // 4. Chuyển ca_thi_mon nếu có
  try {
    await supabase.from("ca_thi_mon").update({ mon_id: keepId }).eq("mon_id", oldId);
  } catch (e) {}

  // 5. XÓA VĨNH VIỄN record oldId khỏi bảng mon
  const { data: deleted, error: delErr } = await supabase
    .from("mon")
    .delete()
    .eq("mon_id", oldId)
    .select();

  if (delErr) {
    console.error("❌ Xóa thất bại:", delErr);
  } else {
    console.log("🎉 ĐÃ XÓA VĨNH VIỄN RECORD MÔN VẬT LÍ TRÙNG LẶP THÀNH CÔNG!", deleted);
  }

  // 6. Đổi tên record giữ lại thành 'Vật lý' (y dài) theo ý người dùng
  await supabase.from("mon").update({ ten_mon: "Vật lý" }).eq("mon_id", keepId);

  console.log("=== HOÀN TẤT ===");
}

hardDelete().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
