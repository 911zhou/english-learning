import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { addExperience } from '@/lib/auth/permission';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const results = await prisma.examResult.findMany({
    where: { userId: session.user.id },
    orderBy: { completedAt: 'desc' },
  });

  return NextResponse.json(
    results.map(r => ({
      id: r.id,
      examId: r.examId,
      answers: JSON.parse(r.answers),
      score: r.score,
      totalScore: r.totalScore,
      correctCount: r.correctCount,
      wrongCount: r.wrongCount,
      wrongQuestions: JSON.parse(r.wrongQuestions),
      sectionResults: JSON.parse(r.sectionResults),
      reportedScore: r.reportedScore,
      isComplete: r.isComplete,
      examSource: r.examSource,
      completedAt: r.completedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const data = await req.json();

    const result = await prisma.examResult.create({
      data: {
        userId: session.user.id,
        examId: data.examId,
        answers: JSON.stringify(data.answers),
        score: data.score,
        totalScore: data.totalScore,
        correctCount: data.correctCount,
        wrongCount: data.wrongCount,
        wrongQuestions: JSON.stringify(data.wrongQuestions),
        sectionResults: JSON.stringify(data.sectionResults || []),
        reportedScore: data.reportedScore || 0,
        isComplete: data.isComplete || false,
        examSource: data.examSource || 'official',
      },
    });

    const today = getDateStr(new Date());
    const totalQuestions = data.correctCount + data.wrongCount;
    await prisma.studyCheckin.upsert({
      where: { userId_date: { userId: session.user.id, date: today } },
      update: { questionsDone: { increment: totalQuestions } },
      create: {
        userId: session.user.id,
        date: today,
        questionsDone: totalQuestions,
      },
    });

    if (data.isComplete) {
      await addExperience(session.user.id, 'exam');
    }

    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error('Save result error:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}
