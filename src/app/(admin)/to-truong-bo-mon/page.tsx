import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import ToTruongClient from "./ToTruongClient";
export const dynamic="force-dynamic";
export default async function ToTruongBoMonPage(){
 const s=taoSupabaseServiceRole();const[{data:mon},{data:giaoVien}]=await Promise.all([
  s.from("mon").select("mon_id,ten_mon,to_truong_tai_khoan_id").eq("trang_thai","DangDung").order("ten_mon"),
  s.from("tai_khoan").select("tai_khoan_id,ho_ten,ma_so,mon_id").eq("vai_tro","GiaoVien").eq("trang_thai","HoatDong").order("ho_ten"),
 ]);
 return <ToTruongClient mon={(mon??[]) as any} giaoVien={(giaoVien??[]) as any}/>;
}
