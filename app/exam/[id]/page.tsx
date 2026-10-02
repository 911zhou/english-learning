import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExamById, exams } from '@/lib/data';
import { getQuestionsByExam } from '@/lib/questions';
import { getExamStructure } from '@/lib/exam-config';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return exams.map(exam => ({ id: exam.id }));
}

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  const exam = getExamById(params.id);
  if (!exam) notFound();

  const questions = getQuestionsByExam(params.id);
  const structure = getExamStructure(params.id);

  const typeLabels: Record<string, string> = {
    cet4: '四级',
    cet6: '六级',
    gaokao: '高考',
  };

  const typeColors: Record<string, string> = {
    cet4: 'bg-blue-100 text-blue-700',
    cet6: 'bg-purple-100 text-purple-700',
    gaokao: 'bg-green-100 text-green-700',
  };

  const sectionGroups = structure
    ? structure.sections.map(section => {
        const sectionQuestions = questions.filter(q => {
          if (q.type === 'writing') {
            if (q.subtype === 'application-writing') return section.id === 'gaokao-application-writing';
            if (q.subtype === 'continuation') return section.id === 'gaokao-continuation';
            return section.id.endsWith('-writing');
          }
          if (q.type === 'translation') return section.id.endsWith('-translation');
          if (!q.subtype) return false;
          const examType = structure.examType;
          const mapping: Record<string, Record<string, string>> = {
            cet4: {
              'short-dialogue': 'cet4-listening-news',
              'long-dialogue': 'cet4-listening-long',
              passage: 'cet4-listening-passage',
              'reading-match': 'cet4-reading-vocab',
              'reading-long': 'cet4-reading-match',
              'reading-choice': 'cet4-reading-careful',
              cloze: 'cet4-reading-careful',
            },
            cet6: {
              'long-dialogue': 'cet6-listening-long',
              passage: 'cet6-listening-passage',
              lecture: 'cet6-listening-lecture',
              'reading-match': 'cet6-reading-vocab',
              'reading-long': 'cet6-reading-match',
              'reading-choice': 'cet6-reading-careful',
              cloze: 'cet6-reading-careful',
            },
            gaokao: {
              'short-dialogue': 'gaokao-listening',
              'long-dialogue': 'gaokao-listening',
              passage: 'gaokao-listening',
              'reading-choice': 'gaokao-reading-choice',
              'reading-match': 'gaokao-reading-match',
              cloze: 'gaokao-cloze',
              grammar: 'gaokao-grammar',
              'application-writing': 'gaokao-application-writing',
              continuation: 'gaokao-continuation',
            },
          };
          return mapping[examType]?.[q.subtype] === section.id;
        });
        return { section, actualCount: sectionQuestions.length };
      })
    : [];

  const legacySections = !structure
    ? [...new Set(questions.map(q => q.section))]
    : [];

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/exam" className="hover:text-primary-600">真题</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{exam.title}</span>
      </nav>

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className={cn('rounded-full px-3 py-1 text-sm font-medium', typeColors[exam.type])}>
            {typeLabels[exam.type]}
          </span>
          <span className="text-gray-500">{exam.year}年</span>
          {exam.isComplete ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">完整试卷</span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              示例数据 {exam.actualQuestionCount}/{exam.questionCount}题
            </span>
          )}
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">{exam.title}</h1>
        <p className="mb-4 text-gray-600">{exam.description}</p>
        <div className="mb-6 flex flex-wrap gap-6 text-sm text-gray-500">
          <span>题目数量：{questions.length} / {exam.questionCount} 题</span>
          <span>建议时长：{exam.duration} 分钟</span>
          <span>满分：{structure?.totalReportedScore ?? 710} 分{exam.type !== 'gaokao' ? '（报告分）' : ''}</span>
        </div>
        <Link
          href={`/exam/practice?id=${exam.id}`}
          className="inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          开始做题
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">试卷结构</h2>
        {structure ? (
          <div className="grid gap-3 md:grid-cols-2">
            {sectionGroups.map(({ section, actualCount }) => {
              const isComplete = actualCount >= section.questionCount;
              const hasSome = actualCount > 0;
              return (
                <div key={section.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{section.name}</h3>
                    <div className="flex items-center gap-2">
                      {section.isSubjective && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">主观</span>
                      )}
                      {isComplete ? (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">{actualCount}题</span>
                      ) : hasSome ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                          {actualCount}/{section.questionCount}题
                        </span>
                      ) : (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          0/{section.questionCount}题
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{section.partLabel}</span>
                    <span>报告分 {section.reportedScoreTotal}</span>
                    <span>{section.timeMinutes}分钟</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {legacySections.map(section => {
              const sectionQuestions = questions.filter(q => q.section === section);
              return (
                <div key={section} className="rounded-lg border bg-white p-4">
                  <h3 className="mb-2 font-semibold text-gray-900">{section}</h3>
                  <p className="text-sm text-gray-600">
                    {sectionQuestions.length} 题
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">题目预览</h2>
        <div className="space-y-3">
          {questions.slice(0, 5).map(q => (
            <div key={q.id} className="rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  第{q.number}题
                </span>
                <span className="text-xs text-gray-500">{q.section}</span>
              </div>
              <p className="text-sm text-gray-700">{q.content}</p>
            </div>
          ))}
        </div>
        {questions.length > 5 && (
          <p className="mt-4 text-center text-sm text-gray-500">
            还有 {questions.length - 5} 题，点击"开始做题"查看全部
          </p>
        )}
      </div>
    </div>
  );
}
