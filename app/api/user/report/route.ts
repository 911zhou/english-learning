import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const [checkins, wrongQuestions, examResults, vocabCount] = await Promise.all([
    prisma.studyCheckin.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    prisma.wrongQuestion.findMany({
      where: { userId },
    }),
    prisma.examResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.userVocabulary.count({
      where: { userId, status: 'mastered' },
    }),
  ]);

  const last7Days: Array<{
    date: string;
    questionsDone: number;
    wordsLearned: number;
    accuracy: number;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getDateStr(d);
    const checkin = checkins.find(c => c.date === dateStr);
    const total = checkin?.questionsDone || 0;
    const dayResults = examResults.filter(r => {
      const rDate = getDateStr(new Date(r.completedAt));
      return rDate === dateStr;
    });
    let dayCorrect = 0;
    let dayTotal = 0;
    dayResults.forEach(r => {
      dayCorrect += r.correctCount;
      dayTotal += r.correctCount + r.wrongCount;
    });
    const accuracy = dayTotal > 0 ? Math.round((dayCorrect / dayTotal) * 100) : (total > 0 ? 60 : 0);
    last7Days.push({
      date: dateStr,
      questionsDone: total,
      wordsLearned: checkin?.wordsLearned || 0,
      accuracy,
    });
  }

  let readingCount = 0;
  let readingErrors = 0;
  let clozeCount = 0;
  let clozeErrors = 0;
  let grammarCount = 0;
  let grammarErrors = 0;
  let listeningCount = 0;
  let listeningErrors = 0;

  for (const wq of wrongQuestions) {
    const q = getQuestionById(wq.questionId);
    if (!q) continue;
    const exam = getExamById(q.examId);
    if (exam?.type !== 'cet4' && exam?.type !== 'cet6' && exam?.type !== 'gaokao') continue;

    if (q.type === 'reading') {
      readingCount++;
      readingErrors += wq.count;
    } else if (q.type === 'cloze' || q.subtype === 'cloze') {
      clozeCount++;
      clozeErrors += wq.count;
    } else if (q.subtype === 'grammar') {
      grammarCount++;
      grammarErrors += wq.count;
    } else if (q.type === 'listening') {
      listeningCount++;
      listeningErrors += wq.count;
    }
  }

  function starRating(errorCount: number, totalCount: number): number {
    if (totalCount === 0) return 5;
    const errorRate = errorCount / (totalCount + errorCount);
    if (errorRate < 0.1) return 5;
    if (errorRate < 0.2) return 4;
    if (errorRate < 0.35) return 3;
    if (errorRate < 0.5) return 2;
    return 1;
  }

  const abilityAnalysis = {
    reading: { stars: starRating(readingErrors, wrongQuestions.length - readingCount), errors: readingErrors, count: readingCount },
    vocabulary: { stars: starRating(clozeErrors, wrongQuestions.length - clozeCount), errors: clozeErrors, count: clozeCount },
    grammar: { stars: starRating(grammarErrors, wrongQuestions.length - grammarCount), errors: grammarErrors, count: grammarCount },
    listening: { stars: starRating(listeningErrors, wrongQuestions.length - listeningCount), errors: listeningErrors, count: listeningCount },
  };

  const totalQuestions7d = last7Days.reduce((s, d) => s + d.questionsDone, 0);
  const totalWords7d = last7Days.reduce((s, d) => s + d.wordsLearned, 0);
  const avgAccuracy7d = last7Days.filter(d => d.accuracy > 0).length > 0
    ? Math.round(last7Days.filter(d => d.accuracy > 0).reduce((s, d) => s + d.accuracy, 0) / last7Days.filter(d => d.accuracy > 0).length)
    : 0;

  const wrongTrend = last7Days.map((day, i) => {
    if (i === 0) return { date: day.date, newWrong: 0 };
    return { date: day.date, newWrong: 0 };
  });

  for (const wq of wrongQuestions) {
    const lastAtStr = getDateStr(new Date(wq.lastAt));
    const entry = wrongTrend.find(t => t.date === lastAtStr);
    if (entry) {
      entry.newWrong += wq.count;
    }
  }

  return NextResponse.json({
    last7Days,
    totalQuestions7d,
    totalWords7d,
    avgAccuracy7d,
    abilityAnalysis,
    wrongTrend,
    totalWrongQuestions: wrongQuestions.length,
    totalWordsMastered: vocabCount,
    totalExamsTaken: examResults.length,
  });
}
