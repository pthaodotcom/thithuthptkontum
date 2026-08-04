import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const oldId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80";
const newId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a";

const tableCols = [
  { table: "tai_khoan", cols: ["mon_id", "mon_tu_chon_1_id", "mon_tu_chon_2_id"] },
  { table: "chuyen_de", cols: ["mon_id"] },
  { table: "de_thi", cols: ["mon_id"] },
  { table: "de_thi_goc", cols: ["mon_id"] },
  { table: "ca_thi_mon", cols: ["mon_id"] },
  { table: "dot_thi_ca_mon", cols: ["mon_id"] },
  { table: "lich_su_thay_doi_mon_tu_chon", cols: ["mon_id_cu", "mon_id_moi"] },
  { table: "phan_cong_soan_de", cols: ["mon_id"] },
  { table: "thong_bao", cols: ["mon_id"] },
  { table: "audit_log", cols: ["mon_id"] }
];

async function sweep() {
  console.log("=== THỰC HIỆN QUÉT VÀ DỌN SẠCH THAM CHUYẾN ĐỂ XÓA MÔN OLD_ID ===");

  // Set to_truong_tai_khoan_id = null ở bảng mon
  await supabase.from("mon").update({ to_truong_tai_khoan_id: null }).eq("mon_id", oldId);

  for (const tc of tableCols) {
    for (const col of tc.cols) {
      try {
        const { data, error } = await supabase
          .from(tc.table)
          .update({ [col]: newId })
          .eq(col, oldId)
          .select();
        
        if (data && data.length > 0) {
          console.log(`Đã cập nhật ${tc.table}.${col}: ${data.length} dòng.`);
        }
      } catch (err) {
        // Table or col might not exist, ignore
      }
    }
  }

  // Bây giờ xóa cứng từ bảng mon
  const { data: deleted, error: deleteError } = await supabase
    .from("mon")
    .delete()
    .eq("mon_id", oldId)
    .select();

  if (deleteError) {
    console.error("❌ XÓA THẤT BẠI:", deleteError);
  } else {
    console.log("🎉 XÓA VĨNH VIỄN THÀNH CÔNG RECORD MÔN 'VẬT LÍ' (I NGẮN)!", deleted);
  }
}

sweep();
