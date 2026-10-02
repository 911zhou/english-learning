import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getQuestionById } from '@/lib/questions';
import { getExamById } from '@/lib/data';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { count = 20, examType = 'cet4', questionTypes = [] } = body;

    const validCounts = [10, 20, 50];
    if (!validCounts.includes(count)) {
      return NextResponse.json({ error: '题量必须为 10、20 或 50' }, { status: 400 });
    }

    const validExamTypes = ['cet4', 'cet6', 'gaokao'];
    if (!validExamTypes.includes(examType)) {
      return NextResponse.json({ error: '考试类型无效' }, { status: 400 });
    }

    const validQuestionTypes = ['listening', 'reading', 'cloze', 'writing', 'translation'];
    const filteredTypes = questionTypes.filter((t: string) => validQuestionTypes.includes(t));

    const wrongQuestions = await prisma.wrongQuestion.findMany({
      where: { userId },
      orderBy: { count: 'desc' },
    });

    const eligible: Array<{ questionId: string; count: number; type: string }> = [];

    for (const w of wrongQuestions) {
      const q = getQuestionById(w.questionId);
      if (!q) continue;

      const exam = getExamById(q.examId);
      if (!exam || exam.type !== examType) continue;

      if (filteredTypes.length > 0 && !filteredTypes.includes(q.type)) continue;

      eligible.push({ questionId: w.questionId, count: w.count, type: q.type });
    }

    if (eligible.length === 0) {
      return NextResponse.json({ error: '没有符合条件的错题' }, { status: 400 });
    }

    const selected = eligible.slice(0, count);
    const scorePerQuestion = Math.round((100 / selected.length) * 10) / 10;

    const paper = await prisma.customExamPaper.create({
      data: {
        userId,
        title: '我的薄弱突破卷',
        examType,
        duration: Math.max(30, selected.length * 2),
        totalScore: 100,
        questions: {
          create: selected.map((q, idx) => ({
            questionId: q.questionId,
            order: idx + 1,
            score: scorePerQuestion,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      paperId: paper.id,
      questionCount: selected.length,
      totalScore: 100,
    });
  } catch (error) {
    console.error('Generate paper error:', error);
    return NextResponse.json({ error: '生成试卷失败' }, { status: 500 });
  }
}
