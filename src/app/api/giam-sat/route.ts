import {laySessionHienHanh} from "@/lib/auth/session";
import {taoSupabaseServiceRole} from "@/lib/supabase/server";
import {apiLoi,apiThanhCong} from "@/lib/api/response";
export async function GET(){
 const u=await laySessionHienHanh();if(!u||u.vai_tro!=="Admin")return apiLoi("KHONG_CO_QUYEN","Không có quyền",403);
 const{data,error}=await taoSupabaseServiceRole().from("bai_lam_thi").select("bai_lam_id,trang_thai,tai_khoan!bai_lam_thi_hoc_sinh_tai_khoan_id_fkey(ma_so,ho_ten),ca_thi_mon!inner(mon(ten_mon),ca_thi!inner(dot_thi!inner(ten_dot_thi))),vi_pham!inner(id,loai_vi_pham,thoi_diem)").order("thoi_diem",{referencedTable:"vi_pham",ascending:false}).limit(1000);
 if(error)return apiLoi("TRUY_VAN_THAT_BAI",error.message,500);return apiThanhCong(data??[]);
}
