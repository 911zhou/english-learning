import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllListeningPapers, getListeningPaperById } from '@/lib/listening-data';
import { addExperience } from '@/lib/auth/permission';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get('paperId');

  if (paperId) {
    const paper = getListeningPaperById(paperId);
    if (!paper) {
      return NextResponse.json({ error: '听力试卷不存在' }, { status: 404 });
    }

    const record = await prisma.listeningRecord.findFirst({
      where: { userId: session.user.id, paperId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      paper,
      record: record ? {
        score: record.score,
        correctCount: record.correctCount,
        totalCount: record.totalCount,
        createdAt: record.createdAt.toISOString(),
      } : null,
    });
  }

  const papers = getAllListeningPapers().map(p => ({
    id: p.id,
    examType: p.examType,
    year: p.year,
    title: p.title,
    questionCount: p.questions.length,
  }));

  const records = await prisma.listeningRecord.findMany({
    where: { userId: session.user.id },
    select: { paperId: true, score: true, correctCount: true, totalCount: true },
  });

  const recordMap: Record<string, { score: number; correctCount: number; totalCount: number }> = {};
  for (const r of records) {
    if (!recordMap[r.paperId] || r.score > recordMap[r.paperId].score) {
      recordMap[r.paperId] = { score: r.score, correctCount: r.correctCount, totalCount: r.totalCount };
    }
  }

  return NextResponse.json({ papers, records: recordMap });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { paperId, answers } = await req.json();

  if (!paperId || !answers) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  const paper = getListeningPaperById(paperId);
  if (!paper) {
    return NextResponse.json({ error: '听力试卷不存在' }, { status: 404 });
  }

  let correctCount = 0;
  const results = paper.questions.map(q => {
    const userAnswer = answers[q.id] || '';
    const isCorrect = userAnswer.toUpperCase() === q.answer.toUpperCase();
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      number: q.number,
      userAnswer,
      correctAnswer: q.answer,
      isCorrect,
    };
  });

  const totalCount = paper.questions.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const record = await prisma.listeningRecord.create({
    data: {
      userId: session.user.id,
      paperId,
      score,
      correctCount,
      totalCount,
    },
  });

  await addExperience(session.user.id, 'listening');

  return NextResponse.json({
    id: record.id,
    score,
    correctCount,
    totalCount,
    results,
    questions: paper.questions.map(q => ({
      id: q.id,
      number: q.number,
      transcript: q.transcript,
      analysis: q.analysis,
    })),
    createdAt: record.createdAt.toISOString(),
  });
}
