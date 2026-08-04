import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function forceDisableVatLi() {
  const keepId = "68d2100e-79e0-4b43-b7aa-595f6def8a5a"; // Vật lý (y dài)
  const removeId = "80ace72e-6743-4c13-a87b-6f9b34ea1f80"; // Vật lí (i ngắn)

  // Move all chuyen_de to keepId
  await supabase.from("chuyen_de").update({ mon_id: keepId }).eq("mon_id", removeId);
  await supabase.from("de_thi").update({ mon_id: keepId }).eq("mon_id", removeId);

  // Disable removeId
  await supabase.from("mon").update({ trang_thai: "VoHieuHoa", ten_mon: "Vật lí (Đã ẩn)" }).eq("mon_id", removeId);

  // Enable keepId
  await supabase.from("mon").update({ trang_thai: "DangDung", ten_mon: "Vật lý", ho_tro_ngan_hang_cau_hoi: true }).eq("mon_id", keepId);

  console.log("Đã cập nhật xong!");
}

forceDisableVatLi();
