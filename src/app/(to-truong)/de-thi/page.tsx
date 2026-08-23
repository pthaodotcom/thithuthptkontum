import { redirect } from "next/navigation";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";
import TaoDeClient from "./TaoDeClient";
import DanhSachDeThiClient from "./DanhSachDeThiClient";
export const dynamic="force-dynamic";
export default async function TaoDeThiPage(){
 const session=await laySessionHienHanh();if(!session||session.vai_tro!=="GiaoVien")redirect("/dang-nhap");
 const s=taoSupabaseServiceRole();const {data:taiKhoan}=await s.from("tai_khoan").select("mon_id").eq("tai_khoan_id",session.sub).maybeSingle();
 const {data:mon}=await s.from("mon").select("*").eq("mon_id",taiKhoan?.mon_id??"").maybeSingle();if(!mon)redirect("/soan-cau-hoi");
 const laToTruong=mon.to_truong_tai_khoan_id===session.sub;
 const deQuery=s.from("de_thi").select("de_thi_id,trang_thai,so_ma_de,created_at,ca_thi_mon!inner(mon_id,ca_thi(so_thu_tu_ca,dot_thi(ten_dot:ten_dot_thi)))").eq("ca_thi_mon.mon_id",mon.mon_id).order("created_at",{ascending:false});
 if(!laToTruong)deQuery.neq("trang_thai","DangSoan");
 const {data:de}=await deQuery;
 const danhSachDeXem=(de??[]).map((item)=>{
  const caThiMon=Array.isArray(item.ca_thi_mon)?item.ca_thi_mon[0]:item.ca_thi_mon;
  const caThi=Array.isArray(caThiMon?.ca_thi)?caThiMon.ca_thi[0]:caThiMon?.ca_thi;
  const dot=Array.isArray(caThi?.dot_thi)?caThi.dot_thi[0]:caThi?.dot_thi;
  return {de_thi_id:item.de_thi_id,trang_thai:item.trang_thai,so_ma_de:item.so_ma_de,created_at:item.created_at,ten_dot_thi:dot?.ten_dot??"Đợt thi chưa xác định"};
 });
 if(!laToTruong)return <DanhSachDeThiClient monName={mon.ten_mon} deThi={danhSachDeXem}/>;
 const [{data:cd},{data:md},{data:ca},{data:cauHoi}]=await Promise.all([
  s.from("chuyen_de").select("chuyen_de_id,ten_chuyen_de").eq("mon_id",mon.mon_id).eq("trang_thai","DangDung"),
  s.from("muc_do_nhan_thuc").select("muc_do_id,ten_muc").order("thu_tu"),
  s.from("ca_thi_mon").select("id,ca_thi!inner(so_thu_tu_ca,gio_bat_dau,trang_thai,dot_thi(dot_thi_id,ten_dot:ten_dot_thi))").eq("mon_id",mon.mon_id).eq("ca_thi.trang_thai","SapDienRa"),
  s.from("cau_hoi").select("cau_hoi_id,phan,muc_do_id,noi_dung,bai_hoc!inner(chuyen_de!inner(chuyen_de_id,mon_id))").eq("bai_hoc.chuyen_de.mon_id",mon.mon_id).eq("trang_thai_duyet","DaDuyet").eq("trang_thai_su_dung","ChuaDung").eq("trang_thai_hoat_dong","DangHoatDong").order("created_at",{ascending:true})
 ]);
 const nganHang=(cauHoi??[]).map((q)=>{const baiHoc=Array.isArray(q.bai_hoc)?q.bai_hoc[0]:q.bai_hoc;const chuyenDe=Array.isArray(baiHoc?.chuyen_de)?baiHoc.chuyen_de[0]:baiHoc?.chuyen_de;return{id:q.cau_hoi_id,phan:q.phan,chuyenDeId:chuyenDe?.chuyen_de_id,mucDoId:q.muc_do_id,noiDung:q.noi_dung};}).filter((q)=>q.chuyenDeId);
 const dotThi=Array.from(new Map((ca??[]).map((item)=>{
  const caThi=Array.isArray(item.ca_thi)?item.ca_thi[0]:item.ca_thi;
  const dot=Array.isArray(caThi?.dot_thi)?caThi.dot_thi[0]:caThi?.dot_thi;
  return dot?.dot_thi_id?[dot.dot_thi_id,{dot_thi_id:dot.dot_thi_id,ten_dot_thi:dot.ten_dot}]:null;
 }).filter((item):item is [string,{dot_thi_id:string;ten_dot_thi:string}]=>Boolean(item))).values());
 const danhSachDe=(de??[]).map((item)=>{
  const caThiMon=Array.isArray(item.ca_thi_mon)?item.ca_thi_mon[0]:item.ca_thi_mon;
  const caThi=Array.isArray(caThiMon?.ca_thi)?caThiMon.ca_thi[0]:caThiMon?.ca_thi;
  const dot=Array.isArray(caThi?.dot_thi)?caThi.dot_thi[0]:caThi?.dot_thi;
  return {de_thi_id:item.de_thi_id,trang_thai:item.trang_thai,so_ma_de:item.so_ma_de,created_at:item.created_at,ten_dot_thi:dot?.ten_dot??"Đợt thi chưa xác định"};
 });
 return <TaoDeClient mon={mon as never} chuyenDe={cd??[]} mucDo={md??[]} dotThi={dotThi} deThi={danhSachDe} cauHoiKhaDung={nganHang as never[]}/>;
}
