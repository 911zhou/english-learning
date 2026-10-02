import Link from 'next/link';
import { getExamsByType, getExamById } from '@/lib/data';
import { getQuestionsByExam } from '@/lib/questions';
import { cn } from '@/lib/utils';

const cet4Tips = [
  {
    title: '写作 (15%)',
    score: '106.5分',
    time: '30分钟',
    tips: ['审题要准确，明确写作类型（议论文/说明文/书信）', '结构清晰：开头点题、主体展开、结尾总结', '使用连接词增强逻辑性：however, moreover, therefore', '字数控制在120-180词，注意语法和拼写'],
  },
  {
    title: '听力 (35%)',
    score: '248.5分',
    time: '25分钟',
    tips: ['预读选项，预测对话主题和问题', '注意转折词 but, however, actually 后的内容', '短对话抓关键词，长对话注意说话人态度', '新闻听力关注首句，通常包含核心信息'],
  },
  {
    title: '阅读 (35%)',
    score: '248.5分',
    time: '40分钟',
    tips: ['先读题目再读文章，带着问题找答案', '注意段落首尾句，通常包含主题句', '词汇理解题结合上下文推断词义', '选词填空先判断词性，再根据语境选择'],
  },
  {
    title: '翻译 (15%)',
    score: '106.5分',
    time: '30分钟',
    tips: ['先通读全文，理解整体意思再动笔', '注意中文特有表达的英文转换', '使用恰当的从句和连接词使译文流畅', '检查语法、拼写和标点'],
  },
];

export default function CET4Page() {
  const cet4Exams = getExamsByType('cet4');

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8">
        <div className="mb-2 text-sm text-gray-500">
          <Link href="/exam" className="hover:text-primary-600">真题</Link>
          <span className="mx-2">/</span>
          <span>四级</span>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900">大学英语四级 (CET-4)</h1>
        <p className="text-gray-600">
          全国大学英语四级考试，总分710分，考试时间130分钟。
          涵盖写作、听力、阅读和翻译四大题型。
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {[
          { label: '总分', value: '710', color: 'primary' },
          { label: '考试时间', value: '130分钟', color: 'blue' },
          { label: '及格线', value: '425', color: 'green' },
          { label: '可用真题', value: `${cet4Exams.length}套`, color: 'amber' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-4 text-center shadow-sm">
            <div className={cn(
              'text-2xl font-bold',
              stat.color === 'primary' && 'text-primary-600',
              stat.color === 'blue' && 'text-blue-600',
              stat.color === 'green' && 'text-green-600',
              stat.color === 'amber' && 'text-amber-600',
            )}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">可用真题</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {cet4Exams.map((exam) => {
            const questionCount = getQuestionsByExam(exam.id).length;
            const hasQuestions = questionCount > 0;
            return (
              <div
                key={exam.id}
                className={cn(
                  'group relative rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
                  !hasQuestions && 'opacity-70'
                )}
              >
                <Link
                  href={hasQuestions ? `/exam/practice?id=${exam.id}` : `/exam/${exam.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={exam.title}
                />
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    四级
                  </span>
                </div>
                <p className="mb-3 text-sm text-gray-600">{exam.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4 text-gray-500">
                    <span>{exam.questionCount}题</span>
                    <span>{exam.duration}分钟</span>
                  </div>
                  {hasQuestions ? (
                    <span className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white">
                      {questionCount}题可练
                    </span>
                  ) : (
                    <span className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                      题目筹备中
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">题型与分值</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {cet4Tips.map((section) => (
            <div key={section.title} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                <div className="text-right">
                  <span className="text-sm font-medium text-primary-600">{section.score}</span>
                  <span className="ml-2 text-sm text-gray-500">{section.time}</span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-primary-50 p-6">
        <h2 className="mb-3 text-lg font-bold text-primary-900">备考建议</h2>
        <ul className="space-y-2 text-sm text-primary-800">
          <li>• 每天坚持做一套真题，保持做题手感</li>
          <li>• 重点突破薄弱环节，听力弱就每天精听30分钟</li>
          <li>• 积累高频词汇和短语，尤其是阅读和翻译中的常见表达</li>
          <li>• 写作和翻译要动手练习，不能只看不写</li>
          <li>• 考前模拟完整考试流程，控制时间分配</li>
        </ul>
      </div>
    </div>
  );
}
