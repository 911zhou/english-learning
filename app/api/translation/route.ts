import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { translateText } from '@/lib/ai';
import { checkUsageLimit, incrementUsage } from '@/lib/ai/usage';
import { computeHash, getCachedResponse, saveToCache } from '@/lib/ai/cache';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const records = await prisma.translationRecord.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const parsedRecords = records.map(r => ({
    id: r.id,
    sourceText: r.sourceText,
    targetText: r.targetText,
    analysis: JSON.parse(r.analysis),
    createdAt: r.createdAt,
  }));

  return NextResponse.json(parsedRecords);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { content } = await request.json();

  if (!content || content.trim().length < 2) {
    return NextResponse.json({ error: '请输入至少2个字符' }, { status: 400 });
  }

  const userId = session.user.id;
  const contentHash = computeHash(content);

  const cached = await getCachedResponse('translation', contentHash);
  if (cached) {
    return NextResponse.json({
      id: `cache-${Date.now()}`,
      analysis: cached,
      createdAt: new Date().toISOString(),
      cached: true,
    });
  }

  const { allowed, remaining } = await checkUsageLimit(userId, 'translation');
  if (!allowed) {
    return NextResponse.json({ error: `今日翻译次数已用完（每日限10次），剩余${remaining}次` }, { status: 429 });
  }

  try {
    const analysis = await translateText(content);

    await saveToCache('translation', contentHash, analysis);
    await incrementUsage(userId, 'translation');

    const record = await prisma.translationRecord.create({
      data: {
        userId,
        sourceText: content,
        targetText: analysis.translation,
        analysis: JSON.stringify(analysis),
      },
    });

    return NextResponse.json({
      id: record.id,
      analysis,
      createdAt: record.createdAt,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: '翻译失败，请稍后重试' }, { status: 500 });
  }
}
