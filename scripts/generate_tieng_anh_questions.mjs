import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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
  console.log("=== BẮT ĐẦU NGÂN HÀNG CÂU HỎI MÔN TIẾNG ANH 12 (GLOBAL SUCCESS 2025) ===");

  // 1. Tìm môn Tiếng Anh
  const { data: monList } = await supabase
    .from("mon")
    .select("mon_id")
    .in("ten_mon", ["Tiếng Anh", "Tiếng anh", "Ngoại ngữ", "Ngoại Ngữ"])
    .eq("trang_thai", "DangDung");

  if (!monList || monList.length === 0) {
    console.error("Không tìm thấy môn Tiếng Anh trong CSDL!");
    process.exit(1);
  }
  const monId = monList[0].mon_id;

  // 2. Lấy Mức độ nhận thức
  const { data: mucDoList } = await supabase
    .from("muc_do_nhan_thuc")
    .select("muc_do_id, thu_tu, ten_muc")
    .order("thu_tu", { ascending: true });

  const lvlMap = {};
  mucDoList.forEach(m => {
    lvlMap[m.thu_tu] = m.muc_do_id;
  });

  const levelNB = lvlMap[1] || mucDoList[0].muc_do_id;
  const levelTH = lvlMap[2] || mucDoList[1]?.muc_do_id || levelNB;
  const levelVD = lvlMap[3] || mucDoList[2]?.muc_do_id || levelTH;
  const levelVDC = lvlMap[4] || mucDoList[3]?.muc_do_id || levelVD;

  // 3. Lấy bản đồ Chuyên đề & Bài học môn Tiếng Anh
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

  const allBhIds = Object.values(baiHocMap);
  const getBh = (ma) => baiHocMap[ma] || allBhIds[0];

  // 4. Danh sách câu hỏi môn Tiếng Anh 12 (Phần I - Trắc nghiệm 4 lựa chọn)
  const questions = [
    // --- UNIT 1: Life stories we admire ---
    {
      bh: "B1_TA", muc: levelNB,
      q: "Choose the word whose underlined part is pronounced differently from that of the others.",
      opts: ["A. <u>a</u>dmire", "B. <u>a</u>chievement", "C. <u>a</u>ttack", "D. <u>a</u>lbum"],
      correct: 4
    },
    {
      bh: "B1_TA", muc: levelNB,
      q: "He showed great ______ in overcoming his physical disabilities to become a world-famous scientist.",
      opts: ["A. perseverance", "B. persevering", "C. persevere", "D. persevered"],
      correct: 1
    },
    {
      bh: "B2_TA", muc: levelTH,
      q: "While Thomas Edison ______ on the light bulb, he discovered many other useful inventions.",
      opts: ["A. worked", "B. was working", "C. is working", "D. has worked"],
      correct: 2
    },
    {
      bh: "B2_TA", muc: levelTH,
      q: "Steve Jobs was a visionary entrepreneur who ______ Apple Inc. and revolutionized the personal computer industry.",
      opts: ["A. co-founded", "B. has co-founded", "C. had co-founded", "D. was co-founding"],
      correct: 1
    },
    {
      bh: "B3_TA", muc: levelVD,
      q: "Choose the sentence that best combines the two sentences: 'Uncle Ho spent his entire life fighting for national independence. He is admired by millions of people worldwide.'",
      opts: [
        "A. Having spent his entire life fighting for national independence, Uncle Ho is admired by millions of people worldwide.",
        "B. Uncle Ho is admired by millions of people worldwide so that he spent his life fighting for independence.",
        "C. Although Uncle Ho spent his life fighting for independence, he is admired worldwide.",
        "D. Because Uncle Ho is admired by millions, he spent his entire life fighting for independence."
      ],
      correct: 1
    },
    {
      bh: "B4_TA", muc: levelVDC,
      q: "Which of the following best summarizes the main message of an inspirational biography?",
      opts: [
        "A. Success is purely determined by luck and wealth without personal effort.",
        "B. Overcoming adversity through determination and dedication inspires others to achieve their goals.",
        "C. Famous historical figures never faced failures during their career journeys.",
        "D. People should only admire historical figures who lived in ancient times."
      ],
      correct: 2
    },

    // --- UNIT 2: A multicultural world ---
    {
      bh: "B5_TA", muc: levelNB,
      q: "Choose the word with a different stress pattern from the others.",
      opts: ["A. 'cultural", "B. 'customary", "C. di'versity", "D. 'heritage"],
      correct: 3
    },
    {
      bh: "B5_TA", muc: levelNB,
      q: "Living in a ______ city allows people to experience food, music, and traditions from all over the world.",
      opts: ["A. multicultural", "B. monocultural", "C. agriculture", "D. culture"],
      correct: 1
    },
    {
      bh: "B6_TA", muc: levelTH,
      q: "The ______ people travel around the world, the ______ understanding they gain about different cultures.",
      opts: ["A. more / better", "B. most / best", "C. more / more better", "D. much / good"],
      correct: 1
    },
    {
      bh: "B7_TA", muc: levelVD,
      q: "Mark the letter A, B, C, or D to indicate the sentence that is CLOSEST in meaning to: 'No other cultural festival in the country is as colorful as the Lunar New Year.'",
      opts: [
        "A. The Lunar New Year is the most colorful cultural festival in the country.",
        "B. The Lunar New Year is less colorful than other cultural festivals.",
        "C. Other cultural festivals are more colorful than the Lunar New Year.",
        "D. The Lunar New Year is not as colorful as some other festivals."
      ],
      correct: 1
    },

    // --- UNIT 3: Green living ---
    {
      bh: "B9_TA", muc: levelNB,
      q: "Single-use plastic bags should be replaced with ______ shopping bags to protect the environment.",
      opts: ["A. reusable", "B. reusable-less", "C. reuse", "D. reusability"],
      correct: 1
    },
    {
      bh: "B9_TA", muc: levelNB,
      q: "Identify the word that means 'the total amount of greenhouse gases produced by human activities':",
      opts: ["A. carbon footprint", "B. global warming", "C. climate change", "D. ozone depletion"],
      correct: 1
    },
    {
      bh: "B10_TA", muc: levelTH,
      q: "Many young people are adopting a green lifestyle, ______ they want to reduce their impact on the planet.",
      opts: ["A. for", "B. but", "C. or", "D. yet"],
      correct: 1
    },
    {
      bh: "B11_TA", muc: levelVD,
      q: "Choose the word OPPOSITE in meaning to the underlined word: 'Using public transport helps **diminish** air pollution in big cities.'",
      opts: ["A. increase", "B. reduce", "C. decrease", "D. lessen"],
      correct: 1
    },

    // --- REVIEW 1 ---
    {
      bh: "B13_TA", muc: levelTH,
      q: "[Review 1] Choose the correct option to complete the sentence: 'While Peter ______ in the garden, he found an old coin.'",
      opts: ["A. was digging", "B. dug", "C. has dug", "D. is digging"],
      correct: 1
    },
    {
      bh: "B14_TA", muc: levelVD,
      q: "[Review 1] 'The more trees we plant, ______ the air becomes.'",
      opts: ["A. the cleaner", "B. cleaner", "C. cleanest", "D. the cleanest"],
      correct: 1
    },

    // --- UNIT 4: Urbanisation ---
    {
      bh: "B15_TA", muc: levelNB,
      q: "Rapid ______ in major cities has led to severe traffic congestion and housing shortages.",
      opts: ["A. urbanisation", "B. urbanise", "C. urban", "D. urbanised"],
      correct: 1
    },
    {
      bh: "B16_TA", muc: levelTH,
      q: "It is essential that city authorities ______ sustainable public transport systems to cope with population growth.",
      opts: ["A. develop", "B. developed", "C. to develop", "D. developing"],
      correct: 1
    },
    {
      bh: "B17_TA", muc: levelVD,
      q: "Tokyo is a ______ city with millions of inhabitants living in smart apartment towers.",
      opts: ["A. densely-populated", "B. population-dense", "C. populating-dense", "D. dense-populating"],
      correct: 1
    },

    // --- UNIT 5: The world of work ---
    {
      bh: "B19_TA", muc: levelNB,
      q: "Applicants must submit their updated CV and a cover letter to the ______ department.",
      opts: ["A. human resources", "B. public relations", "C. customer service", "D. quality control"],
      correct: 1
    },
    {
      bh: "B20_TA", muc: levelTH,
      q: "______ all the required qualifications, she was immediately invited for an interview.",
      opts: ["A. Having possessed", "B. Possessing", "C. Possessed", "D. To possess"],
      correct: 1
    },
    {
      bh: "B21_TA", muc: levelVD,
      q: "He regretted ______ the job offer without negotiating the salary first.",
      opts: ["A. turning down", "B. to turn down", "C. turn down", "D. turned down"],
      correct: 1
    },

    // --- REVIEW 2 ---
    {
      bh: "B23_TA", muc: levelTH,
      q: "[Review 2] 'She managed to secure the position despite ______ prior experience.'",
      opts: ["A. not having", "B. not have", "C. haven't had", "D. not to have"],
      correct: 1
    },

    // --- UNIT 6: Artificial intelligence ---
    {
      bh: "B25_TA", muc: levelNB,
      q: "Artificial Intelligence algorithms can process vast amounts of data in a matter of ______.",
      opts: ["A. seconds", "B. hours", "C. days", "D. weeks"],
      correct: 1
    },
    {
      bh: "B26_TA", muc: levelTH,
      q: "Routine tasks in manufacturing plants ______ by industrial robots in the near future.",
      opts: ["A. will be performed", "B. will perform", "C. perform", "D. were performed"],
      correct: 1
    },
    {
      bh: "B27_TA", muc: levelVD,
      q: "Dr. Smith, ______ pioneer work in AI transformed medical diagnosis, received a prestigious global award.",
      opts: ["A. whose", "B. who", "C. whom", "D. which"],
      correct: 1
    },
    {
      bh: "B28_TA", muc: levelVDC,
      q: "Choose the correct sentence: 'Many experts warn that unchecked AI development could pose ethical challenges.'",
      opts: [
        "A. Experts warn of ethical risks if AI development remains unregulated.",
        "B. AI development has no ethical risks whatsoever.",
        "C. Ethical challenges will automatically stop AI development.",
        "D. Only experts are allowed to use Artificial Intelligence."
      ],
      correct: 1
    },

    // --- UNIT 7: The world of mass media ---
    {
      bh: "B29_TA", muc: levelNB,
      q: "Social media platforms have become the main source of news for many young ______.",
      opts: ["A. consumers", "B. producers", "C. manufacturers", "D. publishers"],
      correct: 1
    },
    {
      bh: "B30_TA", muc: levelTH,
      q: "The editor advised the journalist ______ the source before publishing the breaking news story.",
      opts: ["A. to verify", "B. verifying", "C. verify", "D. verified"],
      correct: 1
    },
    {
      bh: "B31_TA", muc: levelVD,
      q: "Misinformation can spread rapidly online unless users learn to think ______.",
      opts: ["A. critically", "B. critical", "C. criticism", "D. critique"],
      correct: 1
    },

    // --- UNIT 8: Wildlife conservation ---
    {
      bh: "B33_TA", muc: levelNB,
      q: "Many rare animal species are facing extinction due to illegal ______ and habitat loss.",
      opts: ["A. poaching", "B. farming", "C. gardening", "D. fishing"],
      correct: 1
    },
    {
      bh: "B34_TA", muc: levelTH,
      q: "______ strict anti-poaching laws were enacted, the rhino population in the national park began to recover.",
      opts: ["A. Once", "B. Unless", "C. Although", "D. Even if"],
      correct: 1
    },
    {
      bh: "B35_TA", muc: levelVD,
      q: "Not until the park rangers arrived ______ that the endangered tiger had been safely rescued.",
      opts: ["A. did we realize", "B. we realized", "C. do we realize", "D. have we realized"],
      correct: 1
    },

    // --- REVIEW 3 ---
    {
      bh: "B37_TA", muc: levelTH,
      q: "[Review 3] 'If we do not take immediate action, more wildlife habitats ______ ruined.'",
      opts: ["A. will be", "B. would be", "C. were", "D. had been"],
      correct: 1
    },

    // --- UNIT 9: Career paths ---
    {
      bh: "B39_TA", muc: levelNB,
      q: "Students can choose between academic university courses and ______ education to gain practical skills.",
      opts: ["A. vocational", "B. vocal", "C. vocabulary", "D. vocationally"],
      correct: 1
    },
    {
      bh: "B40_TA", muc: levelTH,
      q: "It was in high school ______ Minh first discovered his passion for software engineering.",
      opts: ["A. that", "B. which", "C. who", "D. where"],
      correct: 1
    },
    {
      bh: "B41_TA", muc: levelVD,
      q: "She decided to ______ a new project despite her heavy workload.",
      opts: ["A. take on", "B. take off", "C. take after", "D. take back"],
      correct: 1
    },

    // --- UNIT 10: Lifelong learning ---
    {
      bh: "B43_TA", muc: levelNB,
      q: "In today's fast-changing job market, ______ is key to remaining competitive and adaptable.",
      opts: ["A. lifelong learning", "B. short-term memory", "C. cramming", "D. rote learning"],
      correct: 1
    },
    {
      bh: "B44_TA", muc: levelTH,
      q: "If I ______ more time last semester, I would have enrolled in an online graphic design course.",
      opts: ["A. had had", "B. have", "C. had", "D. would have"],
      correct: 1
    },
    {
      bh: "B45_TA", muc: levelVD,
      q: "The online workshop ______ by the university attracted over 500 working professionals nationwide.",
      opts: ["A. organized", "B. organizing", "C. which organized", "D. organize"],
      correct: 1
    },
    {
      bh: "B46_TA", muc: levelVDC,
      q: "Choose the best restatement: 'Had he continuously updated his technical skills, he wouldn't have been replaced by automation.'",
      opts: [
        "A. He was replaced by automation because he failed to continuously update his technical skills.",
        "B. He updated his skills regularly, so automation couldn't replace him.",
        "C. Automation replaced him even though he updated his technical skills.",
        "D. If he updates his skills now, he will not be replaced by automation."
      ],
      correct: 1
    },

    // --- REVIEW 4 ---
    {
      bh: "B47_TA", muc: levelTH,
      q: "[Review 4] 'Lifelong learners are individuals ______ continuously seek knowledge throughout their lives.'",
      opts: ["A. who", "B. which", "C. whom", "D. whose"],
      correct: 1
    },
    {
      bh: "B48_TA", muc: levelVD,
      q: "[Review 4] 'It is adaptability and continuous self-improvement ______ help professionals thrive in modern workplaces.'",
      opts: ["A. that", "B. when", "C. where", "D. what"],
      correct: 1
    }
  ];

  let totalInserted = 0;

  for (const item of questions) {
    const bhId = getBh(item.bh);

    const { data: q, error: qErr } = await supabase
      .from("cau_hoi")
      .insert({
        bai_hoc_id: bhId,
        phan: "I",
        muc_do_id: item.muc,
        noi_dung: item.q,
        trang_thai_duyet: "DaDuyet",
        trang_thai_su_dung: "ChuaDung"
      })
      .select("cau_hoi_id")
      .single();

    if (qErr) {
      console.error(`Lỗi chèn câu hỏi: "${item.q.substring(0, 30)}..."`, qErr);
      continue;
    }

    if (q) {
      totalInserted++;
      const options = item.opts.map((optText, index) => ({
        cau_hoi_id: q.cau_hoi_id,
        thu_tu: index + 1,
        noi_dung: optText,
        la_dap_an_dung: index + 1 === item.correct
      }));

      const { error: optErr } = await supabase.from("chi_tiet_cau_hoi").insert(options);
      if (optErr) {
        console.error(`Lỗi chèn lựa chọn cho câu ${q.cau_hoi_id}:`, optErr);
      }
    }
  }

  console.log(`\n🎉 THÀNH CÔNG: Đã tạo và chèn ${totalInserted} câu hỏi trắc nghiệm chuẩn cho môn TIẾNG ANH 12!`);
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
