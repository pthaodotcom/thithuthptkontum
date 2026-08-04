import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== SỬA TRIGGER THỦ TỤC VALIDATE VÀ XÓA MÔN VẬT LÝ TRÙNG LẶP ===");

  // 1. Cập nhật trigger function validate_hoc_sinh_mon_tu_chon() trong Database để chấp nhận cả 'Vật lí' và 'Vật lý'
  const updateTriggerSql = `
    create or replace function validate_hoc_sinh_mon_tu_chon()
    returns trigger
    language plpgsql
    set search_path = public
    as $$
    declare
      v_so_mon_hop_le integer;
    begin
      if new.vai_tro = 'HocSinh' then
        if new.mon_tu_chon_1_id is null or new.mon_tu_chon_2_id is null then
          raise exception using errcode = '23514',
            message = 'HOC_SINH_PHAI_CHON_DU_HAI_MON';
        end if;
        if new.mon_tu_chon_1_id = new.mon_tu_chon_2_id then
          raise exception using errcode = '23514',
            message = 'HAI_MON_TU_CHON_PHAI_KHAC_NHAU';
        end if;

        select count(*)
        into v_so_mon_hop_le
        from mon
        where mon_id in (new.mon_tu_chon_1_id, new.mon_tu_chon_2_id)
          and loai_mon = 'TuChon'
          and trang_thai = 'DangDung'
          and ten_mon in (
            'Vật lí', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Địa lý',
            'Giáo dục kinh tế và pháp luật', 'Tin học', 'Công nghệ',
            'Ngoại ngữ'
          );
        if v_so_mon_hop_le <> 2 then
          raise exception using errcode = '23514',
            message = 'MON_TU_CHON_KHONG_THUOC_DANH_MUC_CHO_PHEP';
        end if;
      elsif new.mon_tu_chon_1_id is not null or new.mon_tu_chon_2_id is not null then
        raise exception using errcode = '23514',
          message = 'CHI_HOC_SINH_DUOC_CHON_MON_TU_CHON';
      end if;
      return new;
    end
    $$;
  `;

  // Gọi rpc hoặc sql query qua pg connection nếu có thể, hoặc dùng supabase.rpc
  // Lưu ý: Nếu supabase không có rpc sql_exec, ta có thể dùng postgresql connection trực tiếp hoặc update dữ liệu.
  // Thử dùng postgresql connection bằng pg module hoặc node client.
}

main();
