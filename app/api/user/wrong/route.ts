import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const wrongQuestions = await prisma.wrongQuestion.findMany({
    where: { userId: session.user.id },
    orderBy: { lastAt: 'desc' },
  });

  return NextResponse.json(
    wrongQuestions.map(w => ({
      id: w.id,
      examId: w.examId,
      questionId: w.questionId,
      userAnswer: w.userAnswer,
      count: w.count,
      lastAt: w.lastAt.toISOString(),
      lastAnswer: w.lastAnswer,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const { examId, questionId, userAnswer } = await req.json();

    const existing = await prisma.wrongQuestion.findUnique({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.wrongQuestion.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          lastAnswer: userAnswer,
          lastAt: new Date(),
        },
      });
      return NextResponse.json({ id: updated.id });
    }

    const created = await prisma.wrongQuestion.create({
      data: {
        userId: session.user.id,
        examId,
        questionId,
        userAnswer,
        lastAnswer: userAnswer,
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (error) {
    console.error('Save wrong question error:', error);
    return NextResponse.json(
      { error: '保存失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');
  const all = searchParams.get('all');

  if (all === 'true') {
    await prisma.wrongQuestion.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ success: true });
  }

  if (questionId) {
    await prisma.wrongQuestion.delete({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId,
        },
      },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: '缺少参数' }, { status: 400 });
}
