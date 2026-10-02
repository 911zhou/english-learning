import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getExamById } from '@/lib/data';
import { getExamStructure } from '@/lib/exam-config';
import { getUsageSummary } from '@/lib/ai/usage';
import { getUserProfile } from '@/lib/auth/permission';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;
  const today = getDateStr(new Date());

  const [totalExams, results, totalWrong, wrongQuestions, checkins, todayCheckin, userVocabCount, aiUsage, profile] = await Promise.all([
    prisma.examResult.count({ where: { userId } }),
    prisma.examResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 5,
    }),
    prisma.wrongQuestion.count({ where: { userId } }),
    prisma.wrongQuestion.findMany({
      where: { userId },
      select: { examId: true, count: true },
    }),
    prisma.studyCheckin.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 365,
    }),
    prisma.studyCheckin.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.userVocabulary.count({
      where: { userId, status: 'mastered' },
    }),
    getUsageSummary(userId),
    getUserProfile(userId),
  ]);

  let avgAccuracy = 0;
  let bestScoreRate = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  results.forEach(r => {
    const total = r.correctCount + r.wrongCount;
    totalCorrect += r.correctCount;
    totalQuestions += total;
    const maxReported = getExamStructure(r.examId)?.totalReportedScore ?? 710;
    const scoreRate = r.reportedScore > 0 && r.totalScore > 0
      ? (r.reportedScore / maxReported) * 100
      : r.totalScore > 0 ? (r.score / r.totalScore) * 100 : 0;
    if (scoreRate > bestScoreRate) bestScoreRate = scoreRate;
  });

  if (totalQuestions > 0) {
    avgAccuracy = Math.round((totalCorrect / totalQuestions) * 100);
  }

  const examTypeStats: Record<string, number> = {};
  for (const item of checkins) {
    examTypeStats[item.date] = item.questionsDone;
  }

  // Calculate consecutive days
  const checkedInDates = checkins.filter(c => c.checkin).map(c => c.date).sort().reverse();
  let consecutiveDays = 0;
  if (checkedInDates.length > 0) {
    const d = new Date();
    const todayStr = getDateStr(d);
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateStr(yesterday);

    if (checkedInDates[0] === todayStr || checkedInDates[0] === yesterdayStr) {
      consecutiveDays = 1;
      for (let i = 1; i < checkedInDates.length; i++) {
        const prev = new Date(checkedInDates[i - 1]);
        const curr = new Date(checkedInDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          consecutiveDays++;
        } else {
          break;
        }
      }
    }
  }

  // Last 7 days trend
  const last7Days: { date: string; questionsDone: number; wordsLearned: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = getDateStr(d);
    const checkin = checkins.find(c => c.date === dateStr);
    last7Days.push({
      date: dateStr,
      questionsDone: checkin?.questionsDone || 0,
      wordsLearned: checkin?.wordsLearned || 0,
    });
  }

  // Today's stats
  const todayQuestions = todayCheckin?.questionsDone || 0;
  const todayWords = todayCheckin?.wordsLearned || 0;
  const todayCheckedIn = todayCheckin?.checkin || false;

  const wrongByType: Record<string, number> = { cet4: 0, cet6: 0, gaokao: 0 };
  let wrongTotalErrors = 0;
  for (const w of wrongQuestions) {
    wrongTotalErrors += w.count;
    const exam = getExamById(w.examId);
    if (exam) {
      wrongByType[exam.type] = (wrongByType[exam.type] || 0) + 1;
    }
  }

  return NextResponse.json({
    totalExams,
    avgAccuracy,
    bestScoreRate: Math.round(bestScoreRate),
    totalWrong,
    wrongByType,
    wrongTotalErrors,
    recentResults: results.map(r => ({
      id: r.id,
      examId: r.examId,
      score: r.score,
      totalScore: r.totalScore,
      reportedScore: r.reportedScore,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
      isComplete: r.isComplete,
      completedAt: r.completedAt.toISOString(),
    })),
    consecutiveDays,
    todayQuestions,
    todayWords,
    todayCheckedIn,
    totalWordsMastered: userVocabCount,
    last7Days,
    aiUsage,
    profile,
  });
}
