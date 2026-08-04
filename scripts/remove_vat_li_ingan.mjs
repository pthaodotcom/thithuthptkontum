import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function removeVatLiINGAN() {
  const keepId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)
  const removeId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)

  // 1. Chuyển toàn bộ chuyên đề thuộc removeId sang keepId
  const { data: updatedCds, error: cdErr } = await supabase
    .from("chuyen_de")
    .update({ mon_id: keepId })
    .eq("mon_id", removeId)
    .select();
  console.log("Cập nhật Chuyên đề:", { updatedCdsCount: updatedCds?.length, cdErr });

  // 2. Chuyển toàn bộ đề thi thuộc removeId sang keepId
  const { data: updatedDeThi, error: dtErr } = await supabase
    .from("de_thi")
    .update({ mon_id: keepId })
    .eq("mon_id", removeId)
    .select();
  console.log("Cập nhật Đề thi:", { updatedDeThiCount: updatedDeThi?.length, dtErr });

  // 3. Đổi tên và chuyển trạng thái của môn "Vật lí" (i ngắn) sang NgungDung
  const { data: updatedMon, error: monErr } = await supabase
    .from("mon")
    .update({ trang_thai: "NgungDung", ten_mon: "Vật lí (Đã ngưng)" })
    .eq("mon_id", removeId)
    .select();
  console.log("Cập nhật trạng thái môn Vật lí (i ngắn):", { updatedMon, monErr });

  // 4. Đảm bảo môn "Vật lý" (y dài) có tên chuẩn 'Vật lý', trang_thai 'DangDung'
  const { data: keepMon, error: keepErr } = await supabase
    .from("mon")
    .update({ ten_mon: "Vật lý", trang_thai: "DangDung", ho_tro_ngan_hang_cau_hoi: true })
    .eq("mon_id", keepId)
    .select();
  console.log("Đảm bảo môn Vật lý (y dài) hoạt động:", { keepMon, keepErr });

  console.log("\n🎉 XỬ LÝ HOÀN TẤT!");
}

removeVatLiINGAN().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
