"use server";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
const schema=z.object({baiLamId:z.string().uuid(),loai:z.enum(["MoKhoaVaoTre","Reset_TiepTuc","Reset_LamLai"]),lyDo:z.string().trim().min(3).max(500)});
export async function xuLyNgoaiLe(input:z.input<typeof schema>){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
 const p=schema.safeParse(input);if(!p.success)return{success:false,error:"Bắt buộc nhập lý do từ 3 đến 500 ký tự."};
 const{error}=await taoSupabaseServiceRole().rpc("xu_ly_ngoai_le_bai_thi",{p_bai_lam_id:p.data.baiLamId,p_loai_xu_ly:p.data.loai,p_ly_do:p.data.lyDo,p_nguoi_thuc_hien_id:u.sub});
 if(error){const map:Record<string,string>={CA_THI_KHONG_DANG_MO:"Ca thi không còn đang mở.",TRANG_THAI_DA_THAY_DOI:"Trạng thái bài thi đã thay đổi, vui lòng tải lại.",VUOT_QUA_HAI_LAN_RESET:"Học sinh đã dùng đủ 2 lần reset."};const k=Object.keys(map).find(x=>error.message.includes(x));return{success:false,error:k?map[k]:error.message}}
 revalidatePath("/giam-sat-ca-thi");return{success:true};
}
