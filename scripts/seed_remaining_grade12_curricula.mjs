import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const b = (number, title) => ({ code: `B${number}`, title: `Bài ${number}. ${title}` });

const curricula = [
  {
    subject: "Hóa học",
    topics: [
      ["Chương 1. Ester - Lipid", [b(1, "Ester - Lipid"), b(2, "Xà phòng và chất giặt rửa"), b(3, "Ôn tập chương 1")]],
      ["Chương 2. Carbohydrate", [b(4, "Giới thiệu về carbohydrate. Glucose và fructose"), b(5, "Saccharose và maltose"), b(6, "Tinh bột và cellulose"), b(7, "Ôn tập chương 2")]],
      ["Chương 3. Hợp chất chứa nitrogen", [b(8, "Amine"), b(9, "Amino acid và peptide"), b(10, "Protein và enzyme"), b(11, "Ôn tập chương 3")]],
      ["Chương 4. Polymer", [b(12, "Đại cương về polymer"), b(13, "Vật liệu polymer"), b(14, "Ôn tập chương 4")]],
      ["Chương 5. Pin điện và điện phân", [b(15, "Thế điện cực và nguồn điện hóa học"), b(16, "Điện phân"), b(17, "Ôn tập chương 5")]],
      ["Chương 6. Đại cương về kim loại", [b(18, "Cấu tạo và liên kết trong tinh thể kim loại"), b(19, "Tính chất vật lí và tính chất hóa học của kim loại"), b(20, "Kim loại trong tự nhiên và phương pháp tách kim loại"), b(21, "Hợp kim"), b(22, "Sự ăn mòn kim loại"), b(23, "Ôn tập chương 6")]],
      ["Chương 7. Nguyên tố nhóm IA và nhóm IIA", [b(24, "Nguyên tố nhóm IA"), b(25, "Nguyên tố nhóm IIA"), b(26, "Ôn tập chương 7")]],
      ["Chương 8. Sơ lược về dãy kim loại chuyển tiếp thứ nhất và phức chất", [b(27, "Đại cương về kim loại chuyển tiếp dãy thứ nhất"), b(28, "Sơ lược về phức chất"), b(29, "Một số tính chất và ứng dụng của phức chất"), b(30, "Ôn tập chương 8")]],
    ],
  },
  {
    subject: "Sinh học",
    topics: [
      ["Chương 1. Di truyền phân tử", [b(1, "DNA và cơ chế tái bản DNA"), b(2, "Gene, quá trình truyền đạt thông tin di truyền và hệ gene"), b(3, "Điều hòa biểu hiện gene"), b(4, "Đột biến gene"), b(5, "Công nghệ gene"), b(6, "Thực hành tách chiết DNA")]],
      ["Chương 2. Di truyền nhiễm sắc thể", [b(7, "Cấu trúc và chức năng của nhiễm sắc thể"), b(8, "Học thuyết di truyền Mendel"), b(9, "Mở rộng học thuyết Mendel"), b(10, "Di truyền giới tính và di truyền liên kết với giới tính"), b(11, "Liên kết gene và hoán vị gene"), b(12, "Đột biến nhiễm sắc thể"), b(13, "Di truyền học người và di truyền y học"), b(14, "Thực hành: Quan sát một số dạng đột biến nhiễm sắc thể")]],
      ["Chương 3. Mở rộng học thuyết di truyền nhiễm sắc thể", [b(15, "Di truyền gene ngoài nhân"), b(16, "Tương tác giữa kiểu gene với môi trường và thành tựu chọn giống"), b(17, "Thực hành: Thí nghiệm về thường biến ở cây trồng")]],
      ["Chương 4. Di truyền quần thể", [b(18, "Di truyền học quần thể")]],
      ["Chương 5. Bằng chứng và các học thuyết tiến hóa", [b(19, "Các bằng chứng tiến hóa"), b(20, "Quan điểm của Darwin về chọn lọc tự nhiên và hình thành loài"), b(21, "Học thuyết tiến hóa tổng hợp hiện đại"), b(22, "Tiến hóa lớn và quá trình phát sinh chủng loại")]],
      ["Chương 6. Môi trường và sinh thái học quần thể", [b(23, "Môi trường và các nhân tố sinh thái"), b(24, "Sinh thái học quần thể"), b(25, "Thực hành: Xác định một số đặc trưng của quần thể")]],
      ["Chương 7. Sinh thái học quần xã", [b(26, "Quần xã sinh vật"), b(27, "Thực hành: Tìm hiểu một số đặc trưng cơ bản của quần xã trong tự nhiên"), b(28, "Hệ sinh thái"), b(29, "Trao đổi vật chất và chuyển hóa năng lượng trong hệ sinh thái"), b(30, "Diễn thế sinh thái"), b(31, "Sinh quyển, khu sinh học và chu trình sinh - địa - hóa"), b(32, "Thực hành: Thiết kế một hệ sinh thái nhân tạo")]],
      ["Chương 8. Sinh thái học phục hồi, bảo tồn và phát triển bền vững", [b(33, "Sinh thái học phục hồi và bảo tồn đa dạng sinh vật"), b(34, "Phát triển bền vững"), b(35, "Dự án: Tìm hiểu thực trạng bảo tồn và phục hồi hệ sinh thái tại địa phương, đề xuất giải pháp bảo tồn")]],
    ],
  },
  {
    subject: "Địa lí",
    topics: [
      ["Phần 1. Địa lí tự nhiên", [b(1, "Vị trí địa lí và phạm vi lãnh thổ"), b(2, "Thiên nhiên nhiệt đới ẩm gió mùa"), b(3, "Sự phân hóa đa dạng của thiên nhiên"), b(4, "Thực hành: Viết báo cáo về sự phân hóa tự nhiên Việt Nam"), b(5, "Vấn đề sử dụng hợp lí tài nguyên thiên nhiên và bảo vệ môi trường")]],
      ["Phần 2. Địa lí dân cư", [b(6, "Dân số Việt Nam"), b(7, "Lao động và việc làm"), b(8, "Đô thị hóa"), b(9, "Thực hành: Viết báo cáo về một chủ đề dân cư Việt Nam")]],
      ["Phần 3. Địa lí các ngành kinh tế", [b(10, "Chuyển dịch cơ cấu kinh tế"), b(11, "Vấn đề phát triển ngành nông nghiệp"), b(12, "Vấn đề phát triển ngành lâm nghiệp và ngành thủy sản"), b(13, "Tổ chức lãnh thổ nông nghiệp"), b(14, "Thực hành: Tìm hiểu vai trò ngành nông nghiệp, lâm nghiệp và thủy sản; vẽ biểu đồ và nhận xét"), b(15, "Chuyển dịch cơ cấu ngành công nghiệp"), b(16, "Một số ngành công nghiệp"), b(17, "Tổ chức lãnh thổ công nghiệp"), b(18, "Thực hành: Vẽ biểu đồ, nhận xét và giải thích tình hình phát triển ngành công nghiệp"), b(19, "Vai trò, các nhân tố ảnh hưởng đến sự phát triển và phân bố các ngành dịch vụ"), b(20, "Giao thông vận tải và bưu chính viễn thông"), b(21, "Thương mại và du lịch"), b(22, "Thực hành: Tìm hiểu sự phát triển một số ngành dịch vụ")]],
      ["Phần 4. Địa lí các vùng kinh tế", [b(23, "Khai thác thế mạnh ở trung du và miền núi Bắc Bộ"), b(24, "Phát triển kinh tế - xã hội ở đồng bằng sông Hồng"), b(25, "Phát triển nông nghiệp, lâm nghiệp và thủy sản ở Bắc Trung Bộ"), b(26, "Phát triển kinh tế biển ở duyên hải Nam Trung Bộ"), b(27, "Thực hành: Ý nghĩa của phát triển kinh tế biển đối với quốc phòng an ninh ở duyên hải Nam Trung Bộ"), b(28, "Khai thác thế mạnh để phát triển kinh tế ở Tây Nguyên"), b(29, "Phát triển kinh tế - xã hội ở Đông Nam Bộ"), b(30, "Sử dụng hợp lí tự nhiên để phát triển kinh tế ở đồng bằng sông Cửu Long"), b(31, "Thực hành: Viết báo cáo về biến đổi khí hậu ở đồng bằng sông Cửu Long"), b(32, "Phát triển các vùng kinh tế trọng điểm"), b(33, "Phát triển kinh tế và đảm bảo an ninh quốc phòng ở Biển Đông và các đảo, quần đảo"), b(34, "Thực hành: Viết báo cáo tuyên truyền về bảo vệ chủ quyền biển, đảo của Việt Nam")]],
      ["Phần 5. Địa lí địa phương", [b(35, "Thực hành: Tìm hiểu địa lí địa phương")]],
    ],
  },
  {
    subject: "Giáo dục kinh tế và pháp luật",
    topics: [
      ["Chủ đề 1. Tăng trưởng và phát triển kinh tế", [b(1, "Tăng trưởng và phát triển kinh tế")]],
      ["Chủ đề 2. Hội nhập kinh tế quốc tế", [b(2, "Hội nhập kinh tế quốc tế")]],
      ["Chủ đề 3. Bảo hiểm và an sinh xã hội", [b(3, "Bảo hiểm"), b(4, "An sinh xã hội")]],
      ["Chủ đề 4. Lập kế hoạch kinh doanh", [b(5, "Lập kế hoạch kinh doanh")]],
      ["Chủ đề 5. Trách nhiệm xã hội của doanh nghiệp", [b(6, "Trách nhiệm xã hội của doanh nghiệp")]],
      ["Chủ đề 6. Quản lí thu, chi trong gia đình", [b(7, "Quản lí thu chi trong gia đình")]],
      ["Chủ đề 7. Một số quyền và nghĩa vụ của công dân về kinh tế", [b(8, "Quyền và nghĩa vụ của công dân về kinh doanh và nộp thuế"), b(9, "Quyền và nghĩa vụ của công dân về sở hữu tài sản và nghĩa vụ tôn trọng tài sản của người khác")]],
      ["Chủ đề 8. Quyền và nghĩa vụ của công dân về văn hóa, xã hội", [b(10, "Quyền và nghĩa vụ của công dân trong hôn nhân và gia đình"), b(11, "Quyền và nghĩa vụ của công dân trong học tập"), b(12, "Quyền và nghĩa vụ của công dân trong bảo vệ, chăm sóc sức khỏe và bảo đảm an sinh xã hội"), b(13, "Quyền và nghĩa vụ của công dân trong bảo vệ di sản văn hoá, môi trường và tài nguyên thiên nhiên")]],
      ["Chủ đề 9. Một số vấn đề cơ bản của luật quốc tế", [b(14, "Một số vấn đề chung về pháp luật quốc tế"), b(15, "Nguyên tắc cơ bản của Tổ chức Thương mại Thế giới và hợp đồng thương mại quốc tế"), b(16, "Công pháp quốc tế về dân cư, lãnh thổ và chủ quyền quốc gia")]],
    ],
  },
  {
    subject: "Ngữ Văn",
    topics: [
      ["Bài 1. Khả năng lớn lao của tiểu thuyết", [b(1, "Xuân Tóc Đỏ cứu quốc"), b(2, "Mùa lá rụng trong vườn"), b(3, "Biện pháp tu từ nói mỉa, nghịch ngữ"), b(4, "Nghị luận so sánh, đánh giá hai tác phẩm truyện")]],
      ["Bài 2. Những thế giới thơ", [b(5, "Cảm hoài"), b(6, "Tây Tiến"), b(7, "Đàn ghi ta của Lor-ca"), b(8, "Nghị luận so sánh, đánh giá hai tác phẩm thơ")]],
      ["Bài 3. Lập luận trong văn bản nghị luận", [b(9, "Nhìn về vốn văn hóa dân tộc"), b(10, "Năng lực sáng tạo"), b(11, "Mấy ý nghĩ về thơ"), b(12, "Lỗi logic, lỗi câu mơ hồ và cách sửa"), b(13, "Nghị luận về một vấn đề liên quan đến tuổi trẻ")]],
      ["Bài 4. Yếu tố kì ảo trong truyện kể", [b(14, "Hải khẩu linh từ"), b(15, "Muối của rừng"), b(16, "Nghệ thuật sử dụng điển cố"), b(17, "Nghị luận về vay mượn, cải biến, sáng tạo trong tác phẩm văn học")]],
      ["Bài 5. Tiếng cười của hài kịch", [b(18, "Nhân vật quan trọng"), b(19, "Giấu của"), b(20, "Báo cáo nghiên cứu về một vấn đề tự nhiên, xã hội")]],
      ["Bài 6. Hồ Chí Minh - Văn hóa phải soi đường cho quốc dân đi", [b(21, "Tác gia Hồ Chí Minh"), b(22, "Tuyên ngôn độc lập"), b(23, "Mộ và Nguyên tiêu"), b(24, "Những trò lố hay là Va-ren và Phan Bội Châu"), b(25, "Biện pháp tăng tính khẳng định, phủ định trong văn bản nghị luận")]],
      ["Bài 7. Sự thật trong tác phẩm kí", [b(26, "Nghệ thuật băm thịt gà"), b(27, "Bước vào đời"), b(28, "Ngôn ngữ trang trọng và ngôn ngữ thân mật"), b(29, "Nghị luận về cách ứng xử trong các mối quan hệ")]],
      ["Bài 8. Dữ liệu trong văn bản thông tin", [b(30, "Pa-ra-na"), b(31, "Giáo dục khai phóng Việt Nam nhìn từ Đông Kinh Nghĩa Thục"), b(32, "Đời muối"), b(33, "Tôn trọng và bảo vệ quyền sở hữu trí tuệ"), b(34, "Viết thư trao đổi về công việc hoặc vấn đề đáng quan tâm")]],
      ["Bài 9. Văn học và cuộc đời", [b(35, "Vội vàng"), b(36, "Trở về"), b(37, "Hồn Trương Ba, da hàng thịt"), b(38, "Giữ gìn và phát triển tiếng Việt"), b(39, "Viết bài phát biểu trong lễ phát động một phong trào hoặc hoạt động xã hội")]],
    ],
  },
];

async function upsertCurriculum({ subject, topics }) {
  const { data: subjectRows, error: subjectError } = await supabase
    .from("mon")
    .select("mon_id, ten_mon")
    .ilike("ten_mon", subject)
    .eq("trang_thai", "DangDung");
  if (subjectError) throw subjectError;
  if (subjectRows.length !== 1) throw new Error(`Không tìm thấy duy nhất một môn: ${subject}`);

  const subjectId = subjectRows[0].mon_id;
  for (let index = 0; index < topics.length; index += 1) {
    const [topicTitle, lessons] = topics[index];
    const topicCode = `CD${index + 1}`;
    const { data: existingTopic, error: findTopicError } = await supabase
      .from("chuyen_de")
      .select("chuyen_de_id")
      .eq("mon_id", subjectId)
      .ilike("ma_chuyen_de", topicCode)
      .maybeSingle();
    if (findTopicError) throw findTopicError;
    const topicQuery = existingTopic
      ? supabase.from("chuyen_de").update({ ten_chuyen_de: topicTitle, trang_thai: "DangDung" }).eq("chuyen_de_id", existingTopic.chuyen_de_id)
      : supabase.from("chuyen_de").insert({ mon_id: subjectId, ma_chuyen_de: topicCode, ten_chuyen_de: topicTitle, trang_thai: "DangDung" });
    const { data: topic, error: topicError } = await topicQuery
      .select("chuyen_de_id")
      .single();
    if (topicError) throw topicError;

    const rows = lessons.map((lesson) => ({
      chuyen_de_id: topic.chuyen_de_id,
      ma_bai_hoc: lesson.code,
      ten_bai_hoc: lesson.title,
      trang_thai: "DangDung",
    }));
    await Promise.all(rows.map(async (row) => {
      const { data: existingLesson, error: findLessonError } = await supabase
        .from("bai_hoc")
        .select("bai_hoc_id")
        .eq("chuyen_de_id", topic.chuyen_de_id)
        .ilike("ma_bai_hoc", row.ma_bai_hoc)
        .maybeSingle();
      if (findLessonError) throw findLessonError;
      const lessonQuery = existingLesson
        ? supabase.from("bai_hoc").update({ ten_bai_hoc: row.ten_bai_hoc, trang_thai: "DangDung" }).eq("bai_hoc_id", existingLesson.bai_hoc_id)
        : supabase.from("bai_hoc").insert(row);
      const { error: lessonError } = await lessonQuery;
      if (lessonError) throw lessonError;
    }));
  }
  return { subject, topics: topics.length, lessons: topics.reduce((sum, [, lessons]) => sum + lessons.length, 0) };
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Thiếu cấu hình Supabase trong môi trường.");
}

const results = await Promise.all(curricula.map(upsertCurriculum));
for (const result of results) {
  console.log(JSON.stringify(result));
}
