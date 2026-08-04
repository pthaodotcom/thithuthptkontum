"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { laySessionHienHanh } from "@/lib/auth/session";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

const schema=z.object({ten:z.string().trim().min(3).max(150),ngay1:z.string().date(),ngay2:z.string().date(),lopIds:z.array(z.string().uuid()).min(1)});
const suaSchema=schema.omit({lopIds:true}).extend({dotThiId:z.string().uuid()});
const xoaSchema=z.object({dotThiId:z.string().uuid()});

function thongBaoLoi(message:string){
  const messages:Record<string,string>={
    DOT_THI_DA_MO_KHONG_THE_SUA:"Không thể sửa vì ít nhất một ca thi đã mở hoặc kết thúc.",
    DOT_THI_DA_MO_KHONG_THE_XOA:"Không thể xóa vì ít nhất một ca thi đã mở hoặc kết thúc.",
    DA_CO_HOC_SINH_DANG_NHAP:"Không thể xóa vì đã có học sinh đăng nhập vào đợt thi.",
    NGAY_THI_2_PHAI_SAU_NGAY_THI_1:"Ngày thi thứ hai phải sau ngày thi thứ nhất.",
    KHONG_TIM_THAY_DOT_THI:"Không tìm thấy đợt thi.",
    PHAI_CHON_IT_NHAT_MOT_LOP:"Phải chọn ít nhất một lớp tham gia đợt thi.",
    CHUA_DU_BON_KHUNG_GIO:"Chưa cấu hình đủ 4 khung giờ chuẩn — vào mục Khung giờ chuẩn để bổ sung.",
    PHAI_CO_DUNG_HAI_MON_BAT_BUOC:"Phải có đúng 2 môn Bắt buộc đang dùng (mỗi ca thi 1 và 2 gán đúng 1 môn) — vào mục Môn học để kiểm tra Loại môn và Trạng thái.",
  };
  const code=Object.keys(messages).find(x=>message.includes(x));
  return code?messages[code]:message;
}
export async function taoDotThi(input:z.input<typeof schema>){
  const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
  const p=schema.safeParse(input);if(!p.success)return{success:false,error:p.error.issues[0]?.message??"Dữ liệu không hợp lệ"};
  const {data,error}=await taoSupabaseServiceRole().rpc("tao_dot_thi_day_du",{p_ten:p.data.ten,p_ngay_1:p.data.ngay1,p_ngay_2:p.data.ngay2,p_lop_ids:p.data.lopIds});
  if(error)return{success:false,error:thongBaoLoi(error.message)};revalidatePath("/dot-thi");return{success:true,id:data as string};
}

export async function capNhatDotThi(input:z.input<typeof suaSchema>){
  const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
  const p=suaSchema.safeParse(input);if(!p.success)return{success:false,error:p.error.issues[0]?.message??"Dữ liệu không hợp lệ"};
  const {error}=await taoSupabaseServiceRole().rpc("cap_nhat_dot_thi",{p_dot_thi_id:p.data.dotThiId,p_ten:p.data.ten,p_ngay_1:p.data.ngay1,p_ngay_2:p.data.ngay2,p_nguoi_thuc_hien_id:u.sub});
  if(error)return{success:false,error:thongBaoLoi(error.message)};
  revalidatePath("/dot-thi");return{success:true};
}

export async function xoaDotThi(input:z.input<typeof xoaSchema>){
  const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return{success:false,error:"Không có quyền"};
  const p=xoaSchema.safeParse(input);if(!p.success)return{success:false,error:"Đợt thi không hợp lệ"};
  const {error}=await taoSupabaseServiceRole().rpc("xoa_dot_thi",{p_dot_thi_id:p.data.dotThiId,p_nguoi_thuc_hien_id:u.sub});
  if(error)return{success:false,error:thongBaoLoi(error.message)};
  revalidatePath("/dot-thi");return{success:true};
}
