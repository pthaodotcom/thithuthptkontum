import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import {apiLoi,apiThanhCong} from "@/lib/api/response";
export async function GET(){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return apiLoi("KHONG_CO_QUYEN","Không có quyền",403);
 const{data,error}=await taoSupabaseServiceRole().from("bai_lam_thi").select("bai_lam_id,trang_thai,thoi_diem_vao_thi,thoi_diem_nop,diem_tong,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ma_so,ho_ten,trang_thai),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(so_thu_tu_ca,trang_thai,dot_thi!inner(ten_dot_thi))),vi_pham(id))").in("trang_thai",["ChuaDangNhap","DangThi","BiKhoaChoXuLy","DaNopBai","KhongTheDuThi_LoiToChuc"]).limit(1000);
 if(error)return apiLoi("TRUY_VAN_THAT_BAI",error.message,500);return apiThanhCong(data??[]);
}
