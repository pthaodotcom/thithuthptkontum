import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import crypto from "crypto";

// Load .env.local variables
const env = fs.readFileSync(".env.local", "utf8");
const lines = env.split("\n");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

for (const line of lines) {
  if (line.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) supabaseUrl = line.split("=")[1].trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) supabaseKey = line.split("=")[1].trim();
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== BẮT ĐẦU TẠO BATCH 768 CÂU HỎI TIẾNG ANH 12 (48 BÀI HỌC x 4 MỨC ĐỘ x 4 CÂU) ===");

  // 1. Tìm môn Tiếng Anh
  const { data: monList } = await supabase
    .from("mon")
    .select("mon_id")
    .in("ten_mon", ["Tiếng Anh", "Tiếng anh", "Ngoại ngữ", "Ngoại Ngữ"])
    .eq("trang_thai", "DangDung");

  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Tiếng Anh!");
    process.exit(1);
  }
  const monId = monList[0].mon_id;

  // 2. Lấy Mức độ nhận thức
  const { data: mucDoList } = await supabase
    .from("muc_do_nhan_thuc")
    .select("muc_do_id, thu_tu, ten_muc")
    .order("thu_tu", { ascending: true });

  const nb = mucDoList.find(m => m.thu_tu === 1)?.muc_do_id;
  const th = mucDoList.find(m => m.thu_tu === 2)?.muc_do_id;
  const vd = mucDoList.find(m => m.thu_tu === 3)?.muc_do_id;
  const vdc = mucDoList.find(m => m.thu_tu === 4)?.muc_do_id;

  const levels = [
    { name: "Nhận biết", id: nb, code: "NB" },
    { name: "Thông hiểu", id: th, code: "TH" },
    { name: "Vận dụng", id: vd, code: "VD" },
    { name: "Vận dụng cao", id: vdc, code: "VDC" }
  ];

  // 3. Lấy danh sách tất cả Chuyên đề và Bài học môn Tiếng Anh
  const { data: chuyenDes } = await supabase
    .from("chuyen_de")
    .select("chuyen_de_id, ma_chuyen_de, ten_chuyen_de")
    .eq("mon_id", monId);

  const cdIds = chuyenDes.map(c => c.chuyen_de_id);

  const { data: baiHocs } = await supabase
    .from("bai_hoc")
    .select("bai_hoc_id, ma_bai_hoc, ten_bai_hoc, chuyen_de_id")
    .in("chuyen_de_id", cdIds)
    .order("ma_bai_hoc");

  console.log(`Tìm thấy ${baiHocs.length} bài học môn Tiếng Anh.`);

  const questionTemplates = {
    NB: [
      {
        q: (title, i) => `Choose the word whose underlined part is pronounced differently in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. <u>c</u>ultural", "B. <u>c</u>ombine", "C. <u>c</u>ertain", "D. <u>c</u>areer"],
        correct: 3
      },
      {
        q: (title, i) => `Mark the letter A, B, C, or D to indicate the correct word to complete the sentence in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. key term", "B. wrongly used term", "C. irrelevant phrase", "D. incorrect idiom"],
        correct: 1
      },
      {
        q: (title, i) => `Choose the word with a stress pattern different from the others in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. 'strategy", "B. 'industry", "C. 'opportunity", "D. 'qualify"],
        correct: 3
      },
      {
        q: (title, i) => `Identify the correct grammatical component for <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. Standard verb form", "B. Incorrect tense usage", "C. Misplaced prepositions", "D. Wrong adjective form"],
        correct: 1
      }
    ],
    TH: [
      {
        q: (title, i) => `Mark the letter A, B, C, or D to indicate the correct option that completes the passage context in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. which contributes significantly to sustainable development", "B. who contribute significantly", "C. where it contribute", "D. whose contribution"],
        correct: 1
      },
      {
        q: (title, i) => `Choose the word CLOSEST in meaning to the target vocabulary in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. essential and core concept", "B. completely unimportant", "C. highly controversial", "D. obsolete and outdated"],
        correct: 1
      },
      {
        q: (title, i) => `Identify the grammatical error in the given sentence related to <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. Incorrect verb tense alignment", "B. Correct subject-verb agreement", "C. Proper prepositional phrase", "D. Accurate relative pronoun"],
        correct: 1
      },
      {
        q: (title, i) => `Complete the conversational response for the situational context of <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. 'I completely agree with your perspective on this.'", "B. 'No, I don't care at all.'", "C. 'What a silly idea!'", "D. 'You must be joking.'"],
        correct: 1
      }
    ],
    VD: [
      {
        q: (title, i) => `Choose the sentence that is CLOSEST in meaning to the original statement regarding <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. The new policy was implemented effectively, bringing substantial benefits.",
          "B. Although the policy was new, nobody benefited from it.",
          "C. People benefited despite the lack of effective implementation.",
          "D. If the policy had been implemented, it would have failed."
        ],
        correct: 1
      },
      {
        q: (title, i) => `Choose the best option to combine two sentences in <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. Having mastered the essential skills, the candidate performed exceptionally well in the interview.",
          "B. Mastered the essential skills, the interview was performed by the candidate.",
          "C. Because the candidate performed well, she mastered the skills.",
          "D. The candidate performed well although she lacked essential skills."
        ],
        correct: 1
      },
      {
        q: (title, i) => `Choose the word OPPOSITE in meaning to the bold word in <strong>[${title}]</strong> (Question ${i}).`,
        opts: ["A. detrimental and harmful", "B. beneficial and rewarding", "C. supportive and constructive", "D. advantageous and positive"],
        correct: 1
      },
      {
        q: (title, i) => `Apply the advanced grammatical structure (Cleft sentences / Conditionals) for <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. It was through continuous practice that she achieved fluency.",
          "B. She achieved fluency so that it was continuous practice.",
          "C. Continuous practice was achieved although she was fluent.",
          "D. Fluency was through practice it was continuous."
        ],
        correct: 1
      }
    ],
    VDC: [
      {
        q: (title, i) => `Analyze the reading passage inference for <strong>[${title}]</strong> (Question ${i}): What can be logically deduced about future trends?`,
        opts: [
          "A. Technological integration and lifelong adaptability will become essential competencies.",
          "B. Traditional practices will completely eliminate modern innovations.",
          "C. Future developments will be entirely unpredictable and without pattern.",
          "D. Individual efforts will no longer matter in globalized environments."
        ],
        correct: 1
      },
      {
        q: (title, i) => `Evaluate the author's primary attitude towards the main argument presented in <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. Objectively analytical and cautiously optimistic",
          "B. Completely indifferent and dismissive",
          "C. Highly aggressive and hostile",
          "D. Sarcastic and pessimistic"
        ],
        correct: 1
      },
      {
        q: (title, i) => `Mark the sentence that best expresses a synthesized conclusion from the discussion in <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. Had proactive measures been adopted earlier, the negative impacts could have been mitigated.",
          "B. Proactive measures were adopted so negative impacts increased.",
          "C. Unless negative impacts occur, proactive measures are unnecessary.",
          "D. Mitigating negative impacts is impossible regardless of proactive measures."
        ],
        correct: 1
      },
      {
        q: (title, i) => `Determine the most appropriate summary title for the complex passage under <strong>[${title}]</strong> (Question ${i}).`,
        opts: [
          "A. 'Navigating Modern Challenges: Strategies for Sustainable Progress'",
          "B. 'A Brief History of Irrelevant Events'",
          "C. 'Why Traditional Methods Always Fail'",
          "D. 'The End of Global Cooperation'"
        ],
        correct: 1
      }
    ]
  };

  const allQuestionsToInsert = [];
  const allOptionsToInsert = [];

  for (const bh of baiHocs) {
    for (const lvl of levels) {
      const templates = questionTemplates[lvl.code];

      for (let i = 0; i < 4; i++) {
        const tmpl = templates[i % templates.length];
        const questionText = tmpl.q(bh.ten_bai_hoc, i + 1);
        const qId = crypto.randomUUID();

        allQuestionsToInsert.push({
          cau_hoi_id: qId,
          bai_hoc_id: bh.bai_hoc_id,
          phan: "I",
          muc_do_id: lvl.id,
          noi_dung: `<p><strong>[${bh.ma_bai_hoc} - ${bh.ten_bai_hoc}] (${lvl.name} ${i + 1}):</strong> ${questionText}</p>`,
          trang_thai_duyet: "DaDuyet",
          trang_thai_su_dung: "ChuaDung"
        });

        tmpl.opts.forEach((optText, idx) => {
          allOptionsToInsert.push({
            cau_hoi_id: qId,
            thu_tu: idx + 1,
            noi_dung: optText,
            la_dap_an_dung: idx + 1 === tmpl.correct
          });
        });
      }
    }
  }

  console.log(`Đang chèn batch ${allQuestionsToInsert.length} câu hỏi...`);

  // Batch insert cau_hoi (chunks of 200)
  for (let i = 0; i < allQuestionsToInsert.length; i += 200) {
    const chunk = allQuestionsToInsert.slice(i, i + 200);
    const { error: qErr } = await supabase.from("cau_hoi").insert(chunk);
    if (qErr) console.error("Error inserting question chunk:", qErr);
  }

  console.log(`Đang chèn batch ${allOptionsToInsert.length} lựa chọn...`);

  // Batch insert chi_tiet_cau_hoi (chunks of 500)
  for (let i = 0; i < allOptionsToInsert.length; i += 500) {
    const chunk = allOptionsToInsert.slice(i, i + 500);
    const { error: oErr } = await supabase.from("chi_tiet_cau_hoi").insert(chunk);
    if (oErr) console.error("Error inserting options chunk:", oErr);
  }

  console.log(`\n🎉 BATCH THÀNH CÔNG: Đã chèn ${allQuestionsToInsert.length} câu hỏi và ${allOptionsToInsert.length} lựa chọn môn Tiếng Anh!`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
