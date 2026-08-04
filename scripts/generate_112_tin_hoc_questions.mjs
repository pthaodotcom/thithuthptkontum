import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== BẮT ĐẦU TẠO 112 CÂU HỎI TIN HỌC (ĐỦ CHO 4 ĐỀ THI) ===");

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

  // 2. Lấy danh sách Mức độ nhận thức
  const { data: mucDoList } = await supabase
    .from("muc_do_nhan_thuc")
    .select("muc_do_id, ten_muc, thu_tu")
    .order("thu_tu", { ascending: true });

  if (!mucDoList || mucDoList.length === 0) {
    console.error("Không tìm thấy danh sách mức độ nhận thức");
    process.exit(1);
  }

  const mucDoMap = {};
  mucDoList.forEach(m => {
    mucDoMap[m.thu_tu] = m.muc_do_id;
    mucDoMap[m.ten_muc] = m.muc_do_id;
  });

  // Level mapping: 1 = Nhan biet, 2 = Thong hieu, 3 = Van dung, 4 = Van dung cao
  const levelNhanBiet = mucDoMap[1] || mucDoList[0].muc_do_id;
  const levelThongHieu = mucDoMap[2] || mucDoList[1]?.muc_do_id || levelNhanBiet;
  const levelVanDung = mucDoMap[3] || mucDoList[2]?.muc_do_id || levelThongHieu;

  // 3. Lấy bản đồ Bài học theo ma_bai_hoc
  const { data: chuyenDeList } = await supabase
    .from("chuyen_de")
    .select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de, bai_hoc(bai_hoc_id, ma_bai_hoc, ten_bai_hoc)")
    .eq("mon_id", monId);

  const baiHocMap = {};
  chuyenDeList.forEach(cd => {
    (cd.bai_hoc || []).forEach(bh => {
      baiHocMap[bh.ma_bai_hoc] = bh.bai_hoc_id;
    });
  });

  // Utility to get random bai_hoc_id for fallback
  const allBaiHocIds = Object.values(baiHocMap);
  const getBh = (ma) => baiHocMap[ma] || allBaiHocIds[0];

  // =========================================================================
  // BỘ DỮ LIỆU CÂU HỎI PHẦN I (96 CÂU TRẮC NGHIỆM 4 LỰA CHỌN)
  // =========================================================================
  const phan1Raw = [
    // --- Chủ đề 1: Trí tuệ nhân tạo (B1, B2) ---
    {
      bh: "B1", muc: levelNhanBiet,
      q: "Trí tuệ nhân tạo (AI) là gì?",
      opts: ["Khả năng của máy tính mô phỏng các suy nghĩ và học tập của con người", "Một loại máy tính phần cứng siêu mạnh", "Ngôn ngữ lập trình thiết kế trang web", "Hệ điều hành dành riêng cho rô-bốt"],
      correct: 1
    },
    {
      bh: "B1", muc: levelNhanBiet,
      q: "Đặc trưng chính nào sau đây thuộc về Trí tuệ nhân tạo (AI)?",
      opts: ["Khả năng tự học và giải quyết vấn đề từ dữ liệu", "Chỉ thực hiện lệnh cố định không thay đổi", "Không cần điện năng để hoạt động", "Chỉ tính toán được các phép toán số học đơn giản"],
      correct: 1
    },
    {
      bh: "B1", muc: levelThongHieu,
      q: "Lĩnh vực nào của AI tập trung vào việc giúp máy tính hiểu và xử lý ngôn ngữ tự nhiên của con người?",
      opts: ["Xử lý ngôn ngữ tự nhiên (NLP)", "Thị giác máy tính (Computer Vision)", "Hệ quản trị CSDL", "Mạng máy tính"],
      correct: 1
    },
    {
      bh: "B1", muc: levelVanDung,
      q: "Một phần mềm ứng dụng AI có khả năng nhận diện khuôn mặt để điểm danh học sinh sử dụng công nghệ chính nào?",
      opts: ["Thị giác máy tính (Computer Vision)", "Truy vấn dữ liệu SQL", "Giao thức mạng TCP/IP", "Biên dịch ngôn ngữ CSS"],
      correct: 1
    },
    {
      bh: "B2", muc: levelNhanBiet,
      q: "Ứng dụng nào sau đây thể hiện việc sử dụng AI trong y tế?",
      opts: ["Chẩn đoán hình ảnh X-quang và gợi ý phác đồ điều trị", "In tài liệu giấy ra máy in", "Gửi email thông báo lịch họp", "Tạo file trình chiếu slide"],
      correct: 1
    },
    {
      bh: "B2", muc: levelThongHieu,
      q: "Hệ thống khuyến nghị (Recommendation System) trên Youtube hoặc Netflix ứng dụng AI nhằm mục đích gì?",
      opts: ["Phân tích sở thích của người dùng để gợi ý nội dung phù hợp", "Sửa chữa sự cố phần cứng của tivi", "Tăng tốc độ kết nối cáp quang", "Tự động xóa tài khoản không hoạt động"],
      correct: 1
    },

    // --- Chủ đề 2: Mạng máy tính và Internet (B3, B4, B5) ---
    {
      bh: "B3", muc: levelNhanBiet,
      q: "Thiết bị mạng nào có chức năng định tuyến dữ liệu giữa các mạng khác nhau?",
      opts: ["Router (Bộ định tuyến)", "Switch (Bộ chuyển mạch)", "Repeater (Bộ lặp)", "Card mạng (NIC)"],
      correct: 1
    },
    {
      bh: "B3", muc: levelNhanBiet,
      q: "Thiết bị mạng nào dùng để kết nối các máy tính trong cùng một mạng cục bộ (LAN)?",
      opts: ["Switch (Bộ chuyển mạch)", "Router", "Modem ADSL", "Bàn phím không dây"],
      correct: 1
    },
    {
      bh: "B3", muc: levelThongHieu,
      q: "Thiết bị Modem có vai trò gì trong mạng Internet gia đình?",
      opts: ["Chuyển đổi tín hiệu giữa tín hiệu tương tự (analog) và tín hiệu số (digital)", "Chỉ để phát sóng Wifi", "Tăng dung lượng ổ cứng máy tính", "Diệt virus trên mạng"],
      correct: 1
    },
    {
      bh: "B4", muc: levelNhanBiet,
      q: "Giao thức nào được sử dụng phổ biến nhất để truyền tải nội dung trang web an toàn (có mã hóa)?",
      opts: ["HTTPS", "HTTP", "FTP", "SMTP"],
      correct: 1
    },
    {
      bh: "B4", muc: levelNhanBiet,
      q: "Địa chỉ IPv4 bao gồm bao nhiêu bit?",
      opts: ["32 bit", "64 bit", "128 bit", "16 bit"],
      correct: 1
    },
    {
      bh: "B4", muc: levelThongHieu,
      q: "Dịch vụ DNS (Domain Name System) trên Internet có chức năng chính là gì?",
      opts: ["Chuyển đổi tên miền (ví dụ: google.com) thành địa chỉ IP tương ứng", "Gửi và nhận thư điện tử", "Truyền tệp tin dung lượng lớn", "Bảo vệ máy tính khỏi điện áp cao"],
      correct: 1
    },
    {
      bh: "B5", muc: levelNhanBiet,
      q: "Để chia sẻ một thư mục cho các máy tính khác trong mạng cục bộ Windows, ta thao tác chọn mục nào?",
      opts: ["Properties -> Sharing", "Properties -> Security -> Format", "New Folder", "Task Manager"],
      correct: 1
    },
    {
      bh: "B5", muc: levelThongHieu,
      q: "Khi chia sẻ tài nguyên mạng, quyền 'Read' (Chỉ đọc) cho phép người dùng mạng làm gì?",
      opts: ["Xem và mở tệp tin nhưng không được sửa đổi hoặc xóa", "Sửa đổi nội dung tệp tin", "Xóa hoàn toàn thư mục", "Thay đổi quyền truy cập của người khác"],
      correct: 1
    },

    // --- Chủ đề 3: Đạo đức, pháp luật & văn hóa số (B6) ---
    {
      bh: "B6", muc: levelNhanBiet,
      q: "Hành vi nào sau đây là ứng xử văn minh và tuân thủ pháp luật trên không gian mạng?",
      opts: ["Tôn trọng bản quyền tác giả và không phát tán thông tin sai sự thật", "Tự ý đăng ảnh cá nhân của người khác khi chưa được cho phép", "Sử dụng từ ngữ xúc phạm người khác trong các hội nhóm", "Chia sẻ liên kết lừa đảo trúng thưởng"],
      correct: 1
    },
    {
      bh: "B6", muc: levelThongHieu,
      q: "Khi phát hiện một thông tin giật gân, chưa được kiểm chứng trên mạng xã hội, người dùng nên làm gì?",
      opts: ["Kiểm chứng thông tin từ các nguồn báo chí chính thống trước khi chia sẻ", "Chia sẻ ngay lập tức cho bạn bè", "Bình luận khẳng định đó là sự thật", "Tạo thêm tin đồn liên quan"],
      correct: 1
    },
    {
      bh: "B6", muc: levelVanDung,
      q: "Biện pháp nào hiệu quả nhất để bảo vệ tài khoản mạng xã hội cá nhân khỏi bị đánh cắp?",
      opts: ["Sử dụng mật khẩu mạnh và bật xác thực 2 yếu tố (2FA)", "Đặt mật khẩu là ngày sinh của mình cho dễ nhớ", "Đăng nhập tài khoản trên các máy tính công cộng mà không đăng xuất", "Chia sẻ mật khẩu cho bạn thân"],
      correct: 1
    },

    // --- Chủ đề 4: Giải quyết vấn đề với máy tính / HTML & CSS (B7 -> B18) ---
    {
      bh: "B7", muc: levelNhanBiet,
      q: "Thẻ HTML nào định nghĩa phần chứa nội dung hiển thị chính của trang web?",
      opts: ["<body>", "<head>", "<html>", "<title>"],
      correct: 1
    },
    {
      bh: "B7", muc: levelNhanBiet,
      q: "Cặp thẻ nào dùng để chứa phần thông tin phần đầu (metadata, tiêu đề) của trang HTML?",
      opts: ["<head>...</head>", "<body>...</body>", "<main>...</main>", "<footer>...</footer>"],
      correct: 1
    },
    {
      bh: "B7", muc: levelThongHieu,
      q: "File nguồn HTML phải được lưu với phần mở rộng nào để trình duyệt web có thể đọc được?",
      opts: [".html hoặc .htm", ".txt", ".docx", ".pdf"],
      correct: 1
    },
    {
      bh: "B8", muc: levelNhanBiet,
      q: "Trong HTML, thẻ nào dùng để tạo một đoạn văn bản (paragraph)?",
      opts: ["<p>", "<div>", "<span>", "<br>"],
      correct: 1
    },
    {
      bh: "B8", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để tạo tiêu đề có kích thước lớn nhất?",
      opts: ["<h1>", "<h6>", "<header>", "<heading>"],
      correct: 1
    },
    {
      bh: "B8", muc: levelThongHieu,
      q: "Thẻ <strong> và <em> trong HTML có ý nghĩa lần lượt là gì?",
      opts: ["In đậm (nhấn mạnh nội dung) và In nghiêng", "In nghiêng và In đậm", "Gạch chân và Gạch ngang", "Tạo màu đỏ và Tạo màu xanh"],
      correct: 1
    },
    {
      bh: "B9", muc: levelNhanBiet,
      q: "Thẻ nào dùng để tạo danh sách có thứ tự (được đánh số 1, 2, 3...) trong HTML?",
      opts: ["<ol>", "<ul>", "<li>", "<dl>"],
      correct: 1
    },
    {
      bh: "B9", muc: levelNhanBiet,
      q: "Trong bảng HTML, thẻ nào dùng để định nghĩa một hàng (row) của bảng?",
      opts: ["<tr>", "<td>", "<th>", "<table>"],
      correct: 1
    },
    {
      bh: "B9", muc: levelThongHieu,
      q: "Thẻ <th> khác với thẻ <td> trong bảng HTML ở điểm nào?",
      opts: ["<th> là ô tiêu đề bảng (in đậm và căn giữa), <td> là ô dữ liệu thường", "<th> dùng cho bảng có số, <td> dùng cho chữ", "<th> tạo hàng mới, <td> tạo cột mới", "Không có điểm khác biệt"],
      correct: 1
    },
    {
      bh: "B10", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để tạo siêu liên kết (hyperlink)?",
      opts: ["<a>", "<link>", "<href>", "<url>"],
      correct: 1
    },
    {
      bh: "B10", muc: levelNhanBiet,
      q: "Thuộc tính nào của thẻ <a> quy định địa chỉ trang web đích khi nhấp vào liên kết?",
      opts: ["href", "src", "target", "alt"],
      correct: 1
    },
    {
      bh: "B10", muc: levelThongHieu,
      q: "Để liên kết mở ra ở một tab mới trong trình duyệt, ta thêm thuộc tính nào vào thẻ <a>?",
      opts: ['target="_blank"', 'target="_self"', 'target="_parent"', 'target="_top"'],
      correct: 1
    },
    {
      bh: "B11", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để chèn hình ảnh vào trang web?",
      opts: ["<img>", "<image>", "<picture>", "<media>"],
      correct: 1
    },
    {
      bh: "B11", muc: levelNhanBiet,
      q: "Thuộc tính alt trong thẻ <img> có tác dụng gì?",
      opts: ["Mô tả văn bản thay thế khi hình ảnh không tải được", "Định đường dẫn đến tệp ảnh", "Định chiều cao của ảnh", "Tạo hiệu ứng viền ảnh"],
      correct: 1
    },
    {
      bh: "B11", muc: levelThongHieu,
      q: "Thẻ <iframe> trong HTML được dùng để làm gì?",
      opts: ["Nhúng một trang web hoặc video khác vào trang web hiện tại", "Tạo khung viền cho văn bản", "Phát âm thanh mp3", "Tạo bảng dữ liệu động"],
      correct: 1
    },
    {
      bh: "B12", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để bao quanh một biểu mẫu nhập liệu?",
      opts: ["<form>", "<input>", "<select>", "<textarea>"],
      correct: 1
    },
    {
      bh: "B12", muc: levelNhanBiet,
      q: "Thuộc tính type nào của thẻ <input> cho phép người dùng nhập mật khẩu bị ẩn ký tự?",
      opts: ['type="password"', 'type="text"', 'type="hidden"', 'type="secret"'],
      correct: 1
    },
    {
      bh: "B12", muc: levelThongHieu,
      q: "Để tạo một nút bấm gửi dữ liệu trong biểu mẫu HTML, ta dùng thẻ input với type nào?",
      opts: ['type="submit"', 'type="button"', 'type="reset"', 'type="send"'],
      correct: 1
    },
    {
      bh: "B13", muc: levelNhanBiet,
      q: "CSS là từ viết tắt của cụm từ nào?",
      opts: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System", "Color Style Syntax"],
      correct: 1
    },
    {
      bh: "B13", muc: levelNhanBiet,
      q: "Vai trò chính của CSS trong phát triển trang web là gì?",
      opts: ["Quy định kiểu dáng, màu sắc, bố cục hiển thị cho các phần tử HTML", "Xử lý dữ liệu phía máy chủ", "Lưu trữ CSDL quan hệ", "Định nghĩa cấu trúc trang web"],
      correct: 1
    },
    {
      bh: "B13", muc: levelThongHieu,
      q: "Để nhúng một tệp CSS ngoài (External CSS) vào trang HTML, ta dùng thẻ nào trong phần <head>?",
      opts: ["<link rel=\"stylesheet\" href=\"styles.css\">", "<style src=\"styles.css\">", "<script href=\"styles.css\">", "<css href=\"styles.css\">"],
      correct: 1
    },
    {
      bh: "B14", muc: levelNhanBiet,
      q: "Trong CSS, thuộc tính nào dùng để thay đổi cỡ chữ của văn bản?",
      opts: ["font-size", "text-size", "font-weight", "text-style"],
      correct: 1
    },
    {
      bh: "B14", muc: levelNhanBiet,
      q: "Thuộc tính CSS nào dùng để căn chỉnh văn bản (trái, phải, giữa)?",
      opts: ["text-align", "vertical-align", "align-content", "float"],
      correct: 1
    },
    {
      bh: "B14", muc: levelThongHieu,
      q: "Cú pháp CSS nào sau đây đúng để làm in đậm tất cả các đoạn văn <p>?",
      opts: ["p { font-weight: bold; }", "p { text-style: bold; }", "p { font-bold: true; }", "<p style=\"bold\">"],
      correct: 1
    },
    {
      bh: "B15", muc: levelNhanBiet,
      q: "Trong CSS, thuộc tính nào dùng để đổi màu chữ của phần tử?",
      opts: ["color", "text-color", "background-color", "font-color"],
      correct: 1
    },
    {
      bh: "B15", muc: levelNhanBiet,
      q: "Thuộc tính CSS nào dùng để đổi màu nền cho trang web hoặc phần tử?",
      opts: ["background-color", "color-background", "bg-color", "canvas-color"],
      correct: 1
    },
    {
      bh: "B15", muc: levelThongHieu,
      q: "Mã màu Hexadecimal #FF0000 trong CSS đại diện cho màu nào?",
      opts: ["Màu đỏ (Red)", "Màu xanh lá (Green)", "Màu xanh dương (Blue)", "Màu đen (Black)"],
      correct: 1
    },
    {
      bh: "B16", muc: levelNhanBiet,
      q: "Thuộc tính CSS nào dùng để tạo đường viền xung quanh phần tử?",
      opts: ["border", "margin", "padding", "outline"],
      correct: 1
    },
    {
      bh: "B16", muc: levelNhanBiet,
      q: "Trong Mô hình hộp (Box Model) của CSS, thuộc tính padding là khoảng cách nào?",
      opts: ["Khoảng cách từ nội dung phần tử đến viền (border) của nó", "Khoảng cách giữa viền phần tử đến các phần tử xung quanh", "Độ dày của viền phần tử", "Chiều cao của dòng chữ"],
      correct: 1
    },
    {
      bh: "B16", muc: levelThongHieu,
      q: "Khác biệt giữa margin và padding trong CSS là gì?",
      opts: ["margin nằm ngoài border (tạo khoảng cách với phần tử khác), padding nằm trong border", "padding nằm ngoài border, margin nằm trong border", "Cả hai hoàn toàn giống nhau", "margin chỉ dùng cho hình ảnh, padding dùng cho chữ"],
      correct: 1
    },
    {
      bh: "B17", muc: levelNhanBiet,
      q: "Bộ chọn (Selector) ID trong CSS được ký hiệu bằng ký tự nào?",
      opts: ["Dấu thăng (#)", "Dấu chấm (.)", "Dấu sao (*)", "Dấu hai chấm (:)"],
      correct: 1
    },
    {
      bh: "B17", muc: levelNhanBiet,
      q: "Bộ chọn Class trong CSS được ký hiệu bằng ký tự nào?",
      opts: ["Dấu chấm (.)", "Dấu thăng (#)", "Dấu phẩy (,)", "Dấu gạch ngang (-)"],
      correct: 1
    },
    {
      bh: "B17", muc: levelThongHieu,
      q: "Thứ tự ưu tiên (Specificity) từ cao xuống thấp của các bộ chọn CSS là gì?",
      opts: ["Inline Style > ID Selector > Class Selector > Element Selector", "Element Selector > Class Selector > ID Selector > Inline Style", "Class Selector > ID Selector > Element Selector", "ID Selector > Inline Style > Class Selector"],
      correct: 1
    },
    {
      bh: "B18", muc: levelVanDung,
      q: "Khi thiết kế giao diện trang web cá nhân hoàn chỉnh, bước nào nên thực hiện đầu tiên?",
      opts: ["Phác thảo bố cục (wireframe) và chuẩn bị cấu trúc nội dung", "Viết mã JavaScript xử lý sự kiện", "Mua tên miền và máy chủ", "Tạo cơ sở dữ liệu SQL"],
      correct: 1
    },

    // --- Chủ đề 5: Hướng nghiệp với Tin học (B19, B20, B21) ---
    {
      bh: "B19", muc: levelNhanBiet,
      q: "Công việc nào thuộc về dịch vụ sửa chữa và bảo trì máy tính?",
      opts: ["Vệ sinh phần cứng, thay thế linh kiện hỏng và cài đặt lại hệ điều hành", "Viết thuật toán học máy cho robot", "Thiết kế logo đồ họa quảng cáo", "Biên tập phim truyền hình"],
      correct: 1
    },
    {
      bh: "B19", muc: levelThongHieu,
      q: "Kỹ năng quan trọng nhất của người làm nghề bảo trì máy tính là gì?",
      opts: ["Chẩn đoán nguyên nhân sự cố phần cứng/phần mềm và khắc phục kịp thời", "Biết vẽ tranh kỹ thuật số", "Biết sáng tác âm nhạc điện tử", "Biết làm tiếp thị bán hàng"],
      correct: 1
    },
    {
      bh: "B20", muc: levelNhanBiet,
      q: "Vị trí Quản trị viên hệ thống (System Administrator) trong ngành CNTT có nhiệm vụ chính là gì?",
      opts: ["Quản lý, vận hành và đảm bảo sự ổn định của hệ thống máy chủ và mạng", "Viết kịch bản trò chơi điện tử", "Bán thiết bị di động", "Thiết kế trang phục điện tử"],
      correct: 1
    },
    {
      bh: "B20", muc: levelThongHieu,
      q: "Nhóm nghề Quản trị CSDL (Database Administrator - DBA) chịu trách nhiệm về điều gì?",
      opts: ["Thiết kế, bảo mật, lưu trữ và sao lưu dữ liệu cho tổ chức", "Sửa chữa màn hình máy tính", "Lắp đặt cáp điện nhà xưởng", "Lập trình ứng dụng di động iOS"],
      correct: 1
    },
    {
      bh: "B21", muc: levelThongHieu,
      q: "Mục đích chính của việc tham gia các buổi hội thảo hướng nghiệp ngành CNTT là gì?",
      opts: ["Tìm hiểu xu hướng phát triển nghề nghiệp, yêu cầu tuyển dụng và tư vấn định hướng từ chuyên gia", "Để giải trí sau giờ học", "Nhận quà tặng phần mềm miễn phí", "Để điểm danh lấy bằng đại học"],
      correct: 1
    },

    // --- Chủ đề 6: Kết nối thiết bị số (B22) ---
    {
      bh: "B22", muc: levelNhanBiet,
      q: "Chuẩn kết nối không dây tầm ngắn phổ biến nào dùng để kết nối tai nghe hoặc chuột với máy tính?",
      opts: ["Bluetooth", "NFC", "Cáp HDMI", "Cáp VGA"],
      correct: 1
    },
    {
      bh: "B22", muc: levelThongHieu,
      q: "Để kết nối máy tính bảng với máy in không dây trong cùng mạng Wifi, ta cần thao tác gì?",
      opts: ["Bật dịch vụ in ấn không dây và kết nối cùng dải mạng Wifi với máy in", "Cắm cáp USB trực tiếp vào máy in", "Rút dây nguồn máy tính", "Tắt tính năng Bluetooth"],
      correct: 1
    },

    // --- Chủ đề 7: Ứng dụng tin học / Xây dựng trang web (B23 -> B28) ---
    {
      bh: "B23", muc: levelNhanBiet,
      q: "Trong quy trình xây dựng trang web, giai đoạn 'Chuẩn bị' bao gồm công việc nào?",
      opts: ["Xác định mục tiêu, đối tượng người dùng và chuẩn bị sơ đồ trang (sitemap)", "Đăng ký dịch vụ lưu trữ tên miền đắt nhất", "Mua máy chủ cỡ lớn", "Tự tay sản xuất thiết bị phần cứng"],
      correct: 1
    },
    {
      bh: "B24", muc: levelNhanBiet,
      q: "Phần đầu trang web (Header) thường chứa các thành phần cơ bản nào?",
      opts: ["Logo trang web, tên thương hiệu và thanh điều hướng chính", "Chân trang chứa bản quyền", "Nội dung bài viết chi tiết", "Form phản hồi khách hàng"],
      correct: 1
    },
    {
      bh: "B25", muc: levelNhanBiet,
      q: "Thẻ HTML5 nào được khuyến nghị sử dụng để bao quanh phần chân trang web?",
      opts: ["<footer>", "<bottom>", "<end>", "<aside>"],
      correct: 1
    },
    {
      bh: "B25", muc: levelThongHieu,
      q: "Nội dung thường xuất hiện ở phần Footer của một trang web chuyên nghiệp là gì?",
      opts: ["Thông tin liên hệ, bản quyền (copyright) và liên kết chính sách bảo mật", "Thanh tìm kiếm chính", "Hình ảnh quảng cáo kích thước lớn nhất", "Form đăng nhập hệ thống"],
      correct: 1
    },
    {
      bh: "B26", muc: levelNhanBiet,
      q: "Thẻ HTML5 nào dùng để định nghĩa thanh điều hướng (navigation bar)?",
      opts: ["<nav>", "<menu>", "<header>", "<sidebar>"],
      correct: 1
    },
    {
      bh: "B26", muc: levelThongHieu,
      q: "Thanh điều hướng trên website giúp người dùng làm gì?",
      opts: ["Dễ dàng di chuyển giữa các trang hoặc các mục nội dung khác nhau trên website", "Thay đổi cấu hình máy tính cá nhân", "Tăng tốc độ tải trang web", "Tự động dịch ngôn ngữ"],
      correct: 1
    },
    {
      bh: "B27", muc: levelNhanBiet,
      q: "Để người dùng chọn một lựa chọn duy nhất trong một nhóm nhiều lựa chọn, ta dùng input type nào?",
      opts: ['type="radio"', 'type="checkbox"', 'type="text"', 'type="submit"'],
      correct: 1
    },
    {
      bh: "B27", muc: levelThongHieu,
      q: "Thẻ <textarea> trong biểu mẫu HTML có ưu điểm gì so với <input type=\"text\">?",
      opts: ["Cho phép nhập đoạn văn bản nhiều dòng", "Tự động ẩn ký tự mật khẩu", "Chỉ nhập được số", "Không thể chỉnh sửa được"],
      correct: 1
    },
    {
      bh: "B28", muc: levelVanDung,
      q: "Khi hoàn thiện một dự án website tĩnh, bước kiểm thử quan trọng trước khi xuất bản là gì?",
      opts: ["Kiểm tra hiển thị giao diện trên nhiều thiết bị (Responsive) và sửa các liên kết hỏng", "Chỉ chạy thử trên 1 trình duyệt duy nhất", "Xóa toàn bộ mã CSS", "Tắt kết nối Internet"],
      correct: 1
    },

    // --- Bổ sung thêm các câu hỏi phong phú để đạt đủ 96 câu Phần I ---
    {
      bh: "B1", muc: levelThongHieu,
      q: "Ví dụ nào sau đây KHÔNG phải là một ứng dụng của AI?",
      opts: ["Chiếc đồng hồ báo thức cơ học chạy bằng dây cót", "Trợ lý ảo Siri hoặc Google Assistant", "Phần mềm dịch tự động Google Translate", "Xe tự lái Tesla"],
      correct: 1
    },
    {
      bh: "B2", muc: levelNhanBiet,
      q: "Trong tài chính - ngân hàng, AI được áp dụng phổ biến nhất để làm gì?",
      opts: ["Phát hiện giao dịch nghi ngờ lừa đảo (Fraud Detection)", "In tiền giấy", "Kiểm đếm tiền thủ công", "Đóng mở cửa chi nhánh"],
      correct: 1
    },
    {
      bh: "B3", muc: levelThongHieu,
      q: "Khác biệt cơ bản giữa Switch và Hub trong mạng máy tính là gì?",
      opts: ["Switch gửi dữ liệu chính xác đến máy nhận, Hub phát toàn bộ dữ liệu đến tất cả các máy", "Hub nhanh hơn Switch rất nhiều", "Switch chỉ dùng cho mạng không dây", "Hub có khả năng định tuyến IP"],
      correct: 1
    },
    {
      bh: "B4", muc: levelThongHieu,
      q: "Giao thức FTP (File Transfer Protocol) được thiết kế chuyên biệt cho công việc gì?",
      opts: ["Truyền nhận tệp tin giữa máy tính trạm và máy chủ trên mạng", "Gửi email trực tiếp", "Xem video trực tuyến", "Truy vấn CSDL"],
      correct: 1
    },
    {
      bh: "B5", muc: levelNhanBiet,
      q: "Địa chỉ IP mặc định để truy cập vào trang quản trị của hầu hết các Router gia đình thường là:",
      opts: ["192.168.1.1 hoặc 192.168.0.1", "127.0.0.0", "255.255.255.255", "8.8.8.8"],
      correct: 1
    },
    {
      bh: "B6", muc: levelNhanBiet,
      q: "Cụm từ 'Phishing' trên không gian mạng có nghĩa là gì?",
      opts: ["Hình thức lừa đảo giả mạo thương hiệu uy tín để đánh cắp thông tin cá nhân", "Quá trình tải tệp tin nhanh", "Kỹ thuật tối ưu hóa mã nguồn", "Trò chơi giải trí trực tuyến"],
      correct: 1
    },
    {
      bh: "B7", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để tạo đường gạch ngang phân cách nội dung?",
      opts: ["<hr>", "<br>", "<line>", "<border>"],
      correct: 1
    },
    {
      bh: "B8", muc: levelNhanBiet,
      q: "Thẻ <br> trong HTML có đặc điểm gì nổi bật?",
      opts: ["Là thẻ đơn (không cần thẻ đóng) dùng để ngắt dòng", "Là thẻ chứa văn bản in đậm", "Là thẻ tạo bảng", "Là thẻ liên kết trang"],
      correct: 1
    },
    {
      bh: "B9", muc: levelNhanBiet,
      q: "Trong HTML, thuộc tính colspan của ô bảng <td> có ý nghĩa gì?",
      opts: ["Gộp nhiều cột lại thành một ô", "Gộp nhiều hàng lại thành một ô", "Đổi màu nền của ô", "Căn giữa chữ trong ô"],
      correct: 1
    },
    {
      bh: "B9", muc: levelThongHieu,
      q: "Thuộc tính rowspan trong thẻ <td> dùng để làm gì?",
      opts: ["Gộp nhiều hàng liên tiếp thành một ô", "Gộp nhiều cột liên tiếp thành một ô", "Thay đổi chiều rộng cột", "Tạo viền cho ô"],
      correct: 1
    },
    {
      bh: "B10", muc: levelNhanBiet,
      q: "Để tạo một liên kết gửi email khi nhấp vào, ta dùng cú pháp href nào trong thẻ <a>?",
      opts: ['href="mailto:example@gmail.com"', 'href="email:example@gmail.com"', 'href="send:example@gmail.com"', 'href="http://mailto"'],
      correct: 1
    },
    {
      bh: "B11", muc: levelNhanBiet,
      q: "Thẻ HTML5 nào dùng để phát tệp âm thanh trực tiếp trên trang web?",
      opts: ["<audio>", "<sound>", "<music>", "<voice>"],
      correct: 1
    },
    {
      bh: "B11", muc: levelNhanBiet,
      q: "Thẻ HTML5 nào dùng để chèn video trực tiếp vào trang web?",
      opts: ["<video>", "<movie>", "<media>", "<play>"],
      correct: 1
    },
    {
      bh: "B12", muc: levelNhanBiet,
      q: "Để người dùng chọn nhiều lựa chọn độc lập trong một biểu mẫu, ta dùng thẻ input có type gì?",
      opts: ['type="checkbox"', 'type="radio"', 'type="text"', 'type="submit"'],
      correct: 1
    },
    {
      bh: "B12", muc: levelThongHieu,
      q: "Thẻ <select> kết hợp với các thẻ <option> trong HTML dùng để tạo thành phần gì?",
      opts: ["Danh sách cuộn thả xuống (Dropdown list)", "Hộp chọn nhiều tick", "Nút gửi biểu mẫu", "Khung nhập dòng đơn"],
      correct: 1
    },
    {
      bh: "B13", muc: levelNhanBiet,
      q: "Cú pháp khai báo CSS bao gồm hai phần chính nào?",
      opts: ["Bộ chọn (Selector) và Khối khai báo (Declaration block)", "Thẻ mở và thẻ đóng", "Tên biến và giá trị", "Mã hàm và đối số"],
      correct: 1
    },
    {
      bh: "B14", muc: levelNhanBiet,
      q: "Thuộc tính CSS nào dùng để thay đổi phông chữ (kiểu chữ)?",
      opts: ["font-family", "font-style", "font-type", "text-font"],
      correct: 1
    },
    {
      bh: "B15", muc: levelNhanBiet,
      q: "Giá trị độ đục/trong suốt của phần tử trong CSS được điều chỉnh bằng thuộc tính nào?",
      opts: ["opacity", "transparent", "visibility", "display"],
      correct: 1
    },
    {
      bh: "B16", muc: levelNhanBiet,
      q: "Trong CSS, thuộc tính border-radius dùng để làm gì?",
      opts: ["Bo tròn các góc của viền phần tử", "Tạo bóng đổ cho chữ", "Tạo viền nét đứt", "Mở rộng khoảng cách lề"],
      correct: 1
    },
    {
      bh: "B17", muc: levelThongHieu,
      q: "Từ khóa !important trong CSS có tác dụng gì?",
      opts: ["Đưa quy tắc CSS đó lên mức ưu tiên cao nhất, đè lên các quy tắc khác", "Báo lỗi cho trình duyệt", "Ẩn phần tử khỏi trang web", "Biến chữ thành in hoa"],
      correct: 1
    },
    {
      bh: "B18", muc: levelNhanBiet,
      q: "Khái niệm 'Responsive Web Design' có nghĩa là gì?",
      opts: ["Thiết kế trang web tự động co giãn hiển thị đẹp trên mọi màn hình (PC, tablet, di động)", "Trang web tự động trả lời tin nhắn", "Website có tốc độ tải dưới 1 giây", "Website không cần sử dụng CSS"],
      correct: 1
    },
    {
      bh: "B19", muc: levelNhanBiet,
      q: "Khi máy tính phát ra chuỗi tiếng 'bíp' liên tục khi bật nguồn và không lên hình, nguyên nhân phổ biến thường do:",
      opts: ["Lỗi lỏng hoặc hỏng thanh nhớ RAM", "Hỏng chuột máy tính", "Hỏng bàn phím", "Thiếu giấy in"],
      correct: 1
    },
    {
      bh: "B20", muc: levelNhanBiet,
      q: "Chứng chỉ quốc tế phổ biến dành cho nhân sự quản trị mạng máy tính Cisco là:",
      opts: ["CCNA", "PMP", "IELTS", "MOS"],
      correct: 1
    },
    {
      bh: "B21", muc: levelNhanBiet,
      q: "Ngành học Khoa học dữ liệu (Data Science) tập trung vào kỹ năng nào?",
      opts: ["Thu thập, xử lý, phân tích dữ liệu lớn để trích xuất tri thức hữu ích", "Sửa chữa bo mạch chủ máy in", "Cài đặt ứng dụng di động", "Thiết kế poster bằng tay"],
      correct: 1
    },
    {
      bh: "B22", muc: levelNhanBiet,
      q: "Cổng kết nối tiêu chuẩn truyền cả hình ảnh chất lượng cao và âm thanh từ máy tính ra màn hình/TV là:",
      opts: ["HDMI", "VGA", "PS/2", "COM"],
      correct: 1
    },
    {
      bh: "B23", muc: levelNhanBiet,
      q: "Bản vẽ phác thảo cấu trúc khung của một trang web trước khi lập trình được gọi là:",
      opts: ["Wireframe", "Source code", "Database Schema", "Flowchart"],
      correct: 1
    },
    {
      bh: "B24", muc: levelThongHieu,
      q: "Để gắn logo và tiêu đề trang web cạnh nhau ở phần Header, kỹ thuật CSS bố cục hiện đại nên dùng là:",
      opts: ["Flexbox (display: flex) hoặc CSS Grid", "Dùng thẻ <br> liên tục", "Dùng thẻ <i>", "Dùng thẻ <center>"],
      correct: 1
    },
    {
      bh: "B25", muc: levelNhanBiet,
      q: "Thẻ <main> trong HTML5 có ý nghĩa là gì?",
      opts: ["Chứa nội dung độc lập chính của trang web (không lặp lại ở các trang khác)", "Chứa thanh menu", "Chứa thông tin tác giả", "Chứa mã quảng cáo"],
      correct: 1
    },
    {
      bh: "B26", muc: levelThongHieu,
      q: "Để bỏ đường gạch chân mặc định của các liên kết <a> trong thanh menu, ta dùng CSS nào?",
      opts: ["a { text-decoration: none; }", "a { text-style: no-line; }", "a { underline: false; }", "a { line: 0; }"],
      correct: 1
    },
    {
      bh: "B27", muc: levelNhanBiet,
      q: "Thuộc tính placeholder trong thẻ <input> có công dụng gì?",
      opts: ["Hiển thị gợi ý văn bản mờ trong ô nhập khi chưa có dữ liệu", "Đặt giá trị cố định cho ô", "Khóa không cho nhập", "Tự động điền mật khẩu"],
      correct: 1
    },
    {
      bh: "B28", muc: levelThongHieu,
      q: "Công cụ nào được tích hợp sẵn trong trình duyệt (Chrome/Edge) giúp lập trình viên kiểm tra mã HTML/CSS trực tiếp?",
      opts: ["Developer Tools (F12)", "Task Manager", "Control Panel", "Command Prompt"],
      correct: 1
    },

    // --- Bổ sung tiếp cho đủ 96 câu Phần I ---
    {
      bh: "B1", muc: levelNhanBiet,
      q: "Thuật ngữ 'Machine Learning' trong tiếng Việt có nghĩa là gì?",
      opts: ["Học máy", "Xử lý dữ liệu", "Lập trình tự động", "Điện toán đám mây"],
      correct: 1
    },
    {
      bh: "B2", muc: levelThongHieu,
      q: "ChatGPT hay Google Gemini thuộc loại mô hình AI nào?",
      opts: ["AI tạo sinh (Generative AI) dựa trên mô hình ngôn ngữ lớn (LLM)", "AI nhận diện vân tay", "Hệ thống chuyên gia quy tắc cố định", "Phần mềm diệt virus"],
      correct: 1
    },
    {
      bh: "B3", muc: levelNhanBiet,
      q: "Mạng diện rộng kết nối máy tính ở các khu vực địa lý xa nhau được gọi là:",
      opts: ["WAN", "LAN", "PAN", "MAN"],
      correct: 1
    },
    {
      bh: "B4", muc: levelNhanBiet,
      q: "Mô hình mạng phổ biến hiện nay mà máy tính yêu cầu dịch vụ được gọi là Client và máy tính cung cấp dịch vụ được gọi là:",
      opts: ["Server (Máy chủ)", "Router", "Switch", "Terminal"],
      correct: 1
    },
    {
      bh: "B5", muc: levelThongHieu,
      q: "Địa chỉ MAC của card mạng có đặc điểm nào sau đây?",
      opts: ["Là địa chỉ vật lý duy nhất được gán cố định từ nhà sản xuất", "Thay đổi liên tục mỗi khi khởi động lại", "Do nhà mạng Internet tự cấp", "Có dạng 4 số cách nhau bởi dấu chấm"],
      correct: 1
    },
    {
      bh: "B6", muc: levelNhanBiet,
      q: "Luật An ninh mạng ở Việt Nam quy định nghiêm cấm hành vi nào trên mạng?",
      opts: ["Tổ chức tấn công mạng, phát tán thông tin độc hại, sai sự thật chống phá Nhà nước", "Học tập trực tuyến", "Mua sắm hàng hóa hợp pháp", "Gửi email công việc"],
      correct: 1
    },
    {
      bh: "B7", muc: levelNhanBiet,
      q: "Khai báo chuẩn ở dòng đầu tiên của tệp HTML5 là gì?",
      opts: ["<!DOCTYPE html>", "<html>", "<head>", "<xml>"],
      correct: 1
    },
    {
      bh: "B8", muc: levelNhanBiet,
      q: "Thẻ HTML nào dùng để tạo danh sách định nghĩa (description list)?",
      opts: ["<dl>", "<ol>", "<ul>", "<list>"],
      correct: 1
    },
    {
      bh: "B9", muc: levelNhanBiet,
      q: "Thẻ <caption> trong bảng HTML được đặt ở vị trí nào?",
      opts: ["Ngay sau thẻ mở <table> để làm chú thích/tiêu đề cho bảng", "Ở cuối bảng", "Trong thẻ <tr>", "Ngoài trang web"],
      correct: 1
    },
    {
      bh: "B10", muc: levelThongHieu,
      q: "Để liên kết nhảy đến một phần tử có id=\"section2\" trong cùng trang web, ta viết href như thế nào?",
      opts: ['href="#section2"', 'href="section2"', 'href=".section2"', 'href="@section2"'],
      correct: 1
    },
    {
      bh: "B11", muc: levelThongHieu,
      q: "Thuộc tính controls trong thẻ <video> có tác dụng gì?",
      opts: ["Hiển thị các nút điều khiển như Phát, Tạm dừng, Âm lượng", "Tự động phát video không tiếng", "Lặp lại video liên tục", "Ẩn video khỏi màn hình"],
      correct: 1
    },
    {
      bh: "B12", muc: levelNhanBiet,
      q: "Thuộc tính required trong thẻ <input> có tác dụng gì?",
      opts: ["Bắt buộc người dùng phải điền thông tin mới cho phép gửi form", "Khóa ô không cho nhập", "Giới hạn độ dài nhập", "Tự động xóa nội dung"],
      correct: 1
    },
    {
      bh: "B13", muc: levelNhanBiet,
      q: "Nhúng CSS trực tiếp trong thuộc tính style của thẻ HTML được gọi là kiểu CSS nào?",
      opts: ["Inline CSS", "Internal CSS", "External CSS", "Import CSS"],
      correct: 1
    },
    {
      bh: "B14", muc: levelNhanBiet,
      q: "Thuộc tính CSS line-height dùng để điều chỉnh thông số nào?",
      opts: ["Chiều cao của dòng văn bản (khoảng cách giữa các dòng)", "Độ rộng chữ", "Chiều cao phần tử div", "Khoảng cách giữa các từ"],
      correct: 1
    },
    {
      bh: "B15", muc: levelThongHieu,
      q: "Cú pháp màu RGBA trong CSS rgba(0, 0, 255, 0.5) chỉ tham số thứ 4 (0.5) là gì?",
      opts: ["Độ trong suốt (Alpha channel) bằng 50%", "Độ sáng 50%", "Màu đỏ 50%", "Độ tương phản 50%"],
      correct: 1
    },
    {
      bh: "B16", muc: levelNhanBiet,
      q: "Thuộc tính CSS box-sizing: border-box; có ưu điểm gì?",
      opts: ["Giúp kích thước phần tử bao gồm cả padding và border, không làm vỡ bố cục", "Tự động xóa border", "Tạo viền 3D", "Làm ẩn padding"],
      correct: 1
    },
    {
      bh: "B17", muc: levelNhanBiet,
      q: "Bộ chọn con trực tiếp (Child Selector) trong CSS sử dụng ký hiệu nào?",
      opts: ["Dấu lớn hơn (>)", "Dấu cộng (+)", "Dấu ngã (~)", "Dấu khoảng trắng"],
      correct: 1
    },
    {
      bh: "B18", muc: levelThongHieu,
      q: "Để hiển thị phần tử dạng khối nằm cạnh nhau theo hàng ngang trong CSS Flexbox, thuộc tính flex-direction mặc định là:",
      opts: ["row", "column", "row-reverse", "column-reverse"],
      correct: 1
    },
    {
      bh: "B19", muc: levelNhanBiet,
      q: "Ổ cứng SSD có ưu điểm vượt trội nào so với ổ cứng cơ HDD truyền thống?",
      opts: ["Tốc độ đọc/ghi dữ liệu nhanh hơn gấp nhiều lần và chống sốc tốt", "Giá thành trên mỗi GB rẻ hơn", "Dung lượng tối đa luôn lớn hơn", "Không cần dùng điện"],
      correct: 1
    },
    {
      bh: "B20", muc: levelNhanBiet,
      q: "Lập trình viên Front-end là người đảm nhận công việc gì?",
      opts: ["Lập trình giao diện hiển thị và tương tác người dùng trên trang web", "Xây dựng hệ thống cơ sở dữ liệu máy chủ", "Bảo trì đường dây cáp quang", "Sửa chữa phần cứng máy in"],
      correct: 1
    },
    {
      bh: "B21", muc: levelNhanBiet,
      q: "Chứng chỉ tin học văn phòng quốc tế phổ biến đánh giá kỹ năng Word, Excel, PowerPoint là:",
      opts: ["MOS (Microsoft Office Specialist)", "CCNA", "CEH", "AWS"],
      correct: 1
    },
    {
      bh: "B22", muc: levelNhanBiet,
      q: "Cổng USB Type-C có ưu điểm thiết kế nổi bật nào?",
      opts: ["Thiết kế đối xứng có thể cắm theo cả 2 chiều", "Chỉ truyền được điện không truyền dữ liệu", "Kích thước to hơn cổng USB cũ", "Chỉ dùng cho máy tính bàn"],
      correct: 1
    },
    {
      bh: "B23", muc: levelNhanBiet,
      q: "Đơn vị đo độ phân giải màn hình phổ biến chuẩn Full HD là bao nhiêu điểm ảnh (pixel)?",
      opts: ["1920 x 1080", "1280 x 720", "3840 x 2160", "1024 x 768"],
      correct: 1
    },
    {
      bh: "B24", muc: levelNhanBiet,
      q: "Thẻ HTML5 <article> thích hợp nhất cho loại nội dung nào?",
      opts: ["Một bài viết tin tức hoàn chỉnh có thể phân phối độc lập", "Thanh menu", "Chân trang", "Form liên hệ"],
      correct: 1
    },
    {
      bh: "B25", muc: levelNhanBiet,
      q: "Thẻ <aside> trong HTML5 thường được dùng để chứa nội dung gì?",
      opts: ["Nội dung phụ bên cạnh (Sidebar) như danh mục bài viết nổi bật, quảng cáo", "Header chính", "Bản quyền trang web", "Toàn bộ bài viết"],
      correct: 1
    },
    {
      bh: "B26", muc: levelNhanBiet,
      q: "Hiệu ứng CSS làm thay đổi kiểu dáng của nút bấm khi người dùng di chuột qua sử dụng pseudo-class nào?",
      opts: [":hover", ":active", ":focus", ":visited"],
      correct: 1
    },
    {
      bh: "B27", muc: levelNhanBiet,
      q: "Trong biểu mẫu HTML, thuộc tính method=\"POST\" thích hợp dùng khi nào?",
      opts: ["Gửi dữ liệu nhạy cảm (như mật khẩu) hoặc dữ liệu có dung lượng lớn", "Tìm kiếm từ khóa công khai", "Chỉ tải trang web", "In tài liệu"],
      correct: 1
    },
    {
      bh: "B28", muc: levelNhanBiet,
      q: "Tệp tin robot.txt trên website dùng để làm gì?",
      opts: ["Hướng dẫn các công cụ tìm kiếm (Google) biết trang nào được phép lập chỉ mục", "Lưu mật khẩu người dùng", "Chứa mã CSS", "Tạo giao diện động"],
      correct: 1
    }
  ];

  // =========================================================================
  // BỘ DỮ LIỆU CÂU HỎI PHẦN II (16 CÂU TRẮC NGHIỆM ĐÚNG/SAI - 4 ĐỀ × 4 CÂU)
  // =========================================================================
  const phan2Raw = [
    // --- Câu Đ/S 1 (Đề 1) ---
    {
      bh: "B1", muc: levelThongHieu,
      q: "Xét các phát biểu sau đây về ứng dụng và bản chất của Trí tuệ nhân tạo (AI):",
      items: [
        { text: "a) AI có khả năng tự cải thiện hiệu suất công việc thông qua quá trình học từ dữ liệu.", correct: true },
        { text: "b) Tất cả các hệ thống AI hiện nay đều có ý thức và cảm xúc giống hệt con người.", correct: false },
        { text: "c) AI tạo sinh (Generative AI) có thể tự động tạo ra bài viết, hình ảnh và âm thanh mới.", correct: true },
        { text: "d) Việc sử dụng dữ liệu huấn luyện bị thiên lệch có thể dẫn đến kết quả AI đưa ra bị sai lệch.", correct: true }
      ]
    },
    // --- Câu Đ/S 2 (Đề 1) ---
    {
      bh: "B3", muc: levelThongHieu,
      q: "Khi tìm hiểu về các thiết bị mạng và giao thức truyền tải trên Internet:",
      items: [
        { text: "a) Router là thiết bị dùng để kết nối các mạng khác nhau và định tuyến gói tin IP.", correct: true },
        { text: "b) Địa chỉ IP động của một máy tính không bao giờ thay đổi theo thời gian.", correct: false },
        { text: "c) Giao thức HTTPS mã hóa dữ liệu truyền qua mạng để đảm bảo an toàn thông tin.", correct: true },
        { text: "d) Switch gửi dữ liệu đến tất cả các cổng trên thiết bị bất kể máy đích là máy nào.", correct: false }
      ]
    },
    // --- Câu Đ/S 3 (Đề 1) ---
    {
      bh: "B7", muc: levelThongHieu,
      q: "Trong ngôn ngữ đánh dấu HTML5 xây dựng cấu trúc trang web:",
      items: [
        { text: "a) Thẻ <body> chứa tất cả các phần tử hiển thị trực tiếp trên trang web cho người dùng xem.", correct: true },
        { text: "b) Thẻ <h1> có kích thước chữ mặc định nhỏ hơn thẻ <h6>.", correct: false },
        { text: "c) Thuộc tính alt trong thẻ <img> bắt buộc phải là một địa chỉ đường dẫn đường link.", correct: false },
        { text: "d) Thẻ <a> sử dụng thuộc tính href để chỉ định địa chỉ liên kết đích.", correct: true }
      ]
    },
    // --- Câu Đ/S 4 (Đề 1) ---
    {
      bh: "B13", muc: levelThongHieu,
      q: "Xét các thuộc tính và cách hoạt động của ngôn ngữ CSS trong trang web:",
      items: [
        { text: "a) CSS giúp tách biệt nội dung trang web (HTML) và phần định dạng giao diện.", correct: true },
        { text: "b) Bộ chọn theo ID (ký hiệu #) có mức ưu tiên cao hơn bộ chọn theo Class (ký hiệu .).", correct: true },
        { text: "c) Thuộc tính margin tạo khoảng cách bên trong giữa nội dung và đường viền phần tử.", correct: false },
        { text: "d) Khai báo style dạng Inline CSS được đặt trong thẻ <head> của tệp HTML.", correct: false }
      ]
    },

    // --- Câu Đ/S 5 (Đề 2) ---
    {
      bh: "B2", muc: levelThongHieu,
      q: "Đánh giá các phát biểu liên quan đến Trí tuệ nhân tạo và xã hội:",
      items: [
        { text: "a) Xe tự lái sử dụng công nghệ thị giác máy tính và cảm biến để tự động di chuyển.", correct: true },
        { text: "b) AI có thể thay thế hoàn toàn mọi hoạt động sáng tạo của con người mà không cần giám sát.", correct: false },
        { text: "c) Trợ lý ảo Siri, Google Assistant có khả năng hiểu câu lệnh bằng giọng nói nhờ công nghệ NLP.", correct: true },
        { text: "d) Người dùng mạng xã hội nên cẩn trọng với công nghệ Deepfake mạo danh khuôn mặt và giọng nói.", correct: true }
      ]
    },
    // --- Câu Đ/S 6 (Đề 2) ---
    {
      bh: "B5", muc: levelThongHieu,
      q: "Khi chia sẻ dữ liệu và tài nguyên trong mạng cục bộ LAN:",
      items: [
        { text: "a) Việc đặt mật khẩu cho thư mục chia sẻ giúp bảo vệ dữ liệu khỏi truy cập trái phép.", correct: true },
        { text: "b) Mọi máy tính trong mạng LAN đều có chung địa chỉ MAC hoàn toàn giống nhau.", correct: false },
        { text: "c) Quyền Full Control cho phép người dùng mạng xem, sửa, xóa tệp và đổi quyền tài khoản.", correct: true },
        { text: "d) Để truy cập máy in chia sẻ qua mạng, hai thiết bị phải thuộc hai dải mạng hoàn toàn độc lập.", correct: false }
      ]
    },
    // --- Câu Đ/S 7 (Đề 2) ---
    {
      bh: "B9", muc: levelThongHieu,
      q: "Xét cấu trúc danh sách và bảng trong mã HTML:",
      items: [
        { text: "a) Thẻ <ul> tạo danh sách không có thứ tự, sử dụng các dấu đầu dòng (bullet point).", correct: true },
        { text: "b) Mỗi hàng của bảng được định nghĩa bằng cặp thẻ <tr>...</tr>.", correct: true },
        { text: "c) Thuộc tính colspan=\"3\" có tác dụng gộp 3 hàng liên tiếp trong bảng.", correct: false },
        { text: "d) Các ô tiêu đề bảng <th> có kiểu chữ mặc định là in đậm và căn lề giữa ô.", correct: true }
      ]
    },
    // --- Câu Đ/S 8 (Đề 2) ---
    {
      bh: "B16", muc: levelThongHieu,
      q: "Về Mô hình hộp (Box Model) và thuộc tính viền khung trong CSS:",
      items: [
        { text: "a) Khoảng cách từ nội dung phần tử đến đường viền border được gọi là padding.", correct: true },
        { text: "b) Thuộc tính border-radius: 50% giúp biến một ô vuông thành hình tròn.", correct: true },
        { text: "c) Thuộc tính margin mang giá trị âm sẽ đẩy phần tử ra xa các phần tử khác hơn.", correct: false },
        { text: "d) Quy tắc box-sizing: content-box bao gồm cả viền và padding vào tổng kích thước phần tử.", correct: false }
      ]
    },

    // --- Câu Đ/S 9 (Đề 3) ---
    {
      bh: "B6", muc: levelThongHieu,
      q: "Các nhận định về văn hóa và ứng xử an toàn trên môi trường số:",
      items: [
        { text: "a) Đăng tải thông tin xúc phạm danh dự cá nhân trên mạng xã hội là vi phạm Luật An ninh mạng.", correct: true },
        { text: "b) Bật xác thực hai yếu tố (2FA) giúp tăng cường bảo mật cho tài khoản cá nhân.", correct: true },
        { text: "c) Tải và cài đặt phần mềm từ các nguồn không rõ nguồn gốc hoàn toàn không gây nguy cơ nhiễm mã độc.", correct: false },
        { text: "d) Việc sử dụng nội dung do AI tạo ra trong học tập cần ghi rõ nguồn và kiểm chứng thông tin.", correct: true }
      ]
    },
    // --- Câu Đ/S 10 (Đề 3) ---
    {
      bh: "B12", muc: levelThongHieu,
      q: "Khi xây dựng biểu mẫu (Form) thu thập ý kiến người dùng trên website:",
      items: [
        { text: "a) Thẻ <form> chứa các ô nhập liệu như input, select, textarea để gửi dữ liệu về máy chủ.", correct: true },
        { text: "b) Ô nhập kiểu type=\"checkbox\" chỉ cho phép chọn duy nhất 1 đáp án trong danh sách.", correct: false },
        { text: "c) Thuộc tính placeholder hiển thị chữ gợi ý ẩn đi khi người dùng bắt đầu gõ văn bản.", correct: true },
        { text: "d) Thẻ <textarea> được sử dụng để cho phép nhập các đoạn văn bản dài nhiều dòng.", correct: true }
      ]
    },
    // --- Câu Đ/S 11 (Đề 3) ---
    {
      bh: "B15", muc: levelThongHieu,
      q: "Xét các thuộc tính màu sắc và phông chữ trong CSS:",
      items: [
        { text: "a) Thuộc tính color dùng để đổi màu chữ, background-color dùng để đổi màu nền.", correct: true },
        { text: "b) Mã màu Hexadecimal #000000 đại diện cho màu trắng tinh khiết.", correct: false },
        { text: "c) Thuộc tính opacity: 0; làm phần tử trở nên hoàn toàn trong suốt nhưng vẫn chiếm không gian.", correct: true },
        { text: "d) Thuộc tính font-weight: bold; dùng để thay đổi độ nghiêng của chữ.", correct: false }
      ]
    },
    // --- Câu Đ/S 12 (Đề 3) ---
    {
      bh: "B20", muc: levelThongHieu,
      q: "Các nhận định về định hướng nghề nghiệp thuộc ngành Công nghệ thông tin:",
      items: [
        { text: "a) Lập trình viên Front-end phụ trách giao diện người dùng, Back-end phụ trách xử lý máy chủ.", correct: true },
        { text: "b) Quản trị viên cơ sở dữ liệu (DBA) chịu trách nhiệm chính trong việc sửa chữa bo mạch máy in.", correct: false },
        { text: "c) Chuyên gia an toàn thông tin cần kiến thức sâu về mạng, mật mã học và phát hiện lỗ hổng.", correct: true },
        { text: "d) Nghề bảo trì máy tính chỉ cần kiến thức lý thuyết mà không cần kỹ năng thực hành phần cứng.", correct: false }
      ]
    },

    // --- Câu Đ/S 13 (Đề 4) ---
    {
      bh: "B11", muc: levelThongHieu,
      q: "Khi chèn tệp đa phương tiện và nhúng trang vào HTML5:",
      items: [
        { text: "a) Thẻ <video> hỗ trợ thuộc tính controls để hiển thị các thanh điều khiển phát video.", correct: true },
        { text: "b) Thẻ <iframe> cho phép nhúng một trang web khác hoặc video Youtube vào trang hiện tại.", correct: true },
        { text: "c) Thẻ <audio> bắt buộc phải đi kèm với tệp hình ảnh minh họa mới phát được âm thanh.", correct: false },
        { text: "d) Thuộc tính autoplay đảm bảo video tự động phát trên mọi trình duyệt di động mà không cần tắt tiếng.", correct: false }
      ]
    },
    // --- Câu Đ/S 14 (Đề 4) ---
    {
      bh: "B17", muc: levelThongHieu,
      q: "Đánh giá thứ tự ưu tiên của bộ chọn CSS (CSS Specificity):",
      items: [
        { text: "a) Định dạng kiểu Inline (viết trực tiếp trong thẻ HTML) có độ ưu tiên cao hơn kiểu External CSS.", correct: true },
        { text: "b) Từ khóa !important có khả năng đè lên hầu hết các quy tắc CSS khác.", correct: true },
        { text: "c) Bộ chọn tên thẻ (ví dụ p, h1) có độ ưu tiên cao hơn bộ chọn class (.menu).", correct: false },
        { text: "d) Nếu hai quy tắc CSS có cùng độ ưu tiên, quy tắc được viết sau sẽ đè lên quy tắc viết trước.", correct: true }
      ]
    },
    // --- Câu Đ/S 15 (Đề 4) ---
    {
      bh: "B24", muc: levelThongHieu,
      q: "Trong thiết kế giao diện website hiện đại (HTML5 & CSS3):",
      items: [
        { text: "a) Thẻ <header> chứa phần đầu trang web, <nav> chứa các liên kết điều hướng chính.", correct: true },
        { text: "b) Thiết kế Responsive Web giúp website hiển thị tối ưu trên màn hình điện thoại và máy tính.", correct: true },
        { text: "c) Thẻ <footer> là thẻ bắt buộc nằm ở vị trí trên cùng đầu trang web.", correct: false },
        { text: "d) Thuộc tính flex-direction: column trong CSS Flexbox xếp các phần tử nằm ngang.", correct: false }
      ]
    },
    // --- Câu Đ/S 16 (Đề 4) ---
    {
      bh: "B28", muc: levelThongHieu,
      q: "Về quy trình xuất bản và kiểm thử trang web:",
      items: [
        { text: "a) Sử dụng công cụ Developer Tools (F12) giúp kiểm tra và chỉnh sửa nhanh HTML/CSS trên trình duyệt.", correct: true },
        { text: "b) Trước khi đưa website lên Internet, cần kiểm tra tất cả liên kết (links) xem có bị lỗi 404 không.", correct: true },
        { text: "c) Một website hoàn chỉnh chỉ cần chạy tốt trên Google Chrome mà không cần thử trên trình duyệt khác.", correct: false },
        { text: "d) Việc tối ưu hóa dung lượng hình ảnh giúp trang web tải nhanh hơn và nâng cao trải nghiệm người dùng.", correct: true }
      ]
    }
  ];

  // =========================================================================
  // GHI VÀO CƠ SỞ DỮ LIỆU
  // =========================================================================
  let totalAddedPhan1 = 0;
  let totalAddedPhan2 = 0;

  // 1. Thêm 96 câu Phần I
  console.log(`Đang tiến hành chèn ${phan1Raw.length} câu Phần I (Trắc nghiệm 4 lựa chọn)...`);
  for (let i = 0; i < phan1Raw.length; i++) {
    const item = phan1Raw[i];
    const bhId = getBh(item.bh);

    // Tạo câu hỏi
    const { data: qData, error: qErr } = await supabase
      .from("cau_hoi")
      .insert({
        bai_hoc_id: bhId,
        phan: "I",
        muc_do_id: item.muc,
        noi_dung: `<p><strong>Câu ${i + 1}.</strong> ${item.q}</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      })
      .select("cau_hoi_id")
      .single();

    if (qErr) {
      console.error(`Lỗi chèn câu Phần I (${i + 1}):`, qErr.message);
      continue;
    }

    const qId = qData.cau_hoi_id;
    totalAddedPhan1++;

    // Tạo 4 phương án cho chi_tiet_cau_hoi
    const details = item.opts.map((optText, idx) => ({
      cau_hoi_id: qId,
      thu_tu: idx + 1,
      noi_dung: optText,
      la_dap_an_dung: (idx + 1) === item.correct
    }));

    const { error: dtErr } = await supabase
      .from("chi_tiet_cau_hoi")
      .insert(details);

    if (dtErr) {
      console.error(`Lỗi chèn chi tiết câu Phần I (${i + 1}):`, dtErr.message);
    }
  }

  // 2. Thêm 16 câu Phần II
  console.log(`Đang tiến hành chèn ${phan2Raw.length} câu Phần II (Trắc nghiệm Đúng/Sai)...`);
  for (let i = 0; i < phan2Raw.length; i++) {
    const item = phan2Raw[i];
    const bhId = getBh(item.bh);

    // Tạo câu hỏi Phần II
    const { data: qData, error: qErr } = await supabase
      .from("cau_hoi")
      .insert({
        bai_hoc_id: bhId,
        phan: "II",
        muc_do_id: item.muc,
        noi_dung: `<p><strong>Câu ${i + 1}.</strong> ${item.q}</p>`,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      })
      .select("cau_hoi_id")
      .single();

    if (qErr) {
      console.error(`Lỗi chèn câu Phần II (${i + 1}):`, qErr.message);
      continue;
    }

    const qId = qData.cau_hoi_id;
    totalAddedPhan2++;

    // Tạo 4 mệnh đề a, b, c, d
    const details = item.items.map((sub, idx) => ({
      cau_hoi_id: qId,
      thu_tu: idx + 1,
      noi_dung: sub.text,
      la_dap_an_dung: sub.correct
    }));

    const { error: dtErr } = await supabase
      .from("chi_tiet_cau_hoi")
      .insert(details);

    if (dtErr) {
      console.error(`Lỗi chèn chi tiết câu Phần II (${i + 1}):`, dtErr.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 HOÀN THÀNH TẠO NGAN HÀNG CÂU HỎI TIN HỌC!`);
  console.log(`- Số câu Phần I đã thêm: ${totalAddedPhan1} / 96 câu`);
  console.log(`- Số câu Phần II đã thêm: ${totalAddedPhan2} / 16 câu`);
  console.log(`- Tổng số câu hỏi sẵn sàng: ${totalAddedPhan1 + totalAddedPhan2} câu (Đủ tạo ít nhất 4 Đề thi độc lập hoàn chỉnh!)`);
  console.log(`==================================================`);
}

main().catch(err => {
  console.error("Thất bại:", err);
  process.exit(1);
});
