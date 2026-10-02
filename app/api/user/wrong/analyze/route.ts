import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { analyzeQuestion } from '@/lib/ai';
import { getQuestionById } from '@/lib/questions';
import { checkUsageLimit, incrementUsage } from '@/lib/ai/usage';
import { computeHash, getCachedResponse, saveToCache } from '@/lib/ai/cache';
import { addExperience } from '@/lib/auth/permission';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { questionId } = await req.json();
  if (!questionId) {
    return NextResponse.json({ error: '缺少题目ID' }, { status: 400 });
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 });
  }

  const userId = session.user.id;

  const existing = await prisma.wrongQuestionAnalysis.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      wrongQuestionId: existing.questionId,
      correctAnswer: existing.correctAnswer,
      analysis: existing.analysis,
      wrongOptionsAnalysis: JSON.parse(existing.wrongOptions),
      knowledgePoints: JSON.parse(existing.knowledgePoints),
      exampleSentences: JSON.parse(existing.exampleSentences),
      createdAt: existing.createdAt.toISOString(),
    });
  }

  const contentHash = computeHash(questionId);

  const cached = await getCachedResponse('analysis', contentHash);
  if (cached) {
    return NextResponse.json({
      ...(cached as object),
      wrongQuestionId: questionId,
      cached: true,
    });
  }

  const { allowed, remaining } = await checkUsageLimit(userId, 'analysis');
  if (!allowed) {
    return NextResponse.json({ error: `今日错题解析次数已用完（每日限20次），剩余${remaining}次` }, { status: 429 });
  }

  const analysis = await analyzeQuestion(question, questionId);

  await saveToCache('analysis', contentHash, analysis);
  await incrementUsage(userId, 'analysis');

  await prisma.wrongQuestionAnalysis.create({
    data: {
      userId,
      questionId,
      correctAnswer: analysis.correctAnswer,
      analysis: analysis.analysis,
      wrongOptions: JSON.stringify(analysis.wrongOptionsAnalysis || []),
      knowledgePoints: JSON.stringify(analysis.knowledgePoints),
      exampleSentences: JSON.stringify(analysis.exampleSentences),
    },
  });

  await addExperience(userId, 'wrong_review');

  return NextResponse.json(analysis);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get('questionId');

  if (!questionId) {
    return NextResponse.json({ error: '缺少题目ID' }, { status: 400 });
  }

  const existing = await prisma.wrongQuestionAnalysis.findUnique({
    where: { userId_questionId: { userId: session.user.id, questionId } },
  });

  if (!existing) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: existing.id,
    wrongQuestionId: existing.questionId,
    correctAnswer: existing.correctAnswer,
    analysis: existing.analysis,
    wrongOptionsAnalysis: JSON.parse(existing.wrongOptions),
    knowledgePoints: JSON.parse(existing.knowledgePoints),
    exampleSentences: JSON.parse(existing.exampleSentences),
    createdAt: existing.createdAt.toISOString(),
  });
}
