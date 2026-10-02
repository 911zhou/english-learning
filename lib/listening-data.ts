export interface ListeningPaperData {
  id: string;
  examType: 'cet4' | 'cet6' | 'gaokao';
  year: string;
  title: string;
  audioUrl: string;
  questions: ListeningQuestionData[];
}

export interface ListeningQuestionData {
  id: string;
  paperId: string;
  number: number;
  content: string;
  options: string[];
  answer: string;
  transcript: string;
  analysis: string;
}

export const listeningPapers: ListeningPaperData[] = [
  {
    id: 'listening-cet4-2024-06',
    examType: 'cet4',
    year: '2024年6月',
    title: 'CET-4 2024年6月听力模拟',
    audioUrl: '',
    questions: [
      {
        id: 'listening-cet4-2024-06-q1',
        paperId: 'listening-cet4-2024-06',
        number: 1,
        content: 'What does the man mean?',
        options: [
          'A) He wants to go to the concert.',
          'B) He has already bought the tickets.',
          'C) He is too busy to go.',
          'D) He doesn\'t like the band.',
        ],
        answer: 'C',
        transcript: 'W: Would you like to go to the concert tonight? The tickets are still available.\nM: I\'d love to, but I have a paper due tomorrow morning. I\'ll have to pass this time.',
        analysis: '男士说"I\'d love to, but..."表示他想去但去不了，因为明天早上有论文要交。"I\'ll have to pass"意为"我不得不放弃这次机会"，说明他太忙了。',
      },
      {
        id: 'listening-cet4-2024-06-q2',
        paperId: 'listening-cet4-2024-06',
        number: 2,
        content: 'Where does the conversation most likely take place?',
        options: [
          'A) In a library.',
          'B) In a bookstore.',
          'C) In a classroom.',
          'D) In a hospital.',
        ],
        answer: 'A',
        transcript: 'M: Excuse me, could you tell me where I can find books on modern art?\nW: Sure, they\'re on the third floor, in the east wing. You can take the elevator over there.',
        analysis: '对话中男士询问在哪里可以找到现代艺术方面的书，女士指引他去三楼东区，并提到可以乘坐电梯。这些关键词（books, floor, elevator）表明对话发生在图书馆。',
      },
      {
        id: 'listening-cet4-2024-06-q3',
        paperId: 'listening-cet4-2024-06',
        number: 3,
        content: 'What will the woman probably do?',
        options: [
          'A) Drive to the airport.',
          'B) Take a taxi.',
          'C) Catch the bus.',
          'D) Walk to the station.',
        ],
        answer: 'B',
        transcript: 'W: My flight leaves at 3 p.m. and it\'s already 1 p.m. The airport is 40 miles away.\nM: Don\'t worry. I\'ll call a cab for you. It should take about 45 minutes in this traffic.',
        analysis: '女士的航班下午3点起飞，现在已经下午1点了，机场在40英里外。男士说"我来帮你叫出租车"，大约需要45分钟。因此女士很可能会坐出租车去机场。',
      },
      {
        id: 'listening-cet4-2024-06-q4',
        paperId: 'listening-cet4-2024-06',
        number: 4,
        content: 'What is the woman\'s opinion about the restaurant?',
        options: [
          'A) The food was excellent.',
          'B) The service was slow.',
          'C) The price was reasonable.',
          'D) The atmosphere was great.',
        ],
        answer: 'B',
        transcript: 'M: How was the new Italian restaurant downtown? My friends said the food was amazing.\nW: The food was good, I\'ll give them that. But we waited 40 minutes for our main course. That\'s just too long.',
        analysis: '女士承认食物不错（"The food was good"），但抱怨等了40分钟才上主菜，认为太久了。这表明她对服务速度不满意。',
      },
      {
        id: 'listening-cet4-2024-06-q5',
        paperId: 'listening-cet4-2024-06',
        number: 5,
        content: 'Why did the man decide to change his major?',
        options: [
          'A) He failed his courses.',
          'B) He found a better job opportunity.',
          'C) He lost interest in his original major.',
          'D) His parents advised him to.',
        ],
        answer: 'C',
        transcript: 'W: I heard you switched from engineering to psychology. What happened?\nM: I realized I was spending more time reading psychology books than doing my engineering homework. I just wasn\'t passionate about it anymore.',
        analysis: '男士说自己花更多时间读心理学书而不是做工程作业，并且"wasn\'t passionate about it anymore"（不再对原来的专业有热情了），说明他是因为失去了对原专业的兴趣而转专业。',
      },
    ],
  },
  {
    id: 'listening-cet6-2024-06',
    examType: 'cet6',
    year: '2024年6月',
    title: 'CET-6 2024年6月听力模拟',
    audioUrl: '',
    questions: [
      {
        id: 'listening-cet6-2024-06-q1',
        paperId: 'listening-cet6-2024-06',
        number: 1,
        content: 'What is the main topic of the lecture?',
        options: [
          'A) The history of renewable energy.',
          'B) The impact of climate change on agriculture.',
          'C) New technologies in solar power.',
          'D) Government policies on carbon emissions.',
        ],
        answer: 'B',
        transcript: 'Good morning, everyone. Today we\'ll be discussing how rising temperatures and changing precipitation patterns are affecting crop yields worldwide. We\'ll look at recent studies from the UN Food and Agriculture Organization and examine case studies from Southeast Asia and Sub-Saharan Africa...',
        analysis: '讲座开头提到"rising temperatures and changing precipitation patterns are affecting crop yields worldwide"（气温上升和降水模式变化如何影响全球粮食产量），并提到联合国粮农组织的研究以及东南亚和撒哈拉以南非洲的案例，这些都指向气候变化对农业的影响。',
      },
      {
        id: 'listening-cet6-2024-06-q2',
        paperId: 'listening-cet6-2024-06',
        number: 2,
        content: 'According to the speaker, what is the biggest challenge facing electric vehicles?',
        options: [
          'A) High manufacturing costs.',
          'B) Limited charging infrastructure.',
          'C) Short battery lifespan.',
          'D) Consumer resistance to new technology.',
        ],
        answer: 'B',
        transcript: 'While battery technology has improved dramatically and prices have dropped by over 80% in the last decade, the real bottleneck remains the charging network. In rural areas and smaller cities, finding a charging station can still be a major inconvenience, which significantly limits the practical range of electric vehicles for many potential buyers.',
        analysis: '演讲者指出虽然电池技术大幅进步、价格下降超过80%，但真正的瓶颈（bottleneck）在于充电网络（charging network）。在农村和小城市找充电站仍然很不方便，这限制了电动车的实际使用范围。',
      },
      {
        id: 'listening-cet6-2024-06-q3',
        paperId: 'listening-cet6-2024-06',
        number: 3,
        content: 'What does the professor suggest students do to improve their academic writing?',
        options: [
          'A) Read more research papers.',
          'B) Attend writing workshops.',
          'C) Practice writing summaries.',
          'D) Use online grammar tools.',
        ],
        answer: 'A',
        transcript: 'One of the most effective ways to become a better academic writer is to immerse yourself in the literature of your field. Read extensively, pay attention to how experienced researchers structure their arguments, how they present evidence, and how they acknowledge limitations. This kind of reading isn\'t just for content — it\'s a masterclass in writing style.',
        analysis: '教授建议"immerse yourself in the literature of your field"（沉浸在你所在领域的文献中），广泛阅读，注意经验丰富的研究者如何组织论点、呈现证据和承认局限性。这种阅读不仅是为了内容，更是写作风格的大师课。因此建议是阅读更多研究论文。',
      },
      {
        id: 'listening-cet6-2024-06-q4',
        paperId: 'listening-cet6-2024-06',
        number: 4,
        content: 'What can be inferred about the company\'s future plans?',
        options: [
          'A) They will reduce their workforce.',
          'B) They plan to expand into Asian markets.',
          'C) They will focus on product development.',
          'D) They intend to merge with a competitor.',
        ],
        answer: 'B',
        transcript: 'CEO: We\'ve seen tremendous growth in our European operations, and we\'re now looking eastward. Our market research shows significant untapped potential in Japan, South Korea, and Southeast Asia. We expect to announce our Asia-Pacific strategy by the end of Q3.',
        analysis: 'CEO提到在欧洲业务取得了巨大增长，现在"looking eastward"（看向东方），市场研究显示日本、韩国和东南亚有巨大的未开发潜力，预计第三季度末公布亚太战略。可以推断公司计划扩展到亚洲市场。',
      },
      {
        id: 'listening-cet6-2024-06-q5',
        paperId: 'listening-cet6-2024-06',
        number: 5,
        content: 'What is the woman\'s attitude toward remote work?',
        options: [
          'A) She strongly opposes it.',
          'B) She sees both advantages and disadvantages.',
          'C) She thinks it should be mandatory.',
          'D) She prefers it over office work entirely.',
        ],
        answer: 'B',
        transcript: 'W: I think remote work has its merits — the flexibility is great, and I\'ve definitely been more productive on certain tasks. But I also miss the spontaneous conversations with colleagues, the brainstorming sessions that happen naturally in an office. I think a hybrid model would be ideal.',
        analysis: '女士认为远程工作有其优点（flexibility, productive），但也提到了缺点（miss spontaneous conversations, brainstorming sessions），最后说"hybrid model would be ideal"（混合模式最理想）。这表明她看到了远程工作的利弊两面。',
      },
    ],
  },
  {
    id: 'listening-gaokao-2024',
    examType: 'gaokao',
    year: '2024年',
    title: '高考英语听力模拟',
    audioUrl: '',
    questions: [
      {
        id: 'listening-gaokao-2024-q1',
        paperId: 'listening-gaokao-2024',
        number: 1,
        content: 'What time will the meeting start?',
        options: [
          'A) At 9:00.',
          'B) At 9:30.',
          'C) At 10:00.',
          'D) At 10:30.',
        ],
        answer: 'B',
        transcript: 'M: The meeting was supposed to start at 9, but the manager asked to push it back half an hour.\nW: OK, I\'ll let the others know.',
        analysis: '男士说会议原定9点开始，但经理要求推迟半小时（push it back half an hour），所以会议将在9:30开始。',
      },
      {
        id: 'listening-gaokao-2024-q2',
        paperId: 'listening-gaokao-2024',
        number: 2,
        content: 'What is the relationship between the speakers?',
        options: [
          'A) Teacher and student.',
          'B) Doctor and patient.',
          'C) Husband and wife.',
          'D) Boss and secretary.',
        ],
        answer: 'C',
        transcript: 'W: Honey, can you pick up the kids from school today? I have a meeting that might run late.\nM: Sure, no problem. I\'ll leave work early.',
        analysis: '女士称呼对方"Honey"（亲爱的），并提到接孩子放学，男士说没问题会早下班。从称呼和内容可以判断他们是夫妻关系。',
      },
      {
        id: 'listening-gaokao-2024-q3',
        paperId: 'listening-gaokao-2024',
        number: 3,
        content: 'How much will the woman pay?',
        options: [
          'A) $20.',
          'B) $36.',
          'C) $40.',
          'D) $60.',
        ],
        answer: 'B',
        transcript: 'W: How much is the shirt?\nM: It\'s $40, but we have a 10% discount today.\nW: Great, I\'ll take it then.',
        analysis: '衬衫原价$40，今天有9折优惠（10% discount），所以实际支付 $40 × 0.9 = $36。',
      },
      {
        id: 'listening-gaokao-2024-q4',
        paperId: 'listening-gaokao-2024',
        number: 4,
        content: 'What does the man want to do?',
        options: [
          'A) Return a book.',
          'B) Renew a library card.',
          'C) Borrow a magazine.',
          'D) Reserve a study room.',
        ],
        answer: 'A',
        transcript: 'M: Hi, I\'d like to return these books. I think they\'re a few days overdue.\nW: Let me check... Yes, they\'re three days late. There\'ll be a small fine of 30 cents.\nM: That\'s fine. Here you go.',
        analysis: '男士说"return these books"（归还这些书），并且已经逾期几天。女士说有30美分的罚款。男士表示没问题。因此男士想要还书。',
      },
      {
        id: 'listening-gaokao-2024-q5',
        paperId: 'listening-gaokao-2024',
        number: 5,
        content: 'Where are the speakers going?',
        options: [
          'A) To a restaurant.',
          'B) To a cinema.',
          'C) To a park.',
          'D) To a museum.',
        ],
        answer: 'D',
        transcript: 'W: The exhibition opens at 10. We still have 20 minutes.\nM: Let\'s grab a coffee nearby while we wait. I don\'t want to stand in line hungry.',
        analysis: '女士说展览（exhibition）10点开门，还有20分钟。男士提议先喝杯咖啡等。exhibition（展览）这个关键词表明他们要去博物馆。',
      },
    ],
  },
];

export function getListeningPaperById(id: string): ListeningPaperData | undefined {
  return listeningPapers.find(p => p.id === id);
}

export function getListeningPapersByType(examType: string): ListeningPaperData[] {
  return listeningPapers.filter(p => p.examType === examType);
}

export function getAllListeningPapers(): ListeningPaperData[] {
  return listeningPapers;
}
