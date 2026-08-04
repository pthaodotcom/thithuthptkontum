import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== THÊM 10 CÂU HỎI ĐÚNG/SAI (PHẦN II) - CHỦ ĐỀ 1 - MỨC ĐỘ THÔNG HIỂU ===");

  // 1. Lấy thông tin môn Tin học
  const { data: monList } = await supabase
    .from("mon")
    .select("mon_id")
    .ilike("ten_mon", "Tin học")
    .eq("trang_thai", "DangDung");

  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Tin học");
    process.exit(1);
  }
  const monId = monList[0].mon_id;

  // 2. Lấy mức độ Thông hiểu (thu_tu = 2)
  const { data: mucDoList } = await supabase
    .from("muc_do_nhan_thuc")
    .select("muc_do_id, ten_muc, thu_tu")
    .order("thu_tu", { ascending: true });

  const thongHieuObj = mucDoList?.find(m => m.thu_tu === 2 || m.ten_muc.includes("Thông hiểu")) || mucDoList?.[1] || mucDoList?.[0];
  const levelThongHieu = thongHieuObj.muc_do_id;

  // 3. Lấy Bài học thuộc Chủ đề 1 (B1, B2)
  const { data: cd1List } = await supabase
    .from("chuyen_de")
    .select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de, bai_hoc(bai_hoc_id, ma_bai_hoc, ten_bai_hoc)")
    .eq("mon_id", monId)
    .or("ma_chuyen_de.eq.CD1,ten_chuyen_de.ilike.%Chủ đề 1%");

  if (!cd1List || cd1List.length === 0) {
    console.error("Không tìm thấy Chủ đề 1 môn Tin học");
    process.exit(1);
  }

  const baiHocList = cd1List[0].bai_hoc || [];
  const bh1 = baiHocList.find(b => b.ma_bai_hoc === "B1")?.bai_hoc_id || baiHocList[0]?.bai_hoc_id;
  const bh2 = baiHocList.find(b => b.ma_bai_hoc === "B2")?.bai_hoc_id || bh1;

  const questions = [
    {
      bhId: bh1,
      q: "Xét các phát biểu về khả năng tự học và xử lý dữ liệu của các hệ thống Trí tuệ nhân tạo (AI):",
      items: [
        { text: "a) Hệ thống AI có thể tự rút ra quy luật từ tập dữ liệu huấn luyện mà không cần con người lập trình cứng từng quy tắc.", correct: true },
        { text: "b) Khi chất lượng dữ liệu đầu vào bị sai lệch hoặc thiếu sót, mô hình AI vẫn luôn đưa ra kết quả chính xác 100%.", correct: false },
        { text: "c) Học máy (Machine Learning) là một lĩnh vực con của AI tập trung vào việc phát triển các thuật toán giúp máy tính học từ dữ liệu.", correct: true },
        { text: "d) Quá trình huấn luyện một mô hình AI lớn (như LLM) đòi hỏi tài nguyên tính toán và năng lượng rất lớn.", correct: true }
      ]
    },
    {
      bhId: bh2,
      q: "Khi phân tích các ứng dụng của AI trong Y tế và Chăm sóc sức khỏe:",
      items: [
        { text: "a) Thuật toán thị giác máy tính giúp phân tích ảnh chụp X-quang, MRI để hỗ trợ bác sĩ chẩn đoán khối u sớm.", correct: true },
        { text: "b) Hệ thống AI y tế có thể thay thế hoàn toàn bác sĩ trong việc chịu trách nhiệm pháp lý đối với tính mạng bệnh nhân.", correct: false },
        { text: "c) AI có khả năng phân tích chuỗi gen và cấu trúc protein để tăng tốc độ phát minh thuốc mới.", correct: true },
        { text: "d) Dữ liệu hồ sơ bệnh án dùng để huấn luyện AI không cần tuân thủ bất kỳ quy định nào về bảo mật thông tin cá nhân.", correct: false }
      ]
    },
    {
      bhId: bh2,
      q: "Xét các phát biểu về ứng dụng AI trong Giao thông vận tải và Xe tự lái:",
      items: [
        { text: "a) Xe tự lái kết hợp nhiều loại cảm biến như Camera, LiDAR và Radar để nhận biết môi trường xung quanh.", correct: true },
        { text: "b) Xe tự lái hoạt động hoàn toàn dựa vào sóng vô tuyến định vị từ xa mà không cần xử lý dữ liệu tại chỗ.", correct: false },
        { text: "c) AI hỗ trợ hệ thống giao thông thông minh bằng cách phân tích lưu lượng xe để điều phối đèn giao thông theo thời gian thực.", correct: true },
        { text: "d) Khi xảy ra tai nạn do xe tự lái gây ra, việc xác định trách nhiệm pháp lý giữa nhà sản xuất và người dùng là một thách thức lớn.", correct: true }
      ]
    },
    {
      bhId: bh2,
      q: "Khi đánh giá tác động của AI đối với Thị trường lao động và Việc làm trong xã hội hiện đại:",
      items: [
        { text: "a) AI và tự động hóa có thể thay thế một số công việc có tính chất lặp đi lặp lại hoặc nguy hiểm cho con người.", correct: true },
        { text: "b) Sự phát triển của AI chỉ làm mất đi việc làm chứ không bao giờ tạo ra bất kỳ ngành nghề hay vị trí công việc mới nào.", correct: false },
        { text: "c) Lao động trong kỷ nguyên AI cần liên tục nâng cao kỹ năng số và khả năng tư duy phản biện để thích ứng.", correct: true },
        { text: "d) AI chỉ hỗ trợ các ngành kỹ thuật công nghệ, hoàn toàn không có tác động gì đến ngành giáo dục hay nghệ thuật.", correct: false }
      ]
    },
    {
      bhId: bh1,
      q: "Xét các nhận định về Trí tuệ nhân tạo tạo sinh (Generative AI) và các mô hình ngôn ngữ lớn (LLM):",
      items: [
        { text: "a) Generative AI có khả năng tạo ra văn bản, đoạn mã lập trình, hình ảnh và âm thanh mới dựa trên mẫu dữ liệu học được.", correct: true },
        { text: "b) Các câu trả lời do ChatGPT hoặc Gemini tạo ra luôn là sự thật tuyệt đối và không bao giờ bị hiện tượng ảo giác (hallucination).", correct: false },
        { text: "c) Học sinh, sinh viên cần kiểm chứng thông tin trước khi sử dụng các văn bản do AI tạo ra làm tài liệu nghiên cứu.", correct: true },
        { text: "d) Việc sử dụng nội dung do AI tạo ra để nộp bài làm mà không xin phép hoặc ghi rõ nguồn có thể vi phạm quy định đạo đức học thuật.", correct: true }
      ]
    },
    {
      bhId: bh1,
      q: "Khi xem xét các khía cạnh về Đạo đức AI (AI Ethics) và Bản quyền trí tuệ:",
      items: [
        { text: "a) Thuật toán AI có thể nảy sinh sự thiên lệch (bias) nếu dữ liệu huấn luyện phản ánh các định kiến xã hội vốn có.", correct: true },
        { text: "b) Mọi tác phẩm nghệ thuật do AI tự động tạo ra 100% đều tự động được pháp luật cấp bản quyền tác giả cho chính phần mềm AI đó.", correct: false },
        { text: "c) Việc thu thập dữ liệu cá nhân quy mô lớn để huấn luyện AI nếu không xin phép sẽ vi phạm quyền riêng tư.", correct: true },
        { text: "d) Phát tán video hoặc hình ảnh giả mạo khuôn mặt (Deepfake) để lừa đảo là hành vi vi phạm pháp luật nghiêm trọng.", correct: true }
      ]
    },
    {
      bhId: bh2,
      q: "Đánh giá các phát biểu về ứng dụng của AI trong Tài chính - Ngân hàng và Thương mại điện tử:",
      items: [
        { text: "a) Hệ thống ngân hàng sử dụng AI để phát hiện các giao dịch gian lận bất thường theo thời gian thực.", correct: true },
        { text: "b) AI phân tích lịch sử mua sắm của khách hàng để gợi ý các sản phẩm phù hợp trên các sàn thương mại điện tử.", correct: true },
        { text: "c) Chatbot ngân hàng ứng dụng xử lý ngôn ngữ tự nhiên để hỗ trợ giải đáp thắc mắc của khách hàng 24/7.", correct: true },
        { text: "d) Điểm tín dụng cá nhân do AI tính toán hoàn toàn dựa trên cảm xúc của nhân viên tư vấn ngân hàng.", correct: false }
      ]
    },
    {
      bhId: bh1,
      q: "Xét các phát biểu về Xử lý ngôn ngữ tự nhiên (NLP) và nhận dạng giọng nói:",
      items: [
        { text: "a) NLP giúp máy tính hiểu, phân tích và tổng hợp ngôn ngữ tự nhiên của con người dạng văn bản hoặc giọng nói.", correct: true },
        { text: "b) Phần mềm dịch tự động như Google Translate hoạt động dựa trên các mô hình dịch máy thông minh ứng dụng học sâu (Deep Learning).", correct: true },
        { text: "c) Nhận dạng giọng nói cho phép người dùng điều khiển thiết bị thông minh bằng câu lệnh nói mà không cần bàn phím.", correct: true },
        { text: "d) Công nghệ NLP hiện nay đã hoàn toàn vượt qua khả năng hiểu ngữ cảnh văn hóa tinh tế của con người trong mọi ngôn ngữ.", correct: false }
      ]
    },
    {
      bhId: bh1,
      q: "Khi phân tích công nghệ Thị giác máy tính (Computer Vision):",
      items: [
        { text: "a) Computer Vision cho phép máy tính thu nhận, xử lý và hiểu thông tin từ hình ảnh hoặc video kỹ thuật số.", correct: true },
        { text: "b) Công nghệ nhận diện khuôn mặt trên điện thoại thông minh là một ứng dụng điển hình của thị giác máy tính.", correct: true },
        { text: "c) Thị giác máy tính chỉ hoạt động được trên ảnh đen trắng, hoàn toàn không xử lý được video có màu.", correct: false },
        { text: "d) Trong dây chuyền sản xuất công nghiệp, thị giác máy tính giúp tự động phát hiện sản phẩm bị lỗi ngoại quan.", correct: true }
      ]
    },
    {
      bhId: bh2,
      q: "Đánh giá về xu hướng phát triển và vai trò của Trí tuệ nhân tạo đối với Xã hội tri thức:",
      items: [
        { text: "a) AI là một trong những công nghệ cốt lõi của cuộc Cách mạng công nghiệp lần thứ tư (4.0).", correct: true },
        { text: "b) Việc phát triển AI trách nhiệm (Responsible AI) đòi hỏi sự minh bạch, an toàn và công bằng cho mọi người dùng.", correct: true },
        { text: "c) Con người nên phụ thuộc hoàn toàn vào quyết định của AI trong mọi tình huống nguy hiểm mà không cần sự can thiệp của con người.", correct: false },
        { text: "d) Xã hội tri thức tận dụng AI như một công cụ hỗ trợ con người nâng cao năng suất và giải quyết các bài toán phức tạp.", correct: true }
      ]
    }
  ];

  let insertedCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const qItem = questions[i];

    // Chèn câu hỏi Phần II
    const { data: qData, error: qErr } = await supabase
      .from("cau_hoi")
      .insert({
        bai_hoc_id: qItem.bhId,
        phan: "II",
        muc_do_id: levelThongHieu,
        noi_dung: `<p><strong>Câu ${i + 1} (Chủ đề 1 - Thông hiểu).</strong> ${qItem.q}</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      })
      .select("cau_hoi_id")
      .single();

    if (qErr) {
      console.error(`Lỗi chèn câu ${i + 1}:`, qErr.message);
      continue;
    }

    const qId = qData.cau_hoi_id;

    // Chèn 4 ý a, b, c, d
    const details = qItem.items.map((sub, idx) => ({
      cau_hoi_id: qId,
      thu_tu: idx + 1,
      noi_dung: sub.text,
      la_dap_an_dung: sub.correct
    }));

    const { error: dtErr } = await supabase
      .from("chi_tiet_cau_hoi")
      .insert(details);

    if (dtErr) {
      console.error(`Lỗi chèn chi tiết câu ${i + 1}:`, dtErr.message);
    } else {
      insertedCount++;
      console.log(`✅ Đã chèn thành công câu Đ/S ${i + 1} (Chủ đề 1 - Thông hiểu)`);
    }
  }

  console.log(`\n🎉 HOÀN THÀNH: Đã thêm thành công ${insertedCount} / 10 câu Trắc nghiệm Đúng/Sai (Phần II) cho Chủ đề 1 ở mức độ Thông hiểu!`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
