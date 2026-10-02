import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const wrongQuestions = await prisma.wrongQuestion.findMany({
    where: { userId },
    orderBy: { count: 'desc' },
  });

  if (wrongQuestions.length === 0) {
    return NextResponse.json({
      totalWrong: 0,
      totalErrors: 0,
      byType: {},
      byExamType: {},
      topWeaknesses: [],
    });
  }

  const typeLabels: Record<string, string> = {
    listening: '听力',
    reading: '阅读',
    cloze: '完形',
    writing: '写作',
    translation: '翻译',
  };

  const typeCount: Record<string, number> = {};
  const typeErrors: Record<string, number> = {};
  const examTypeCount: Record<string, number> = {};
  let totalErrors = 0;

  for (const w of wrongQuestions) {
    const q = getQuestionById(w.questionId);
    if (!q) continue;

    const exam = getExamById(q.examId);
    const examType = exam?.type || 'unknown';
    const qType = q.type;

    examTypeCount[examType] = (examTypeCount[examType] || 0) + w.count;
    typeCount[qType] = (typeCount[qType] || 0) + 1;
    typeErrors[qType] = (typeErrors[qType] || 0) + w.count;
    totalErrors += w.count;
  }

  const byType = Object.entries(typeCount).map(([type, count]) => ({
    type,
    label: typeLabels[type] || type,
    count,
    errors: typeErrors[type] || 0,
    percentage: totalErrors > 0 ? Math.round(((typeErrors[type] || 0) / totalErrors) * 100) : 0,
  })).sort((a, b) => b.errors - a.errors);

  const byExamType = Object.entries(examTypeCount).map(([examType, errors]) => ({
    examType,
    label: examType === 'cet4' ? '四级' : examType === 'cet6' ? '六级' : '高考',
    errors,
  }));

  const topWeaknesses = byType.slice(0, 3);

  return NextResponse.json({
    totalWrong: wrongQuestions.length,
    totalErrors,
    byType,
    byExamType,
    topWeaknesses,
  });
}
