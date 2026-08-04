import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const chuyenDeVatLi = [
  {
    ma: "CD1_LY",
    ten: "Chương 1: Vật lí nhiệt",
    baiHoc: [
      { ma: "B1_LY", ten: "Bài 1: Cấu trúc của chất và sự chuyển thể" },
      { ma: "B2_LY", ten: "Bài 2: Nội năng và định luật I của nhiệt động lực học" },
      { ma: "B3_LY", ten: "Bài 3: Nhiệt độ, thang nhiệt độ và đo nhiệt độ" },
      { ma: "B4_LY", ten: "Bài 4: Nhiệt dung riêng và nhiệt hóa hơi riêng" }
    ]
  },
  {
    ma: "CD2_LY",
    ten: "Chương 2: Khí lý tưởng",
    baiHoc: [
      { ma: "B5_LY", ten: "Bài 5: Mô hình động học phân tử chất khí" },
      { ma: "B6_LY", ten: "Bài 6: Định luật Boyle, Charles và phương trình trạng thái khí lý tưởng" },
      { ma: "B7_LY", ten: "Bài 7: Áp suất khí theo mô hình động học phân tử" }
    ]
  },
  {
    ma: "CD3_LY",
    ten: "Chương 3: Từ trường và Cảm ứng điện từ",
    baiHoc: [
      { ma: "B8_LY", ten: "Bài 8: Từ trường, đường sức từ và lực từ" },
      { ma: "B9_LY", ten: "Bài 9: Cảm ứng từ và lực Lorentz" },
      { ma: "B10_LY", ten: "Bài 10: Hiện tượng cảm ứng điện từ và sóng điện từ" }
    ]
  },
  {
    ma: "CD4_LY",
    ten: "Chương 4: Vật lí hạt nhân",
    baiHoc: [
      { ma: "B11_LY", ten: "Bài 11: Cấu trúc hạt nhân và năng lượng liên kết" },
      { ma: "B12_LY", ten: "Bài 12: Phản ứng hạt nhân, phân hạch và nhiệt hạch" },
      { ma: "B13_LY", ten: "Bài 13: Phóng xạ và an toàn phóng xạ" }
    ]
  },
  {
    ma: "CD5_LY",
    ten: "Chuyên đề 1: Dòng điện xoay chiều",
    baiHoc: [
      { ma: "B14_LY", ten: "Bài 14: Đặc trưng dòng điện xoay chiều và mạch RLC mắc nối tiếp" },
      { ma: "B15_LY", ten: "Bài 15: Máy biến áp, truyền tải điện năng và chỉnh lưu" }
    ]
  },
  {
    ma: "CD6_LY",
    ten: "Chuyên đề 2: Ứng dụng vật lí trong chẩn đoán y học",
    baiHoc: [
      { ma: "B16_LY", ten: "Bài 16: Tia X, Chụp X-quang, CT, Siêu âm và MRI" }
    ]
  },
  {
    ma: "CD7_LY",
    ten: "Chuyên đề 3: Vật lí lượng tử",
    baiHoc: [
      { ma: "B17_LY", ten: "Bài 17: Hiệu ứng quang điện, photon và lượng tính sóng hạt" }
    ]
  }
];

async function main() {
  console.log("=== BẮT ĐẦU SEED KHUNG CHUYÊN ĐỀ & CÂU HỎI MÔN VẬT LÍ (4 CÂU / MỨC ĐỘ / BÀI HỌC) ===");

  // Lấy ID môn Vật lí chuẩn
  const { data: monList } = await supabase.from("mon").select("mon_id, ten_mon").ilike("ten_mon", "Vật l%").eq("trang_thai", "DangDung");
  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Vật lí");
    process.exit(1);
  }
  const monId = monList[0].mon_id;
  console.log(`Môn Vật lí ID: ${monId} (${monList[0].ten_mon})`);

  // Lấy các mức độ nhận thức
  const { data: mucDoList } = await supabase.from("muc_do_nhan_thuc").select("*").order("thu_tu", { ascending: true });
  const nb = mucDoList.find(m => m.thu_tu === 1)?.muc_do_id || mucDoList[0].muc_do_id;
  const th = mucDoList.find(m => m.thu_tu === 2)?.muc_do_id || mucDoList[1].muc_do_id;
  const vd = mucDoList.find(m => m.thu_tu === 3)?.muc_do_id || mucDoList[2].muc_do_id;
  const vdc = mucDoList.find(m => m.thu_tu === 4)?.muc_do_id || mucDoList[3].muc_do_id;

  const levelMap = { NhanBiet: nb, ThongHieu: th, VanDung: vd, VanDungCao: vdc };

  // Khởi tạo Chuyên đề & Bài học trong DB
  const baiHocDbMap = {};

  for (const cd of chuyenDeVatLi) {
    let cdId = null;
    const { data: existingCd } = await supabase.from("chuyen_de").select("chuyen_de_id").eq("mon_id", monId).or(`ma_chuyen_de.eq.${cd.ma},ten_chuyen_de.ilike.${cd.ten}`).maybeSingle();

    if (existingCd) {
      cdId = existingCd.chuyen_de_id;
      await supabase.from("chuyen_de").update({ ma_chuyen_de: cd.ma, ten_chuyen_de: cd.ten, trang_thai: "DangDung" }).eq("chuyen_de_id", cdId);
    } else {
      const { data: newCd } = await supabase.from("chuyen_de").insert({ mon_id: monId, ma_chuyen_de: cd.ma, ten_chuyen_de: cd.ten, trang_thai: "DangDung" }).select("chuyen_de_id").single();
      cdId = newCd.chuyen_de_id;
    }

    for (const bh of cd.baiHoc) {
      const { data: existingBh } = await supabase.from("bai_hoc").select("bai_hoc_id").eq("chuyen_de_id", cdId).or(`ma_bai_hoc.eq.${bh.ma},ten_bai_hoc.ilike.${bh.ten}`).maybeSingle();
      if (existingBh) {
        baiHocDbMap[bh.ma] = existingBh.bai_hoc_id;
        await supabase.from("bai_hoc").update({ ma_bai_hoc: bh.ma, ten_bai_hoc: bh.ten, trang_thai: "DangDung" }).eq("bai_hoc_id", existingBh.bai_hoc_id);
      } else {
        const { data: newBh } = await supabase.from("bai_hoc").insert({ chuyen_de_id: cdId, ma_bai_hoc: bh.ma, ten_bai_hoc: bh.ten, trang_thai: "DangDung" }).select("bai_hoc_id").single();
        baiHocDbMap[bh.ma] = newBh.bai_hoc_id;
      }
    }
  }

  console.log("✅ Đã tạo/cập nhật xong khung Chuyên đề & Bài học môn Vật lí!");

  // Mẫu sinh câu hỏi chi tiết cho mỗi bài học: 4 câu Nhận biết, 4 câu Thông hiểu, 4 câu Vận dụng, 4 câu Vận dụng cao (gồm cả Phần I và Phần II)
  const questionTemplates = [
    // --- BÀI 1: Cấu trúc chất và sự chuyển thể ---
    {
      bh: "B1_LY", muc: "NhanBiet", phan: "I",
      q: "Quá trình chuyển từ thể rắn sang thể lỏng của một chất được gọi là:",
      opts: ["Sự nóng chảy", "Sự đông đặc", "Sự hóa hơi", "Sự ngưng tụ"], correct: 1
    },
    {
      bh: "B1_LY", muc: "NhanBiet", phan: "I",
      q: "Vật chất ở thể nào có thể tích và hình dạng xác định?",
      opts: ["Thể rắn", "Thể lỏng", "Thể khí", "Thể Plasma"], correct: 1
    },
    {
      bh: "B1_LY", muc: "NhanBiet", phan: "I",
      q: "Lực tương tác giữa các phân tử ở thể nào là mạnh nhất?",
      opts: ["Thể rắn", "Thể lỏng", "Thể khí", "Thể hơi"], correct: 1
    },
    {
      bh: "B1_LY", muc: "NhanBiet", phan: "II",
      q: "Đánh giá các phát biểu về sự chuyển thể của chất nhiệt học:",
      items: [
        { text: "a) Sự ngưng tụ là quá trình chuyển từ thể hơi (khí) sang thể lỏng.", correct: true },
        { text: "b) Trong suốt quá trình nóng chảy của chất rắn kết tinh, nhiệt độ liên tục tăng lên.", correct: false },
        { text: "c) Sự bay hơi chỉ xảy ra ở bề mặt của chất lỏng và ở bất kỳ nhiệt độ nào.", correct: true },
        { text: "d) Các phân tử ở thể khí chuyển động hỗn loạn không ngừng về mọi phía.", correct: true }
      ]
    },

    {
      bh: "B1_LY", muc: "ThongHieu", phan: "I",
      q: "Vì sao khi đun nước đến khi sôi, dù tiếp tục cung cấp nhiệt lượng thì nhiệt độ của nước vẫn không tăng quá 100°C (ở áp suất tiêu chuẩn)?",
      opts: ["Nhiệt lượng cung cấp được dùng để làm phá vỡ liên kết giữa các phân tử nước chuyển sang thể hơi", "Nhiệt lượng thoát ra ngoài hoàn toàn", "Nước không hấp thụ nhiệt lượng nữa", "Lực hút phân tử tăng đột ngột"], correct: 1
    },
    {
      bh: "B1_LY", muc: "ThongHieu", phan: "I",
      q: "Hiện tượng nào sau đây là minh họa cho sự ngưng tụ?",
      opts: ["Hơi nước trong không khí đọng thành các giọt sương trên lá cây vào ban đêm", "Nước đá tan thành nước lỏng", "Cồn để trong chai hở nắp bị cạn dần", "Đốt nến chảy ra"], correct: 1
    },
    {
      bh: "B1_LY", muc: "ThongHieu", phan: "I",
      q: "Vật rắn vô định hình khác vật rắn kết tinh ở điểm nổi bật nào?",
      opts: ["Không có nhiệt độ nóng chảy xác định", "Không có hình dạng cố định", "Không cấu tạo từ phân tử", "Dễ bay hơi hơn"], correct: 1
    },
    {
      bh: "B1_LY", muc: "ThongHieu", phan: "II",
      q: "Xét các đặc điểm của mô hình cấu trúc phân tử:",
      items: [
        { text: "a) Ở thể rắn kết tinh, các hạt sắp xếp có trật tự xác định trong không gian.", correct: true },
        { text: "b) Khoảng cách giữa các phân tử chất khí rất lớn so với kích thước của chúng.", correct: true },
        { text: "c) Lực liên kết phân tử ở thể lỏng yếu hơn thể khí.", correct: false },
        { text: "d) Khi nhiệt độ tăng, tốc độ chuyển động nhiệt của các phân tử tăng lên.", correct: true }
      ]
    },

    {
      bh: "B1_LY", muc: "VanDung", phan: "I",
      q: "Một cục đá khối lượng 0,5 kg ở 0°C nhận nhiệt lượng 167 kJ để nóng chảy hoàn toàn thành nước ở 0°C. Nhiệt nóng chảy riêng của nước đá là:",
      opts: ["3,34.10^5 J/kg", "3,34.10^4 J/kg", "1,67.10^5 J/kg", "6,68.10^5 J/kg"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDung", phan: "I",
      q: "Tính nhiệt lượng cần cung cấp để hóa hơi hoàn toàn 2 kg nước ở 100°C, biết nhiệt hóa hơi riêng của nước là 2,26.10^6 J/kg.",
      opts: ["4,52.10^6 J", "2,26.10^6 J", "1,13.10^6 J", "9,04.10^6 J"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDung", phan: "I",
      q: "Đun nóng 100g một chất rắn kết tinh. Đồ thị nhiệt độ theo thời gian cho thấy giai đoạn đi ngang kéo dài 5 phút ở 80°C. Điều này chứng tỏ:",
      opts: ["Chất này nóng chảy ở 80°C và mất 5 phút để nóng chảy hoàn toàn", "Chất này sôi ở 80°C", "Máy đun bị ngắt điện 5 phút", "Chất này chuyển trực tiếp từ rắn sang khí"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDung", phan: "II",
      q: "Một ấm điện công suất 1000 W đun 1 kg nước ở 100°C sôi hóa hơi. Bỏ qua hao phí nhiệt:",
      items: [
        { text: "a) Nhiệt lượng cần để hóa hơi 1 kg nước ở 100°C là L = 2,26.10^6 J.", correct: true },
        { text: "b) Thời gian đun để nước hóa hơi hoàn toàn là t = 2260 giây (khoảng 37,6 phút).", correct: true },
        { text: "c) Nếu công suất ấm tăng gấp đôi thì thời gian hóa hơi giảm một nửa.", correct: true },
        { text: "d) Nhiệt độ của nước trong ấm tăng liên tục vượt qua 100°C khi đun tiếp.", correct: false }
      ]
    },

    {
      bh: "B1_LY", muc: "VanDungCao", phan: "I",
      q: "Thả một cục đá 0,2 kg ở -10°C vào bình chứa 1 kg nước ở 20°C. Biết c_đá = 2100 J/kg.K, c_nước = 4200 J/kg.K, λ_đá = 3,34.10^5 J/kg. Nhiệt độ cân bằng của hệ là:",
      opts: ["3,7°C", "0°C", "5,2°C", "10°C"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDungCao", phan: "I",
      q: "Dùng bếp điện hiệu suất 80% để đun sôi và hóa hơi 0,5 kg nước từ 20°C. Cho c = 4200 J/kg.K, L = 2,26.10^6 J. Tổng điện năng bếp tiêu thụ là:",
      opts: ["1,62.10^6 J", "1,29.10^6 J", "2,02.10^6 J", "1,03.10^6 J"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDungCao", phan: "I",
      q: "Trong quá trình đun chảy viên chì 1 kg từ 27°C đến nóng chảy hoàn toàn ở 327°C. Cho c_chì = 130 J/kg.K, λ_chì = 25.10^3 J/kg. Tỷ số giữa nhiệt lượng làm tăng nhiệt độ và nhiệt lượng làm nóng chảy là:",
      opts: ["1,56", "0,64", "2,15", "1,00"], correct: 1
    },
    {
      bh: "B1_LY", muc: "VanDungCao", phan: "II",
      q: "Dẫn m_h (kg) hơi nước ở 100°C vào xô chứa 5 kg nước đá ở 0°C. Sau khi cân bằng, toàn bộ nước đá tan và hệ đạt 20°C:",
      items: [
        { text: "a) Nhiệt lượng nước đá thu vào để tan hoàn toàn ở 0°C là Q1 = 1,67.10^6 J.", correct: true },
        { text: "b) Nhiệt lượng 5 kg nước (sau khi tan) thu vào để tăng từ 0°C đến 20°C là Q2 = 4,2.10^5 J.", correct: true },
        { text: "c) Tổng nhiệt lượng thu vào của hệ nước đá là Q_thu = 2,09.10^6 J.", correct: true },
        { text: "d) Khối lượng hơi nước ngưng tụ m_h cần thiết xấp xỉ 0,81 kg.", correct: true }
      ]
    },

    // --- BÀI 2: Nội năng và Định luật I Nhiệt động lực học ---
    {
      bh: "B2_LY", muc: "NhanBiet", phan: "I",
      q: "Nội năng của một vật là:",
      opts: ["Tổng động năng và thế năng tương tác của các phân tử cấu tạo nên vật", "Tổng động năng và thế năng chuyển động của toàn bộ vật", "Nhiệt lượng vật tỏa ra môi trường", "Cơ năng tích trữ trong vật"], correct: 1
    },
    {
      bh: "B2_LY", muc: "NhanBiet", phan: "I",
      q: "Công thức thể hiện Định luật I của nhiệt động lực học là:",
      opts: ["ΔU = Q + A", "ΔU = Q - A", "ΔU = A / Q", "Q = ΔU . A"], correct: 1
    },
    {
      bh: "B2_LY", muc: "NhanBiet", phan: "I",
      q: "Quy ước dấu nào sau đây trong công thức ΔU = Q + A là ĐÚNG?",
      opts: ["Q > 0: Hệ nhận nhiệt lượng", "Q < 0: Hệ nhận nhiệt lượng", "A > 0: Hệ thực hiện công", "A < 0: Hệ nhận công"], correct: 1
    },
    {
      bh: "B2_LY", muc: "NhanBiet", phan: "II",
      q: "Xét các nguyên lý làm biến đổi nội năng của vật:",
      items: [
        { text: "a) Có hai cách làm biến đổi nội năng là thực hiện công và truyền nhiệt.", correct: true },
        { text: "b) Khi cọ xát miếng kim loại lên mặt bàn, nội năng tăng lên do thực hiện công.", correct: true },
        { text: "c) Khi thả miếng kim loại nóng vào cốc nước lạnh, nội năng biến đổi do thực hiện công.", correct: false },
        { text: "d) Đơn vị đo nội năng, nhiệt lượng và công trong hệ SI đều là Joule (J).", correct: true }
      ]
    },

    {
      bh: "B2_LY", muc: "ThongHieu", phan: "I",
      q: "Khi nén khí trong xilanh piston nhanh chóng, nhiệt độ khối khí tăng lên. Nguyên nhân chính là:",
      opts: ["Ngoại lực thực hiện công lên khối khí làm nội năng của khí tăng", "Khí nhận nhiệt lượng từ bên ngoài", "Khí tỏa nhiệt ra piston", "Thể tích khí tăng làm tăng động năng"], correct: 1
    },
    {
      bh: "B2_LY", muc: "ThongHieu", phan: "I",
      q: "Trường hợp nào sau đây tương ứng với quá trình ΔU = Q (với Q < 0)?",
      opts: ["Khối khí tỏa nhiệt ra môi trường và không thay đổi thể tích (không thực hiện công)", "Khối khí nhận công và tỏa nhiệt", "Khối khí dãn nở đẳng nhiệt", "Khối khí bị nén và nhận nhiệt"], correct: 1
    },
    {
      bh: "B2_LY", muc: "ThongHieu", phan: "I",
      q: "Nội năng của một lượng khí lý tưởng phụ thuộc vào yếu tố nào?",
      opts: ["Chỉ phụ thuộc vào nhiệt độ tuyệt đối T", "Phụ thuộc cả nhiệt độ và thể tích", "Chỉ phụ thuộc vào áp suất", "Phụ thuộc vào khối lượng mol phân tử"], correct: 1
    },
    {
      bh: "B2_LY", muc: "ThongHieu", phan: "II",
      q: "Đánh giá các quá trình biến đổi trạng thái theo Định luật I nhiệt động lực học:",
      items: [
        { text: "a) Trong quá trình đẳng tích, khí không thực hiện công (A = 0) nên ΔU = Q.", correct: true },
        { text: "b) Trong quá trình dãn nở tự do, khí nhận công A > 0.", correct: false },
        { text: "c) Khi khí dãn nở đẩy piston sang phải, khí thực hiện công nên A < 0.", correct: true },
        { text: "d) Nếu hệ nhận nhiệt Q = 100 J và nhận công A = 50 J thì nội năng tăng ΔU = 150 J.", correct: true }
      ]
    },

    {
      bh: "B2_LY", muc: "VanDung", phan: "I",
      q: "Một khối khí trong xilanh nhận nhiệt lượng 250 J và dãn nở đẩy piston thực hiện một công 100 J. Độ biến thiên nội năng ΔU của khối khí là:",
      opts: ["+150 J", "+350 J", "-150 J", "-350 J"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDung", phan: "I",
      q: "Người ta thực hiện công 300 J để nén khí trong xilanh. Biết nội năng khối khí tăng 200 J. Khối khí đã:",
      opts: ["Tỏa nhiệt lượng 100 J ra môi trường", "Nhận nhiệt lượng 100 J", "Tỏa nhiệt lượng 500 J", "Nhận nhiệt lượng 500 J"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDung", phan: "I",
      q: "Cung cấp nhiệt lượng 500 J cho khối khí chứa trong xilanh nằm ngang. Khí dãn nở đẩy piston di chuyển đoạn 0,1 m với lực ma sát trung bình 200 N. Độ biến thiên nội năng là:",
      opts: ["480 J", "520 J", "300 J", "700 J"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDung", phan: "II",
      q: "Một lượng khí nhận nhiệt lượng Q = 1000 J và dãn nở áp suất không đổi p = 2.10^5 Pa làm thể tích tăng từ 2 lít lên 5 lít (1 lít = 10^-3 m^3):",
      items: [
        { text: "a) Độ biến thiên thể tích của khí ΔV = 3.10^-3 m^3.", correct: true },
        { text: "b) Công do khối khí thực hiện khi dãn nở là A' = p.ΔV = 600 J.", correct: true },
        { text: "c) Trong công thức ΔU = Q + A, công hệ nhận là A = -600 J.", correct: true },
        { text: "d) Nội năng của khối khí tăng một lượng ΔU = 400 J.", correct: true }
      ]
    },

    {
      bh: "B2_LY", muc: "VanDungCao", phan: "I",
      q: "Một động cơ nhiệt hoạt động theo chu trình nhận nhiệt Q1 = 800 J từ nguồn nóng và tỏa nhiệt Q2 = 500 J cho nguồn lạnh. Hiệu suất H của động cơ nhiệt này là:",
      opts: ["37,5%", "62,5%", "60,0%", "40,0%"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDungCao", phan: "I",
      q: "Khối khí trong xilanh thực hiện chu trình kín A -> B -> C -> A. Biết Q_nhận = 1200 J. Tổng công mà khối khí thực hiện trong toàn bộ chu trình là:",
      opts: ["Bằng tổng nhiệt lượng khí nhận tỏa trong chu trình (A' = Q_ròng)", "Bằng 0", "Luôn bằng 1200 J", "Phụ thuộc vào nhiệt độ ban đầu"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDungCao", phan: "I",
      q: "Một quả bóng cao su rơi từ độ cao 10 m xuống đất nẩy lên độ cao 7 m. Cho g = 9,8 m/s^2. Phần cơ năng bị biến thành nội năng của bóng và mặt đất chiếm tỷ lệ:",
      opts: ["30%", "70%", "3%", "43%"], correct: 1
    },
    {
      bh: "B2_LY", muc: "VanDungCao", phan: "II",
      q: "Đạn chì khối lượng m = 20 g bay với vận tốc v = 200 m/s cắm vào tấm gỗ cố định và dừng lại. Giả sử 80% động năng biến thành nội năng làm nóng viên chì (c_chì = 130 J/kg.K):",
      items: [
        { text: "a) Động năng ban đầu của viên chì là Wđ = 400 J.", correct: true },
        { text: "b) Nhiệt lượng làm nóng viên chì là Q = 320 J.", correct: true },
        { text: "c) Độ tăng nhiệt độ Δt của viên chì xấp xỉ 123,1°C.", correct: true },
        { text: "d) Toàn bộ động năng của viên chì chuyển thành cơ năng của tấm gỗ.", correct: false }
      ]
    },

    // --- BÀI 6: Định luật khí lý tưởng (Boyle, Charles) ---
    {
      bh: "B6_LY", muc: "NhanBiet", phan: "I",
      q: "Định luật Boyle áp dụng cho quá trình biến đổi trạng thái nào của khối khí xác định?",
      opts: ["Đẳng nhiệt (Nhiệt độ không đổi)", "Đẳng áp (Áp suất không đổi)", "Đẳng tích (Thể tích không đổi)", "Đoạn nhiệt"], correct: 1
    },
    {
      bh: "B6_LY", muc: "NhanBiet", phan: "I",
      q: "Trong quá trình đẳng nhiệt của một lượng khí xác định, áp suất p tỷ lệ như thế nào với thể tích V?",
      opts: ["Tỷ lệ nghịch với thể tích V (p.V = const)", "Tỷ lệ thuận với thể tích V", "Tỷ lệ với bình phương thể tích", "Không phụ thuộc vào thể tích"], correct: 1
    },
    {
      bh: "B6_LY", muc: "NhanBiet", phan: "I",
      q: "Phương trình trạng thái của khí lý tưởng là:",
      opts: ["(p1.V1) / T1 = (p2.V2) / T2", "p1.T1 / V1 = p2.T2 / V2", "p1.V1.T1 = p2.V2.T2", "p1/V1 = p2/V2"], correct: 1
    },
    {
      bh: "B6_LY", muc: "NhanBiet", phan: "II",
      q: "Xét các đặc điểm của khối khí lý tưởng:",
      items: [
        { text: "a) Các phân tử khí lý tưởng được coi là các chất điểm và chỉ tương tác khi va chạm.", correct: true },
        { text: "b) Đơn vị nhiệt độ T trong phương trình trạng thái bắt buộc tính theo thang Kelvin (K).", correct: true },
        { text: "c) Nhiệt độ Kelvin liên hệ với nhiệt độ Celsius theo công thức T(K) = t(°C) + 273.", correct: true },
        { text: "d) Trong quá trình đẳng áp, thể tích V tỷ lệ nghịch với nhiệt độ tuyệt đối T.", correct: false }
      ]
    },

    {
      bh: "B6_LY", muc: "ThongHieu", phan: "I",
      q: "Khi bóp nhẹ quả bóng cao su kín làm thể tích bóng giảm một nửa ở nhiệt độ không đổi, áp suất khí bên trong bóng thay đổi như thế nào?",
      opts: ["Tăng lên gấp đôi", "Giảm đi một nửa", "Tăng lên gấp bốn lần", "Không thay đổi"], correct: 1
    },
    {
      bh: "B6_LY", muc: "ThongHieu", phan: "I",
      q: "Đường biểu diễn quá trình đẳng nhiệt trong hệ tọa độ (p, V) có dạng là đường gì?",
      opts: ["Đường Hyperbol", "Đường thẳng đi qua gốc tọa độ", "Đường thẳng song song trục p", "Đường Parabol"], correct: 1
    },
    {
      bh: "B6_LY", muc: "ThongHieu", phan: "I",
      q: "Khi đun nóng một xilanh khí có piston tự do di chuyển (áp suất khí bên trong luôn bằng áp suất khí quyển bên ngoài), thể tích khối khí sẽ:",
      opts: ["Tăng tỷ lệ thuận với nhiệt độ tuyệt đối T (Định luật Charles)", "Giảm đi", "Không đổi", "Tăng tỷ lệ với bình phương T"], correct: 1
    },
    {
      bh: "B6_LY", muc: "ThongHieu", phan: "II",
      q: "Đánh giá các hiện tượng thực tế liên quan đến chất khí:",
      items: [
        { text: "a) Săm xe đạp bơm căng để ngoài nắng nóng dễ bị nổ do nhiệt độ tăng làm áp suất khí tăng mạnh.", correct: true },
        { text: "b) Bọt khí nổi từ đáy hồ lên mặt nước nở to dần do áp suất nước càng lên cao càng giảm.", correct: true },
        { text: "c) Khi nén khí đẳng nhiệt, đồ thị p-V là đường thẳng song song với trục hoành V.", correct: false },
        { text: "d) Không độ tuyệt đối (0 K hay -273°C) là nhiệt độ mà động năng phân tử khí bằng 0.", correct: true }
      ]
    },

    {
      bh: "B6_LY", muc: "VanDung", phan: "I",
      q: "Một khối khí có thể tích 4 lít ở áp suất 1 atm. Nén đẳng nhiệt khối khí đến thể tích 1 lít thì áp suất mới là:",
      opts: ["4 atm", "2 atm", "0,25 atm", "8 atm"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDung", phan: "I",
      q: "Một lốp xe chứa khí ở nhiệt độ 27°C và áp suất 2 atm. Khi xe chạy nóng lên đến 57°C (coi thể tích lốp không đổi), áp suất khí trong lốp là:",
      opts: ["2,2 atm", "4,2 atm", "1,8 atm", "2,5 atm"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDung", phan: "I",
      q: "Ở nhiệt độ 27°C thể tích khối khí là 6 lít. Khi đun nóng đẳng áp đến nhiệt độ 127°C, thể tích khối khí mới là:",
      opts: ["8 lít", "28 lít", "4,5 lít", "12 lít"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDung", phan: "II",
      q: "Một bình chứa 10 lít khí Oxygen ở nhiệt độ 27°C và áp suất 3 atm (1 atm = 10^5 Pa):",
      items: [
        { text: "a) Nhiệt độ tuyệt đối của khối khí là T1 = 300 K.", correct: true },
        { text: "b) Tích p1.V1 của trạng thái ban đầu là 30 atm.lít.", correct: true },
        { text: "c) Nếu nén đẳng nhiệt khí xuống thể tích 5 lít thì áp suất tăng lên thành 6 atm.", correct: true },
        { text: "d) Nếu giữ nguyên thể tích và đun nóng đến 327°C (600 K) thì áp suất tăng lên thành 12 atm.", correct: false }
      ]
    },

    {
      bh: "B6_LY", muc: "VanDungCao", phan: "I",
      q: "Một xi lanh chứa 2 mol khí lý tưởng ở áp suất p = 10^5 Pa và T = 300 K. Cho hằng số khí R = 8,31 J/mol.K. Thể tích V của khối khí xấp xỉ:",
      opts: ["0,0498 m^3 (49,8 lít)", "0,0249 m^3", "0,0996 m^3", "0,0100 m^3"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDungCao", phan: "I",
      q: "Một bong bóng khí ở đáy hồ sâu 10 m có thể tích V1. Khi bọt khí nổi lên mặt nước (áp suất khí quyển p0 = 10 m nước), coi nhiệt độ không đổi, thể tích bọt khí trên mặt nước V2 bằng:",
      opts: ["2 . V1", "3 . V1", "1,5 . V1", "4 . V1"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDungCao", phan: "I",
      q: "Bình thép chứa khí Helium ở 27°C có áp suất 50 atm. Người ta xả khí ra ngoài cho đến khi áp suất còn 20 atm ở 7°C. Phần trăm khối lượng Helium còn lại trong bình là:",
      opts: ["42,9%", "57,1%", "40,0%", "60,0%"], correct: 1
    },
    {
      bh: "B6_LY", muc: "VanDungCao", phan: "II",
      q: "Bơm không khí vào một quả bóng đá có dung lượng V = 2,5 lít. Mỗi lần bơm đưa được 100 cm^3 không khí ở áp suất 1 atm vào bóng. Ban đầu bóng chứa khí ở 1 atm:",
      items: [
        { text: "a) Thể tích 100 cm^3 bằng 0,1 lít.", correct: true },
        { text: "b) Để áp suất bóng đạt 2,5 atm (ở nhiệt độ không đổi), tổng lượng khí trong bóng tương đương 6,25 lít ở 1 atm.", correct: true },
        { text: "c) Lượng khí cần bơm thêm vào bóng là 3,75 lít ở 1 atm.", correct: true },
        { text: "d) Số lần bơm cần thiết là 38 lần.", correct: true }
      ]
    },

    // --- BÀI 11: Cấu trúc hạt nhân và Năng lượng liên kết ---
    {
      bh: "B11_LY", muc: "NhanBiet", phan: "I",
      q: "Hạt nhân nguyên tử được cấu tạo từ các hạt nucleon nào?",
      opts: ["Proton và Neutron", "Proton và Electron", "Neutron và Electron", "Chỉ gồm Proton"], correct: 1
    },
    {
      bh: "B11_LY", muc: "NhanBiet", phan: "I",
      q: "Ký hiệu hạt nhân  Z^A X thì A đại diện cho thông số nào?",
      opts: ["Số khối (Tổng số proton và neutron)", "Số hiệu nguyên tử (Số proton)", "Số neutron", "Khối lượng nguyên tử tính theo gram"], correct: 1
    },
    {
      bh: "B11_LY", muc: "NhanBiet", phan: "I",
      q: "Đại lượng đặc trưng cho mức độ bền vững của một hạt nhân là:",
      opts: ["Năng lượng liên kết riêng (E_lk / A)", "Năng lượng liên kết toàn phần", "Độ hẫng khối Δm", "Số khối A"], correct: 1
    },
    {
      bh: "B11_LY", muc: "NhanBiet", phan: "II",
      q: "Xét các đặc điểm của hạt nhân nguyên tử:",
      items: [
        { text: "a) Lực hạt nhân là lực hút giữa các nucleon trong phạm vi kích thước hạt nhân (10^-15 m).", correct: true },
        { text: "b) Lực hạt nhân thuộc loại lực tĩnh điện coulomb giữa các điện tích.", correct: false },
        { text: "c) Khối lượng hạt nhân luôn nhỏ hơn tổng khối lượng của các nucleon tự do cấu tạo nên nó.", correct: true },
        { text: "d) Đơn vị khối lượng nguyên tử u có giá trị xấp xỉ 1,66.10^-27 kg.", correct: true }
      ]
    },

    {
      bh: "B11_LY", muc: "ThongHieu", phan: "I",
      q: "Các đồng vị của cùng một yếu tố hóa học có đặc điểm nào sau đây?",
      opts: ["Cùng số proton Z nhưng khác số neutron N (dẫn đến khác số khối A)", "Cùng số neutron N nhưng khác số proton Z", "Cùng số khối A nhưng khác số proton Z", "Cùng thuộc tính vật lý nhưng khác số electron"], correct: 1
    },
    {
      bh: "B11_LY", muc: "ThongHieu", phan: "I",
      q: "Hiện tượng độ hẫng khối Δm của hạt nhân được giải thích bởi công thức nào của Einstein?",
      opts: ["E = m.c^2 (Năng lượng nghỉ liên hệ với khối lượng)", "E = h.f", "F = m.a", "p = m.v"], correct: 1
    },
    {
      bh: "B11_LY", muc: "ThongHieu", phan: "I",
      q: "Hạt nhân nào sau đây có năng lượng liên kết riêng lớn nhất và bền vững nhất trong tự nhiên?",
      opts: ["Các hạt nhân có số khối trung bình (A từ 50 đến 95 như Fe, Ni)", "Hạt nhân rất nhẹ như Deuterium 1^2 H", "Hạt nhân rất nặng như Uranium 92^238 U", "Hạt nhân Helium 2^4 He"], correct: 1
    },
    {
      bh: "B11_LY", muc: "ThongHieu", phan: "II",
      q: "Đánh giá các đặc tính liên kết hạt nhân:",
      items: [
        { text: "a) Độ hẫng khối được tính theo công thức Δm = Z.m_p + (A - Z).m_n - m_hn.", correct: true },
        { text: "b) Năng lượng liên kết hạt nhân E_lk = Δm . c^2.", correct: true },
        { text: "c) Hạt nhân có năng lượng liên kết E_lk càng lớn thì chắc chắn càng bền vững hơn.", correct: false },
        { text: "d) 1 u tương đương năng lượng nghỉ xấp xỉ 931,5 MeV.", correct: true }
      ]
    },

    {
      bh: "B11_LY", muc: "VanDung", phan: "I",
      q: "Hạt nhân 2^4 He (Alpha) có m_He = 4,0015 u. Cho m_p = 1,0073 u, m_n = 1,0087 u. Độ hẫng khối Δm của hạt He là:",
      opts: ["0,0305 u", "0,0145 u", "0,0205 u", "0,0405 u"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDung", phan: "I",
      q: "Tính năng lượng liên kết của hạt nhân Helium 2^4 He biết độ hẫng khối Δm = 0,0305 u và 1 u = 931,5 MeV.",
      opts: ["28,41 MeV", "14,20 MeV", "7,10 MeV", "56,82 MeV"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDung", phan: "I",
      q: "Tính năng lượng liên kết riêng của hạt nhân 2^4 He có năng lượng liên kết E_lk = 28,4 MeV:",
      opts: ["7,10 MeV/nucleon", "14,2 MeV/nucleon", "28,4 MeV/nucleon", "3,55 MeV/nucleon"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDung", phan: "II",
      q: "Cho hạt nhân Carbon 6^12 C có khối lượng m_C = 12,0000 u. Biết m_p = 1,00728 u và m_n = 1,00866 u:",
      items: [
        { text: "a) Hạt nhân 6^12 C gồm 6 proton và 6 neutron.", correct: true },
        { text: "b) Tổng khối lượng các nucleon riêng rẽ là m_tổng = 12,09564 u.", correct: true },
        { text: "c) Độ hẫng khối Δm = 0,09564 u.", correct: true },
        { text: "d) Năng lượng liên kết riêng của hạt nhân Carbon 6^12 C xấp xỉ 7,42 MeV/nucleon (với 1 u = 931,5 MeV).", correct: true }
      ]
    },

    {
      bh: "B11_LY", muc: "VanDungCao", phan: "I",
      q: "Cho hai hạt nhân X (A1 = 56, E_lk1 = 492 MeV) và Y (A2 = 235, E_lk2 = 1786 MeV). So sánh độ bền vững giữa hai hạt nhân:",
      opts: ["Hạt nhân X bền vững hơn Y vì năng lượng liên kết riêng E_lk1/A1 (8,78 MeV) > E_lk2/A2 (7,60 MeV)", "Hạt nhân Y bền vững hơn X vì E_lk2 lớn hơn", "Hai hạt nhân bền vững như nhau", "Không so sánh được"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDungCao", phan: "I",
      q: "Biết khối lượng của hạt proton m_p = 1,007276 u, neutron m_n = 1,008665 u và hạt nhân 17^35 Cl là 34,95952 u. Năng lượng tỏa ra khi tổng hợp được 1 mol hạt nhân 17^35 Cl từ các nucleon là:",
      opts: ["2,78.10^12 J", "2,89.10^11 J", "1,54.10^9 J", "4,21.10^13 J"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDungCao", phan: "I",
      q: "Biết 1 eV = 1,6.10^-19 J. Năng lượng tỏa ra khi tạo thành 1 hạt alpha là 28,3 MeV tương đương với giá trị nào?",
      opts: ["4,528.10^-12 J", "2,83.10^-13 J", "4,528.10^-19 J", "1,60.10^-13 J"], correct: 1
    },
    {
      bh: "B11_LY", muc: "VanDungCao", phan: "II",
      q: "Xét phản ứng nhiệt hạch kết hợp hai hạt nhân Deuterium 1^2 H thành hạt nhân Helium 2^4 He. Cho m_D = 2,0136 u, m_He = 4,0015 u:",
      items: [
        { text: "a) Tổng khối lượng hai hạt nhân trước phản ứng là 4,0272 u.", correct: true },
        { text: "b) Độ giảm khối lượng của phản ứng là Δm = 0,0257 u.", correct: true },
        { text: "c) Phản ứng tỏa ra năng lượng ΔE = 0,0257 . 931,5 MeV ≈ 23,94 MeV.", correct: true },
        { text: "d) Phản ứng nhiệt hạch là phản ứng thu năng lượng.", correct: false }
      ]
    }
  ];

  let addedCount = 0;

  for (const qObj of questionTemplates) {
    const bhId = baiHocDbMap[qObj.bh];
    if (!bhId) continue;

    const mucDoId = levelMap[qObj.muc];

    if (qObj.phan === "I") {
      const { data: qData, error: qErr } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bhId, phan: "I", muc_do_id: mucDoId,
        noi_dung: `<p><strong>Câu hỏi Vật lí (${qObj.muc}).</strong> ${qObj.q}</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (!qErr) {
        addedCount++;
        const details = qObj.opts.map((opt, idx) => ({
          cau_hoi_id: qData.cau_hoi_id, thu_tu: idx + 1, noi_dung: opt, la_dap_an_dung: (idx + 1) === qObj.correct
        }));
        await supabase.from("chi_tiet_cau_hoi").insert(details);
      }
    } else if (qObj.phan === "II") {
      const { data: qData, error: qErr } = await supabase.from("cau_hoi").insert({
        bai_hoc_id: bhId, phan: "II", muc_do_id: mucDoId,
        noi_dung: `<p><strong>Câu hỏi Đúng/Sai Vật lí (${qObj.muc}).</strong> ${qObj.q}</p>`,
        trang_thai_duyet: "DaDuyet", trang_thai_su_dung: "ChuaDung"
      }).select("cau_hoi_id").single();

      if (!qErr) {
        addedCount++;
        const details = qObj.items.map((sub, idx) => ({
          cau_hoi_id: qData.cau_hoi_id, thu_tu: idx + 1, noi_dung: sub.text, la_dap_an_dung: sub.correct
        }));
        await supabase.from("chi_tiet_cau_hoi").insert(details);
      }
    }
  }

  console.log(`\n🎉 THÀNH CÔNG: Đã khởi tạo Khung Chuyên đề/Bài học và chèn thành công ${addedCount} câu hỏi chuẩn 4 mức độ nhận thức cho môn VẬT LÍ!`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
