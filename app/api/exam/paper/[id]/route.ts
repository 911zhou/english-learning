import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQuestionById } from '@/lib/questions';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { id } = await params;

  const paper = await prisma.customExamPaper.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!paper) {
    return NextResponse.json({ error: '试卷不存在' }, { status: 404 });
  }

  if (paper.userId !== session.user.id) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const questionsWithDetails = paper.questions.map(pq => {
    const question = getQuestionById(pq.questionId);
    return {
      ...pq,
      question,
    };
  });

  return NextResponse.json({
    ...paper,
    questions: questionsWithDetails,
  });
}
