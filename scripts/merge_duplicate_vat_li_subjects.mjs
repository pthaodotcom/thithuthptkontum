import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mergeDuplicateVatLi() {
  console.log("=== KIỂM TRA VÀ XỬ LÝ TRÙNG LẶP MÔN VẬT LÍ / VẬT LÝ ===");

  const { data: monList } = await supabase.from("mon").select("*").ilike("ten_mon", "Vật l%");
  console.log("Danh sách môn tìm thấy:", monList);

  if (!monList || monList.length <= 1) {
    console.log("Không có môn bị trùng lặp.");
    return;
  }

  // Xác định môn chuẩn (ưu tiên tên "Vật lí")
  const mainSubject = monList.find(m => m.ten_mon === "Vật lí") || monList[0];
  const duplicateSubjects = monList.filter(m => m.mon_id !== mainSubject.mon_id);

  console.log(`Môn chính được giữ lại: ID = ${mainSubject.mon_id} (${mainSubject.ten_mon})`);

  for (const dup of duplicateSubjects) {
    console.log(`Đang xử lý môn trùng: ID = ${dup.mon_id} (${dup.ten_mon})...`);

    // Chuyển tất cả chuyen_de sang môn chính
    const { data: updatedCds } = await supabase.from("chuyen_de").update({ mon_id: mainSubject.mon_id }).eq("mon_id", dup.mon_id).select("chuyen_de_id");
    console.log(`Đã chuyển ${updatedCds?.length || 0} chuyên đề sang môn chính.`);

    // Chuyển tất cả de_thi sang môn chính (nếu có)
    const { data: updatedDeThi } = await supabase.from("de_thi").update({ mon_id: mainSubject.mon_id }).eq("mon_id", dup.mon_id).select("de_thi_id");
    console.log(`Đã chuyển ${updatedDeThi?.length || 0} đề thi sang môn chính.`);

    // Đổi tên môn phụ hoặc vô hiệu hóa / xóa record trùng
    const { error: delErr } = await supabase.from("mon").delete().eq("mon_id", dup.mon_id);
    if (delErr) {
      console.log(`Không thể xóa record môn trùng (do có ràng buộc foreign key), chuyển trang_thai thành VoHieuHoa...`);
      await supabase.from("mon").update({ trang_thai: "VoHieuHoa", ten_mon: `Vật lý (Trùng - Đã tắt)` }).eq("mon_id", dup.mon_id);
    } else {
      console.log(`✅ Đã xóa thành công bản ghi môn trùng ID ${dup.mon_id}`);
    }
  }

  // Đảm bảo môn chính có tên chuẩn "Vật lí"
  await supabase.from("mon").update({ ten_mon: "Vật lí", trang_thai: "DangDung" }).eq("mon_id", mainSubject.mon_id);

  console.log("🎉 ĐÃ HOÀN TẤT XỬ LÝ TRÙNG MÔN VẬT LÍ!");
}

mergeDuplicateVatLi().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
