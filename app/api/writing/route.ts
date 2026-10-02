import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { analyzeWriting } from '@/lib/ai';
import { checkUsageLimit, incrementUsage } from '@/lib/ai/usage';
import { computeHash, getCachedResponse, saveToCache } from '@/lib/ai/cache';
import { addExperience } from '@/lib/auth/permission';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const records = await prisma.writingRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(records.map(r => ({
    id: r.id,
    content: r.content,
    score: r.score,
    feedback: r.feedback,
    createdAt: r.createdAt.toISOString(),
  })));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== 'string' || content.trim().length < 10) {
    return NextResponse.json({ error: '作文内容至少需要10个字符' }, { status: 400 });
  }

  const userId = session.user.id;
  const contentHash = computeHash(content);

  const cached = await getCachedResponse('writing', contentHash);
  if (cached) {
    return NextResponse.json({
      id: `cache-${Date.now()}`,
      score: (cached as any).score,
      feedback: cached,
      createdAt: new Date().toISOString(),
      cached: true,
    });
  }

  const { allowed, remaining } = await checkUsageLimit(userId, 'writing');
  if (!allowed) {
    return NextResponse.json({ error: `今日作文批改次数已用完（每日限3次），剩余${remaining}次` }, { status: 429 });
  }

  const feedback = await analyzeWriting(content);

  await saveToCache('writing', contentHash, feedback);
  await incrementUsage(userId, 'writing');

  const record = await prisma.writingRecord.create({
    data: {
      userId,
      content,
      score: feedback.score,
      feedback: JSON.stringify(feedback),
    },
  });

  await addExperience(userId, 'writing');

  return NextResponse.json({
    id: record.id,
    score: feedback.score,
    feedback,
    createdAt: record.createdAt.toISOString(),
  });
}
