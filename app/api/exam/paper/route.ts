import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isVIP } from '@/lib/auth/permission';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (!(await isVIP(session.user.id))) {
    return NextResponse.json({ error: '仅 VIP 用户可使用此功能' }, { status: 403 });
  }

  const papers = await prisma.customExamPaper.findMany({
    where: { userId: session.user.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(papers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  if (!(await isVIP(session.user.id))) {
    return NextResponse.json({ error: '仅 VIP 用户可使用此功能' }, { status: 403 });
  }

  try {
    const { title, examType, duration, totalScore, questions } = await req.json();

    if (!title || !examType || !duration || !totalScore || !questions?.length) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const paper = await prisma.customExamPaper.create({
      data: {
        userId: session.user.id,
        title,
        examType,
        duration,
        totalScore,
        questions: {
          create: questions.map((q: { questionId: string; score: number }, idx: number) => ({
            questionId: q.questionId,
            order: idx + 1,
            score: q.score,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(paper);
  } catch (error) {
    console.error('Create custom paper error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get('id');

  if (!paperId) {
    return NextResponse.json({ error: '缺少试卷ID' }, { status: 400 });
  }

  try {
    const paper = await prisma.customExamPaper.findUnique({
      where: { id: paperId },
    });

    if (!paper) {
      return NextResponse.json({ error: '试卷不存在' }, { status: 404 });
    }

    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    await prisma.customExamPaper.delete({
      where: { id: paperId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete custom paper error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
