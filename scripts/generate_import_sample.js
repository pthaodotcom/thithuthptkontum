const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const data = [
  {
    Phan: 'I',
    ChuyenDe: 'Chương 1: Giới thiệu chung về kĩ thuật điện',
    BaiHoc: 'Bài 1: Giới thiệu tổng quan về kĩ thuật điện',
    MucDo: 'Nhận biết',
    NoiDung: 'Kĩ thuật điện có vai trò cốt lõi như thế nào trong đời sống và sản xuất?',
    DapAn1: 'Cung cấp năng lượng cho mọi hoạt động sinh hoạt và sản xuất',
    DapAn2: 'Chỉ phục vụ mục đích giải trí',
    DapAn3: 'Thay thế hoàn toàn sức lao động của con người',
    DapAn4: 'Chủ yếu dùng để thắp sáng',
    DapAnDung: '1'
  },
  {
    Phan: 'I',
    ChuyenDe: 'Chương 2: Hệ thống điện quốc gia',
    BaiHoc: 'Bài 3: Mạch điện xoay chiều ba pha',
    MucDo: 'Thông hiểu',
    NoiDung: 'Đặc điểm nào sau đây KHONG phải của mạch điện xoay chiều 3 pha?',
    DapAn1: 'Truyền tải điện năng đi xa tiết kiệm dây dẫn hơn so với mạch 1 pha',
    DapAn2: 'Tạo ra từ trường quay ứng dụng trong động cơ điện',
    DapAn3: 'Chỉ có thể cung cấp 1 mức điện áp duy nhất',
    DapAn4: 'Cấu tạo gồm 3 nguồn điện xoay chiều 1 pha',
    DapAnDung: '3'
  },
  {
    Phan: 'I',
    ChuyenDe: 'Chương 5: Giới thiệu chung về kĩ thuật điện tử',
    BaiHoc: 'Bài 13: Khái quát về kĩ thuật điện tử',
    MucDo: 'Nhận biết',
    NoiDung: 'Kĩ thuật điện tử KHÔNG ứng dụng chủ yếu trong lĩnh vực nào dưới đây?',
    DapAn1: 'Viễn thông và truyền hình',
    DapAn2: 'Điều khiển tự động',
    DapAn3: 'Chế biến thực phẩm thủ công',
    DapAn4: 'Thiết bị y tế',
    DapAnDung: '3'
  },
  {
    Phan: 'I',
    ChuyenDe: 'Chương 6: Linh kiện điện tử',
    BaiHoc: 'Bài 15: Điện trở, tụ điện và cuộn cảm',
    MucDo: 'Thông hiểu',
    NoiDung: 'Công dụng chính của tụ điện trong mạch điện tử là gì?',
    DapAn1: 'Cản trở dòng điện một chiều, cho dòng điện xoay chiều đi qua',
    DapAn2: 'Khuếch đại tín hiệu',
    DapAn3: 'Chỉ cho dòng điện đi theo một chiều',
    DapAn4: 'Tạo ra năng lượng điện',
    DapAnDung: '1'
  },
  {
    Phan: 'II',
    ChuyenDe: 'Chương 3: Hệ thống điện trong gia đình',
    BaiHoc: 'Bài 8: Hệ thống điện trong gia đình',
    MucDo: 'Vận dụng',
    NoiDung: 'Các nhận định sau về an toàn khi sử dụng hệ thống điện trong gia đình đúng hay sai?',
    DapAn1: 'Tuyệt đối không dùng tay ướt chạm vào công tắc điện hay rút phích cắm.',
    DapAn2: 'Có thể phơi quần áo ướt trực tiếp lên dây điện để nhanh khô.',
    DapAn3: 'Nên ngắt nguồn điện (cầu dao, aptomat) trước khi sửa chữa điện.',
    DapAn4: 'Cầu chì bị đứt có thể thay thế bằng dây đồng có tiết diện lớn để dùng cho bền.',
    DapAnDung: 'Đ;S;Đ;S'
  },
  {
    Phan: 'II',
    ChuyenDe: 'Chương 6: Linh kiện điện tử',
    BaiHoc: 'Bài 16: Diode, transistor và mạch tích hợp IC',
    MucDo: 'Thông hiểu',
    NoiDung: 'Cho các phát biểu sau về linh kiện bán dẫn, phát biểu nào đúng, phát biểu nào sai?',
    DapAn1: 'Diode chỉnh lưu có khả năng biến dòng điện xoay chiều thành dòng điện một chiều.',
    DapAn2: 'Transistor chỉ có một cực duy nhất.',
    DapAn3: 'Mạch tích hợp (IC) bao gồm rất nhiều linh kiện điện tử thu nhỏ trên một chip silicon.',
    DapAn4: 'LED là một loại Diode có khả năng phát sáng.',
    DapAnDung: 'Đ;S;Đ;Đ'
  },
  {
    Phan: 'III',
    ChuyenDe: 'Chương 4: An toàn và tiết kiệm điện năng',
    BaiHoc: 'Bài 12: Tiết kiệm điện năng',
    MucDo: 'Vận dụng cao',
    NoiDung: 'Một bóng đèn LED có công suất 50W được sử dụng trung bình 4 giờ mỗi ngày. Tính lượng điện năng (đơn vị kWh) mà bóng đèn này tiêu thụ trong 30 ngày.',
    DapAn1: '',
    DapAn2: '',
    DapAn3: '',
    DapAn4: '',
    DapAnDung: '6'
  },
  {
    Phan: 'III',
    ChuyenDe: 'Chương 8: Điện tử số',
    BaiHoc: 'Bài 21: Tín hiệu số và các cổng logic cơ bản',
    MucDo: 'Vận dụng cao',
    NoiDung: 'Cổng logic AND có 2 ngõ vào A và B. Biết tần số tín hiệu ở ngõ A là 100Hz, ngõ B luôn ở mức logic 1. Hỏi tần số tín hiệu ở ngõ ra Y là bao nhiêu Hz?',
    DapAn1: '',
    DapAn2: '',
    DapAn3: '',
    DapAn4: '',
    DapAnDung: '100'
  }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "ImportData");
const artifactDir = path.join(__dirname, '..', 'artifacts', 'reference-data');
fs.mkdirSync(artifactDir, { recursive: true });
const outputPath = path.join(artifactDir, 'cau_hoi_cong_nghe.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`Đã tạo file mẫu tại ${outputPath}`);
