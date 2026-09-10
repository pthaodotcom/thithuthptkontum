"use server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
const schema=z.object({monId:z.string().uuid(),giaoVienId:z.string().uuid()});
export async function boNhiemToTruong(input:z.input<typeof schema>){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
 const p=schema.safeParse(input);if(!p.success)return{success:false,error:"Dữ liệu không hợp lệ"};
 const{error}=await taoSupabaseServiceRole().rpc("bo_nhiem_to_truong",{p_mon_id:p.data.monId,p_giao_vien_id:p.data.giaoVienId,p_nguoi_thuc_hien_id:u.sub});
 if(error){if(error.message.includes("GIAO_VIEN_KHONG_THUOC_MON"))return{success:false,error:"Giáo viên không phụ trách môn này hoặc tài khoản đang tạm khóa."};return{success:false,error:"Chưa bổ nhiệm được Tổ trưởng. Vui lòng thử lại."}}
 revalidatePath("/to-truong-bo-mon");return{success:true};
}

export async function goBoNhiemToTruong(monId:string){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
 const p=z.string().uuid().safeParse(monId);if(!p.success)return{success:false,error:"Dữ liệu không hợp lệ"};
 const{error}=await taoSupabaseServiceRole().from("mon").update({to_truong_tai_khoan_id:null}).eq("mon_id",p.data);
 if(error)return{success:false,error:"Chưa gỡ được bổ nhiệm. Vui lòng thử lại."};revalidatePath("/to-truong-bo-mon");revalidatePath("/tai-khoan");return{success:true};
}
