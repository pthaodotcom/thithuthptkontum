"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

async function context(cauHoiId:string) {
  const session=await laySessionHienHanh(); if(!session||session.vai_tro!=="GiaoVien") throw new Error("Không có quyền");
  const supabase=taoSupabaseServiceRole();
  const {data:mon}=await supabase.from("mon").select("mon_id").eq("to_truong_tai_khoan_id",session.sub).maybeSingle();
  if(!mon) throw new Error("Không phải Tổ trưởng");
  const {data:cau}=await supabase.from("cau_hoi").select("cau_hoi_id,trang_thai_su_dung,bai_hoc!inner(chuyen_de!inner(mon_id))").eq("cau_hoi_id",cauHoiId).eq("bai_hoc.chuyen_de.mon_id",mon.mon_id).maybeSingle();
  if(!cau) throw new Error("Câu hỏi không thuộc môn phụ trách"); return {supabase,cau};
}
export async function xoaHoacVoHieuHoa(cauHoiId:string) {
  try { z.string().uuid().parse(cauHoiId); const {supabase,cau}=await context(cauHoiId);
    const session=await laySessionHienHanh();
    const {error}=await supabase.rpc("quan_tri_cau_hoi",{p_cau_hoi_id:cauHoiId,p_to_truong_id:session!.sub,p_hanh_dong:cau.trang_thai_su_dung==="ChuaDung"?"Xoa":"VoHieuHoa",p_nhom_id:null});
    if(error) throw new Error(error.message); revalidatePath("/ngan-hang-cau-hoi"); return {success:true,voHieuHoa:cau.trang_thai_su_dung!=="ChuaDung"};
  } catch(e){return {success:false,error:e instanceof Error?e.message:"Có lỗi"};}
}
