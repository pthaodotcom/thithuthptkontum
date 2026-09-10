export function lamSachNhanXet(noiDung: string, diem?: number) {
  if (!noiDung || !noiDung.trim()) return "";
  const noiDungSach = noiDung
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();

  const diemTrongNoiDung = noiDungSach.match(
    /(?:^|\n)\s*Điểm bài thi:\s*([^\n]+)/i,
  )?.[1]?.trim();
  const dongDiem = typeof diem === "number"
    ? `Điểm bài thi: ${diem.toFixed(2)}/10`
    : diemTrongNoiDung
      ? `Điểm bài thi: ${diemTrongNoiDung}`
      : "";

  // Loại bỏ dòng Điểm bài thi trong phần nội dung để tránh bị lặp
  const phanNoiDung = noiDungSach
    .replace(/(?:^|\n)\s*Điểm bài thi:[^\n]*/gi, "")
    .trim();

  const haiPhan = phanNoiDung.match(
    /(?:Điểm mạnh|Nhận xét chung|Nhận xét|Đánh giá chung):\s*([\s\S]*?)\s*(?:Nội dung nên ôn|Nội dung cần ôn|Cần ôn thêm|Cần củng cố|Định hướng ôn tập):\s*([\s\S]*)/i,
  );
  if (!haiPhan) return [dongDiem, phanNoiDung].filter(Boolean).join("\n");

  const diemManh = (haiPhan[1] ?? "").replace(/\s+/g, " ").trim();
  const noiDungNenOn = (haiPhan[2] ?? "").replace(/\s+/g, " ").trim();
  return [
    dongDiem,
    `Nhận xét chung: ${diemManh}`,
    `Nội dung nên ôn: ${noiDungNenOn}`,
  ].filter(Boolean).join("\n");
}

const NHAN_NHOM_NANG_LUC: Record<string, string> = {
  CanOnTapGap: "Cần ôn tập gấp",
  TrungBinh: "Trung bình",
  Kha: "Khá",
  DaNamVung: "Đã nắm vững",
};

export async function sinhNhanXetGemini(duLieu: {
  diem: number;
  nhom: string;
  chuyenDeYeu?: string[];
  tongSoChuyenDe?: number;
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new Error("GEMINI_CHUA_CAU_HINH");
  const diemBaiThi = duLieu.diem.toFixed(2);
  const nhomNangLuc = NHAN_NHOM_NANG_LUC[duLieu.nhom] ?? duLieu.nhom;
  const soChuyenDe = duLieu.tongSoChuyenDe ?? 0;
  const danhSachYeu = (duLieu.chuyenDeYeu ?? []).join(", ");
  const chuyenDeCanOn = danhSachYeu
    || (soChuyenDe > 0 ? "không có chuyên đề nào dưới mức cần ôn tập" : "chưa có dữ liệu phân tích theo chuyên đề");
  const prompt = [
    "Viết nhận xét học tập bằng tiếng Việt, ngắn gọn và không nêu dữ liệu định danh.",
    `Điểm bài thi: ${diemBaiThi}. Nhóm năng lực: ${nhomNangLuc}.`,
    `Chuyên đề cần ôn: ${chuyenDeCanOn}.`,
    "Đầu ra gồm một dòng điểm bài thi và đúng hai ý nhận xét: nhận xét chung và nội dung nên ôn.",
    "Chỉ nhận xét từ dữ liệu đã cung cấp; không suy đoán thái độ, hành vi hoặc thành tích khác của người học.",
    "Nhận xét phải tạo thêm giá trị so với việc lặp lại điểm, tên nhóm năng lực và danh sách chuyên đề.",
    "Ở ý nhận xét chung, liên kết điểm bài thi với mức độ hoàn thành kiến thức trong phạm vi bài thi; không chỉ nhắc lại tên nhóm năng lực.",
    "Ở ý nội dung nên ôn, gắn từng chuyên đề được cung cấp với một hành động ôn tập cụ thể như rà soát kiến thức nền tảng, làm lại câu đã sai hoặc luyện thêm bài tập cùng dạng.",
    "Khi có nhiều chuyên đề nhưng không có tỷ lệ đúng, không tự xếp chuyên đề nào yếu hơn. Khi chưa có dữ liệu chuyên đề, nêu rõ giới hạn và đưa ra hướng ôn tập chung.",
    "Mỗi ý viết từ một đến hai câu ngắn, có tính định hướng và không trùng ý với dòng điểm.",
    "Không in đậm, không dùng Markdown và không thêm lời mở đầu hoặc kết luận.",
    "Trả về đúng ba dòng theo mẫu:",
    `Điểm bài thi: ${diemBaiThi}/10`,
    "Nhận xét chung: <nhận xét phù hợp với điểm bài thi và nhóm năng lực>",
    "Nội dung nên ôn: <chuyên đề cần ôn và định hướng ôn tập ngắn gọn>",
  ].join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { thinking_config: { thinking_budget: 0 } },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!response.ok) throw new Error(`GEMINI_${response.status}`);
  const json = await response.json();
  const parts: { text?: string; thoughtSignature?: string }[] = json?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => p.text && !p.thoughtSignature).map((p) => p.text!).join("").trim()
    || parts.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("GEMINI_KHONG_CO_NOI_DUNG");
  return lamSachNhanXet(text, duLieu.diem);
}

export function nhanXetFallback(nhom: string, chuyenDeYeu: string[] = [], diem?: number, tongSoChuyenDe = 0) {
  const diemManh: Record<string, string> = {
    CanOnTapGap: "Kết quả đã phản ánh những phần kiến thức cần ưu tiên củng cố.",
    TrungBinh: "Đã nắm được một phần kiến thức cơ bản của môn học.",
    Kha: "Nắm khá tốt kiến thức và có nền tảng để tiếp tục cải thiện kết quả.",
    DaNamVung: "Đã nắm vững phần lớn kiến thức được đánh giá trong bài thi.",
  };
  let noiDungNenOn: string;
  if (chuyenDeYeu.length > 0) {
    noiDungNenOn = `Cần củng cố các chuyên đề: ${chuyenDeYeu.join(", ")}.`;
  } else if (tongSoChuyenDe > 0) {
    noiDungNenOn = "Kết quả đều trên mức cần ôn tập ở tất cả chuyên đề — tiếp tục duy trì phong độ.";
  } else {
    noiDungNenOn = "Chưa có dữ liệu phân tích theo chuyên đề.";
  }
  return [
    typeof diem === "number" ? `Điểm bài thi: ${diem.toFixed(2)}/10` : "",
    `Nhận xét chung: ${diemManh[nhom] ?? "Đã hoàn thành bài thi và có kết quả để xác định nội dung cần cải thiện."}`,
    `Nội dung nên ôn: ${noiDungNenOn}`,
  ].filter(Boolean).join("\n");
}
