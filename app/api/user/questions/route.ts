import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sourceType = searchParams.get('sourceType');
  const sourceFileId = searchParams.get('sourceFileId');
  const examType = searchParams.get('examType');
  const questionType = searchParams.get('questionType');
  const difficulty = searchParams.get('difficulty');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  const where: Record<string, any> = { userId: session.user.id };
  if (sourceType) where.sourceType = sourceType;
  if (sourceFileId) where.sourceFileId = sourceFileId;
  if (examType) where.examType = examType;
  if (questionType) where.questionType = questionType;
  if (difficulty) where.difficulty = difficulty;

  const total = await prisma.userQuestion.count({ where });

  const questions = await prisma.userQuestion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return NextResponse.json({
    questions: questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      knowledgePoints: JSON.parse(q.knowledgePoints),
      tags: JSON.parse(q.tags),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const data = await req.json();

    if (!data.content || !data.answer || !data.sourceType) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const question = await prisma.userQuestion.create({
      data: {
        userId: session.user.id,
        sourceType: data.sourceType,
        sourceFileId: data.sourceFileId || '',
        examType: data.examType || '',
        section: data.section || '',
        questionType: data.questionType || '',
        difficulty: data.difficulty || 'medium',
        knowledgePoints: JSON.stringify(data.knowledgePoints || []),
        tags: JSON.stringify(data.tags || []),
        content: data.content,
        options: JSON.stringify(data.options || []),
        answer: data.answer,
        analysis: data.analysis || '',
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Create user question error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('id');

  if (!questionId) {
    return NextResponse.json({ error: '缺少题目ID' }, { status: 400 });
  }

  try {
    const question = await prisma.userQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: '题目不存在' }, { status: 404 });
    }

    if (question.userId !== session.user.id) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }

    await prisma.userQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user question error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
