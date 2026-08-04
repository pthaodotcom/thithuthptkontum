import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function keepVatLyYDai() {
  console.log("=== CHUYỂN TOÀN BỘ DỮ LIỆU SANG 'VẬT LÝ' (Y DÀI) VÀ XÓA/VÔ HIỆU HÓA 'VẬT LÍ' (I NGẮN) ===");

  const { data: monList } = await supabase.from("mon").select("*").ilike("ten_mon", "Vật l%");
  console.log("Danh sách môn hiện tại trong DB:", monList);

  const targetKeep = monList.find(m => m.ten_mon === "Vật lý");
  const targetRemove = monList.find(m => m.ten_mon === "Vật lí");

  if (!targetKeep) {
    console.error("Không tìm thấy môn 'Vật lý' (y dài) để giữ lại.");
    return;
  }

  console.log(`Môn GIỮ LẠI: ID = ${targetKeep.mon_id} ('${targetKeep.ten_mon}')`);

  if (targetRemove) {
    console.log(`Môn XÓA: ID = ${targetRemove.mon_id} ('${targetRemove.ten_mon}')`);

    // Chuyển toàn bộ chuyên đề sang môn "Vật lý" (y dài)
    const { data: movedCds } = await supabase
      .from("chuyen_de")
      .update({ mon_id: targetKeep.mon_id })
      .eq("mon_id", targetRemove.mon_id)
      .select("chuyen_de_id");
    console.log(`Đã chuyển ${movedCds?.length || 0} chuyên đề sang môn 'Vật lý'.`);

    // Chuyển toàn bộ đề thi sang môn "Vật lý" (nếu có)
    const { data: movedDeThi } = await supabase
      .from("de_thi")
      .update({ mon_id: targetKeep.mon_id })
      .eq("mon_id", targetRemove.mon_id)
      .select("de_thi_id");
    console.log(`Đã chuyển ${movedDeThi?.length || 0} đề thi sang môn 'Vật lý'.`);

    // Xóa record "Vật lí" (i ngắn)
    const { error: deleteErr } = await supabase.from("mon").delete().eq("mon_id", targetRemove.mon_id);
    if (deleteErr) {
      console.log("Không thể xóa trực tiếp record do ràng buộc FK, tiến hành đổi tên & vô hiệu hóa...");
      await supabase.from("mon").update({ trang_thai: "VoHieuHoa", ten_mon: "Vật lí (Đã xóa)" }).eq("mon_id", targetRemove.mon_id);
    } else {
      console.log("✅ Đã xóa thành công bản ghi môn 'Vật lí' (i ngắn) khỏi bảng `mon`!");
    }
  }

  // Đảm bảo môn "Vật lý" ở trạng thái DangDung và ho_tro_ngan_hang_cau_hoi = true
  await supabase.from("mon").update({ trang_thai: "DangDung", ho_tro_ngan_hang_cau_hoi: true }).eq("mon_id", targetKeep.mon_id);

  console.log("🎉 ĐÃ HOÀN TẤT CHUYỂN DỮ LIỆU SANG MÔN 'VẬT LÝ'!");
}

keepVatLyYDai().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
