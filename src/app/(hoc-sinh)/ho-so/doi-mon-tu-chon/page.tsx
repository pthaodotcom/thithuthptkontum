import {redirect} from "next/navigation";
import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import DoiMonClient from "./DoiMonClient";
export const dynamic="force-dynamic";

export default async function DoiMonTuChonPage(){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="HocSinh")redirect("/dang-nhap");
 const s=taoSupabaseServiceRole();
 const[{data:hs},{data:mon}]=await Promise.all([
  s.from("tai_khoan").select("lop_id,mon_tu_chon_1_id,mon_tu_chon_2_id").eq("tai_khoan_id",u.sub).single(),
  s.from("mon").select("mon_id,ten_mon").eq("loai_mon","TuChon").eq("trang_thai","DangDung").order("ten_mon"),
 ]);
 const{data:phamVi}=hs?.lop_id?await s.from("dot_thi_lop").select("dot_thi_id,dot_thi!inner(ten_dot_thi,ca_thi!inner(so_thu_tu_ca,gio_bat_dau))").eq("lop_id",hs.lop_id):{data:[]};
 const{data:logs}=await s.from("log_doi_mon_tu_chon").select("dot_thi_id,vi_tri").eq("hoc_sinh_tai_khoan_id",u.sub);
 const dots=(phamVi??[]).map((x:any)=>{
  const d=Array.isArray(x.dot_thi)?x.dot_thi[0]:x.dot_thi;
  const ca=(d?.ca_thi??[]).find((c:any)=>c.so_thu_tu_ca===3);
  const gioBatDau=new Date(ca?.gio_bat_dau);
  if(!ca?.gio_bat_dau||Number.isNaN(gioBatDau.getTime()))return null;
  return{dot_thi_id:x.dot_thi_id,ten_dot_thi:d?.ten_dot_thi??"",han_doi:new Date(gioBatDau.getTime()-48*3600_000).toISOString(),so_lan_tc1:(logs??[]).filter(l=>l.dot_thi_id===x.dot_thi_id&&l.vi_tri==="TC1").length,so_lan_tc2:(logs??[]).filter(l=>l.dot_thi_id===x.dot_thi_id&&l.vi_tri==="TC2").length}
 }).filter((x):x is NonNullable<typeof x>=>x!==null);
 return <DoiMonClient mon={(mon??[]) as any} tc1={hs?.mon_tu_chon_1_id??null} tc2={hs?.mon_tu_chon_2_id??null} dot={dots}/>;
}
