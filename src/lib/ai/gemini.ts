export async function sinhNhanXetGemini(duLieu: {
  diem: number;
  nhom: string;
  chuyenDeYeu?: string[];
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new Error("GEMINI_CHUA_CAU_HINH");
  const prompt = [
    "Viết nhận xét học tập tiếng Việt ngắn gọn, không nêu dữ liệu định danh.",
    `Điểm trung bình: ${duLieu.diem}. Nhóm năng lực: ${duLieu.nhom}.`,
    `Chuyên đề cần ôn: ${(duLieu.chuyenDeYeu ?? []).join(", ") || "chưa đủ dữ liệu"}.`,
    "Gồm đúng hai ý: điểm mạnh và nội dung nên ôn.",
  ].join("\n");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) throw new Error(`GEMINI_${response.status}`);
  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
  if (!text) throw new Error("GEMINI_KHONG_CO_NOI_DUNG");
  return text;
}

export function nhanXetFallback(nhom: string) {
  const noiDung: Record<string, string> = {
    CanOnTapGap: "Kết quả cho thấy em cần ưu tiên ôn lại kiến thức nền tảng và luyện tập đều đặn.",
    TrungBinh: "Em đã nắm được kiến thức cơ bản; cần củng cố các chuyên đề còn sai để cải thiện độ ổn định.",
    Kha: "Em nắm kiến thức khá tốt; nên tập trung vào các dạng vận dụng để nâng kết quả.",
    DaNamVung: "Em đã nắm vững phần lớn kiến thức; hãy tiếp tục luyện các dạng khó để duy trì kết quả.",
  };
  return noiDung[nhom] ?? "Em đã hoàn thành bài thi; hãy tiếp tục ôn tập theo kết quả chi tiết.";
}
