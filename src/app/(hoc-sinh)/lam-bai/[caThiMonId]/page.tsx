import {redirect} from "next/navigation";
import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import ExamClient from "./ExamClient";
export const dynamic="force-dynamic";
export default async function LamBaiPage({params}:{params:Promise<{caThiMonId:string}>}){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="HocSinh")redirect("/dang-nhap");const{caThiMonId}=await params;const s=taoSupabaseServiceRole();
 const{data:b}=await s.from("bai_lam_thi").select("bai_lam_id,trang_thai,de_thi_id,ma_de_id,thu_tu_hien_thi,ca_thi_mon!inner(ca_thi!inner(gio_ket_thuc)),tra_loi(*)").eq("ca_thi_mon_id",caThiMonId).eq("hoc_sinh_tai_khoan_id",u.sub).maybeSingle();
 if(!b)return <p className="p-6">Bạn không thuộc danh sách ca thi này.</p>;if(b.trang_thai==="DaNopBai")redirect("/ket-qua");
 let cauHoi:any[]=[];if(b.de_thi_id){const{data}=await s.from("cau_hoi_snapshot").select("snapshot_id,phan,noi_dung,chi_tiet_cau_hoi_snapshot(id,thu_tu,noi_dung)").eq("de_thi_id",b.de_thi_id);const order=Array.isArray(b.thu_tu_hien_thi)?b.thu_tu_hien_thi as any[]:[];const byId=new Map((data??[]).map((x:any)=>[x.snapshot_id,x]));cauHoi=order.map((o:any)=>{const x:any=byId.get(o.snapshot_id);if(!x)return null;const optionOrder=Array.isArray(o.thu_tu_phuong_an)?o.thu_tu_phuong_an:[];const rank=new Map(optionOrder.map((v:any,i:number)=>[Number(v),i]));return{snapshotId:x.snapshot_id,phan:x.phan,noiDung:x.noi_dung,chiTiet:(x.chi_tiet_cau_hoi_snapshot??[]).map((y:any)=>({id:y.id,thuTu:y.thu_tu,noiDung:y.noi_dung})).sort((a:any,b:any)=>(rank.get(a.thuTu)??a.thuTu)-(rank.get(b.thuTu)??b.thuTu))}}).filter(Boolean);if(!cauHoi.length)cauHoi=(data??[]).map((x:any)=>({snapshotId:x.snapshot_id,phan:x.phan,noiDung:x.noi_dung,chiTiet:x.chi_tiet_cau_hoi_snapshot??[]}));}
 const ctm=Array.isArray(b.ca_thi_mon)?b.ca_thi_mon[0]:b.ca_thi_mon,ca=Array.isArray(ctm?.ca_thi)?ctm.ca_thi[0]:ctm?.ca_thi;
 const banDau=(b.tra_loi??[]).map((x:any)=>({cauHoiSnapshotId:x.cau_hoi_snapshot_id,chiTietThuTu:x.chi_tiet_thu_tu,dapAnLuaChonId:x.dap_an_lua_chon_id,dapAnDungSai:x.dap_an_dung_sai,dapAnChuoi:x.dap_an_chuoi}));
 return <div className="mx-auto max-w-4xl"><ExamClient caThiMonId={caThiMonId} baiLamId={b.trang_thai==="DangThi"?b.bai_lam_id:undefined} gioKetThuc={ca?.gio_ket_thuc} cauHoi={cauHoi} banDau={banDau}/></div>;
}
