import { createClient } from "@supabase/supabase-js";
import { taoDauVanCauHoi } from "../src/lib/rules/cau-hoi-trung";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const PAGE_SIZE = 200;
let offset = 0;
let daQuet = 0;
let daCapNhat = 0;

while (true) {
  const { data: questions, error } = await supabase
    .from("cau_hoi")
    .select("cau_hoi_id,bai_hoc_id,muc_do_id,phan,noi_dung,dap_an_phan3,updated_at,chi_tiet_cau_hoi(thu_tu,noi_dung,la_dap_an_dung)")
    .order("cau_hoi_id")
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) throw new Error(`Không đọc được câu hỏi: ${error.message}`);
  if (!questions?.length) break;

  const ids = questions.map((item) => item.cau_hoi_id);
  const { data: existing, error: existingError } = await supabase
    .from("cau_hoi_dau_van")
    .select("cau_hoi_id,source_updated_at")
    .in("cau_hoi_id", ids);
  if (existingError) throw new Error(`Không đọc được dấu vân: ${existingError.message}`);
  const sourceById = new Map((existing ?? []).map((item) => [item.cau_hoi_id, item.source_updated_at]));

  const rows = questions.flatMap((question) => {
    if (sourceById.get(question.cau_hoi_id) === question.updated_at) return [];
    const dauVan = taoDauVanCauHoi({
      phan: question.phan as "I" | "II" | "III",
      baiHocId: question.bai_hoc_id,
      mucDoId: question.muc_do_id,
      noiDung: question.noi_dung,
      dapAnPhan3: question.dap_an_phan3,
      chiTiet: [...(question.chi_tiet_cau_hoi ?? [])]
        .sort((a, b) => a.thu_tu - b.thu_tu)
        .map((item) => ({ noiDung: item.noi_dung, laDapAnDung: item.la_dap_an_dung })),
    });
    return [{
      cau_hoi_id: question.cau_hoi_id,
      content_hash: dauVan.contentHash,
      noi_dung_chuan_hoa: dauVan.noiDungChuanHoa,
      mau_cau_hoi: dauVan.mauCauHoi,
      chu_ky_so: dauVan.chuKySo,
      source_updated_at: question.updated_at,
    }];
  });
  if (rows.length) {
    const { error: upsertError } = await supabase.from("cau_hoi_dau_van").upsert(rows, { onConflict: "cau_hoi_id" });
    if (upsertError) throw new Error(`Không cập nhật được dấu vân: ${upsertError.message}`);
    daCapNhat += rows.length;
  }
  daQuet += questions.length;
  offset += questions.length;
  if (questions.length < PAGE_SIZE) break;
}

process.stdout.write(`Đã quét ${daQuet} câu hỏi; cập nhật ${daCapNhat} dấu vân.\n`);
