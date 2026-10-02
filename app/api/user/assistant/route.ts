import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateStr(d);
}

function getTodayStr(): string {
  return getDateStr(new Date());
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;
  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();

  const [
    wrongQuestions,
    examResults,
    userVocabularies,
    writingRecords,
    listeningRecords,
    yesterdayCheckin,
    todayPlan,
    yesterdayExamResults,
    totalExams,
  ] = await Promise.all([
    prisma.wrongQuestion.findMany({ where: { userId } }),
    prisma.examResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
    prisma.userVocabulary.findMany({
      where: { userId },
      orderBy: { lastReviewAt: 'desc' },
      take: 50,
    }),
    prisma.writingRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.listeningRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.studyCheckin.findUnique({
      where: { userId_date: { userId, date: yesterdayStr } },
    }),
    prisma.studyPlan.findUnique({
      where: { userId_date: { userId, date: todayStr } },
    }),
    prisma.examResult.count({
      where: {
        userId,
        completedAt: {
          gte: new Date(yesterdayStr + 'T00:00:00'),
          lt: new Date(todayStr + 'T00:00:00'),
        },
      },
    }),
    prisma.examResult.count({ where: { userId } }),
  ]);

  const weakness = buildWeakness(wrongQuestions);
  const todayTasks = buildTodayTasks(weakness, todayPlan, wrongQuestions, userVocabularies);
  const summary = buildYesterdaySummary(yesterdayCheckin, yesterdayExamResults, writingRecords);
  const recommendations = generateRecommendations(weakness, examResults, userVocabularies, writingRecords, listeningRecords, totalExams);

  return NextResponse.json({
    weakness,
    todayTasks,
    summary,
    recommendations,
  });
}

interface WeaknessData {
  abilities: Array<{
    type: string;
    label: string;
    stars: number;
    errors: number;
    count: number;
    percentage: number;
  }>;
  totalWrong: number;
  totalErrors: number;
}

function buildWeakness(wrongQuestions: Array<{ questionId: string; count: number }>): WeaknessData {
  const typeLabels: Record<string, string> = {
    listening: '听力',
    reading: '阅读',
    cloze: '词汇',
    writing: '写作',
    translation: '翻译',
  };

  const typeCount: Record<string, number> = {};
  const typeErrors: Record<string, number> = {};
  let totalErrors = 0;

  for (const w of wrongQuestions) {
    const q = getQuestionById(w.questionId);
    if (!q) continue;
    const exam = getExamById(q.examId);
    if (!exam || (exam.type !== 'cet4' && exam.type !== 'cet6' && exam.type !== 'gaokao')) continue;

    typeCount[q.type] = (typeCount[q.type] || 0) + 1;
    typeErrors[q.type] = (typeErrors[q.type] || 0) + w.count;
    totalErrors += w.count;
  }

  const total = wrongQuestions.length;
  const abilities = Object.entries(typeCount).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    stars: starRating(typeErrors[type] || 0, total - count),
    errors: typeErrors[type] || 0,
    count,
    percentage: totalErrors > 0 ? Math.round(((typeErrors[type] || 0) / totalErrors) * 100) : 0,
  })).sort((a, b) => b.errors - a.errors);

  const allTypes = ['reading', 'cloze', 'listening', 'writing', 'translation'];
  for (const t of allTypes) {
    if (!abilities.find(a => a.type === t)) {
      abilities.push({
        type: t,
        label: typeLabels[t] || t,
        stars: 5,
        errors: 0,
        count: 0,
        percentage: 0,
      });
    }
  }

  abilities.sort((a, b) => a.errors - b.errors);

  return {
    abilities,
    totalWrong: wrongQuestions.length,
    totalErrors,
  };
}

interface TodayTask {
  title: string;
  description: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

function buildTodayTasks(
  weakness: WeaknessData,
  todayPlan: { wordsTarget: number; questionsTarget: number; readingTarget: number; completedWords: number; completedQuestions: number; completedReading: number } | null,
  wrongQuestions: Array<{ questionId: string; count: number }>,
  userVocabularies: Array<{ vocabularyId: string; status: string }>,
): TodayTask[] {
  const tasks: TodayTask[] = [];

  const topWeakness = weakness.abilities.find(a => a.errors > 0);
  if (topWeakness) {
    const typeLabel = topWeakness.label;
    tasks.push({
      title: `完成${typeLabel}专项10题`,
      description: `你的${typeLabel}薄弱，建议重点练习`,
      href: '/vocabulary/wrong',
      priority: 'high',
      icon: '🎯',
    });
  }

  const newWords = userVocabularies.filter(v => v.status === 'new').length;
  const wordsTarget = todayPlan?.wordsTarget ?? 20;
  const wordsDone = todayPlan?.completedWords ?? 0;
  const wordsRemaining = Math.max(0, wordsTarget - wordsDone);
  if (wordsRemaining > 0) {
    tasks.push({
      title: `复习${wordsRemaining}个单词`,
      description: newWords > 0 ? `有${newWords}个新词待学习` : '巩固已学单词',
      href: '/vocabulary/daily',
      priority: wordsRemaining > 10 ? 'high' : 'medium',
      icon: '📖',
    });
  }

  if (wrongQuestions.length > 0) {
    const qTarget = todayPlan?.questionsTarget ?? 10;
    const qDone = todayPlan?.completedQuestions ?? 0;
    const qRemaining = Math.max(0, qTarget - qDone);
    if (qRemaining > 0) {
      tasks.push({
        title: `复习${Math.min(qRemaining, wrongQuestions.length)}道错题`,
        description: `共${wrongQuestions.length}道错题待巩固`,
        href: '/vocabulary/wrong/practice',
        priority: 'medium',
        icon: '📝',
      });
    }
  }

  const readingDone = todayPlan?.completedReading ?? 0;
  const readingTarget = todayPlan?.readingTarget ?? 1;
  if (readingDone < readingTarget) {
    tasks.push({
      title: '完成1篇阅读练习',
      description: '保持每日阅读习惯',
      href: '/exam',
      priority: 'low',
      icon: '📚',
    });
  }

  tasks.push({
    title: '完成1篇作文',
    description: '锻炼英语写作能力',
    href: '/writing',
    priority: 'low',
    icon: '✍️',
  });

  return tasks;
}

interface YesterdaySummary {
  wordsStudied: number;
  questionsDone: number;
  examsTaken: number;
  writingsDone: number;
}

function buildYesterdaySummary(
  checkin: { questionsDone: number; wordsLearned: number } | null,
  yesterdayExamCount: number,
  writingRecords: Array<{ createdAt: Date }>,
): YesterdaySummary {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);

  const writingsYesterday = writingRecords.filter(w => {
    const t = new Date(w.createdAt).getTime();
    return t >= yesterdayStart.getTime() && t < yesterdayEnd.getTime();
  }).length;

  return {
    wordsStudied: checkin?.wordsLearned || 0,
    questionsDone: checkin?.questionsDone || 0,
    examsTaken: yesterdayExamCount,
    writingsDone: writingsYesterday,
  };
}

function generateRecommendations(
  weakness: WeaknessData,
  examResults: Array<{ score: number; totalScore: number; correctCount: number; wrongCount: number; completedAt: Date }>,
  userVocabularies: Array<{ status: string }>,
  writingRecords: Array<{ score: number }>,
  listeningRecords: Array<unknown>,
  totalExams: number,
): string[] {
  const recs: string[] = [];

  const weakest = weakness.abilities.find(a => a.errors > 0);
  if (weakest && weakest.stars <= 2) {
    recs.push(`你的${weakest.label}能力较弱（${weakest.percentage}%错误集中在此），建议每天至少练习10道${weakest.label}题，重点攻克薄弱环节。`);
  } else if (weakest && weakest.stars <= 3) {
    recs.push(`你的${weakest.label}还有提升空间，建议增加${weakest.label}练习量，每周至少完成3套${weakest.label}专项训练。`);
  }

  if (examResults.length > 0) {
    const recent3 = examResults.slice(0, 3);
    const avgRate = recent3.reduce((s, r) => s + r.correctCount / (r.correctCount + r.wrongCount), 0) / recent3.length;
    if (avgRate < 0.6) {
      recs.push('最近考试正确率偏低，建议先回顾错题本，理解错误原因后再进行新练习。');
    } else if (avgRate >= 0.8) {
      recs.push('最近考试表现优秀！可以尝试提高难度，挑战更高级别的题目。');
    }

    if (examResults.length >= 2) {
      const latest = examResults[0];
      const prev = examResults[1];
      const latestRate = latest.correctCount / (latest.correctCount + latest.wrongCount);
      const prevRate = prev.correctCount / (prev.correctCount + prev.wrongCount);
      if (latestRate > prevRate + 0.05) {
        recs.push('你的成绩呈上升趋势，继续保持当前的学习节奏！');
      } else if (latestRate < prevRate - 0.05) {
        recs.push('最近成绩有所波动，建议回顾之前的错题，巩固基础知识。');
      }
    }
  }

  const mastered = userVocabularies.filter(v => v.status === 'mastered').length;
  const total = userVocabularies.length;
  if (total > 0 && mastered / total < 0.3) {
    recs.push('词汇掌握率偏低，建议每天坚持学习20个新单词，并定期复习旧单词。');
  } else if (mastered > 50) {
    recs.push(`已掌握${mastered}个单词，词汇基础扎实，可以开始挑战更高难度的阅读材料。`);
  }

  if (writingRecords.length === 0) {
    recs.push('还没有进行过写作练习，建议每周至少写1篇英语作文，提升表达能力。');
  } else if (writingRecords.length > 0) {
    const avgScore = writingRecords.reduce((s, w) => s + w.score, 0) / writingRecords.length;
    if (avgScore < 70) {
      recs.push('写作分数有提升空间，建议多阅读范文，积累高级表达和句型。');
    }
  }

  if (totalExams < 3) {
    recs.push('完成的考试还比较少，建议每周至少完成1套完整试卷，熟悉考试节奏。');
  }

  if (listeningRecords.length === 0) {
    recs.push('还没有听力练习记录，建议每天听15分钟英语材料，提升听力理解能力。');
  }

  if (recs.length === 0) {
    recs.push('学习状态良好，保持当前的学习节奏，持续进步！');
  }

  return recs.slice(0, 5);
}
