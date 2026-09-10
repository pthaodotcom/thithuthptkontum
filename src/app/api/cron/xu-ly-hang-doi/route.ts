import { NextRequest } from "next/server";

import { apiLoi, apiThanhCong } from "@/lib/api/response";
import { xuLyMotJob, type JobHangDoi } from "@/lib/job/xu-ly-mot-job";
import { taoSupabaseServiceRole } from "@/lib/supabase/server";

/** Cron claim mot job bang SKIP LOCKED, roi dung chung bo xu ly voi Admin demo. */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiLoi("KHONG_CO_QUYEN", "Cron secret không hợp lệ", 401);
  }
  const supabase = taoSupabaseServiceRole();
  const { data: jobs, error } = await supabase.rpc("nhan_job_hang_doi");
  if (error) return apiLoi("NHAN_JOB_THAT_BAI", error.message, 500);
  const job = jobs?.[0] as JobHangDoi | undefined;
  if (!job) return apiThanhCong({ daXuLy: false });
  try {
    const ketQua = await xuLyMotJob(supabase, job);
    return apiThanhCong({ daXuLy: true, jobId: job.id, loaiJob: job.loai_job, ...ketQua });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Lỗi không xác định";
    return apiLoi("XU_LY_JOB_THAT_BAI", message, 500, { jobId: job.id });
  }
}
