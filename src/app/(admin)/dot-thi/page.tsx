import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import DotThiClient from "./DotThiClient";
export const dynamic="force-dynamic";
export default async function DotThiPage(){
 const s=taoSupabaseServiceRole();
 // Đồng bộ trước khi đọc để các ca quá giờ không bị kẹt ở trạng thái Đang mở/Sắp diễn ra.
 await s.rpc("chuyen_trang_thai_ca_tu_dong");
 const[{data:l},{data:d}]=await Promise.all([s.from("lop").select("lop_id,ten_lop,khoi").order("ten_lop"),s.from("dot_thi").select("dot_thi_id,ten_dot_thi,nam_hoc,ngay_thi_1,ngay_thi_2,ca_thi(ca_thi_id,so_thu_tu_ca,trang_thai),dot_thi_lop(lop(lop_id,ten_lop))").order("ngay_thi_1",{ascending:false})]);
 return <DotThiClient cacLop={(l??[]) as any} cacDot={(d??[]) as any}/>;
}
