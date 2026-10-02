import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { vocabularyData } from '@/lib/vocabulary-data';
import { addExperience } from '@/lib/auth/permission';

async function ensureSeeded() {
  const count = await prisma.vocabulary.count();
  if (count > 0) return;

  const data = vocabularyData.map((v) => ({
    word: v.word,
    phonetic: v.phonetic,
    partOfSpeech: v.partOfSpeech,
    meaning: v.meaning,
    example: v.example,
    translation: v.translation,
    level: v.level,
  }));

  await prisma.vocabulary.createMany({ data });
}

function getDailyWordIds(totalWords: number, count: number = 20): number[] {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = ((seed << 5) - seed + dateStr.charCodeAt(i)) | 0;
  }
  seed = Math.abs(seed);

  const ids: number[] = [];
  const used = new Set<number>();
  let s = seed;
  while (ids.length < count && ids.length < totalWords) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const idx = s % totalWords;
    if (!used.has(idx)) {
      used.add(idx);
      ids.push(idx);
    }
  }
  return ids;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  await ensureSeeded();

  const userId = session.user.id;
  const totalWords = await prisma.vocabulary.count();
  const dailyIndices = getDailyWordIds(totalWords);

  const allVocab = await prisma.vocabulary.findMany();
  const dailyVocab = dailyIndices.map(i => allVocab[i]).filter(Boolean);

  const userVocab = await prisma.userVocabulary.findMany({
    where: {
      userId,
      vocabularyId: { in: dailyVocab.map(v => v.id) },
    },
  });

  const statusMap = new Map(userVocab.map(uv => [uv.vocabularyId, uv.status]));

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const words = dailyVocab.map(v => ({
    id: v.id,
    word: v.word,
    phonetic: v.phonetic,
    partOfSpeech: v.partOfSpeech,
    meaning: v.meaning,
    example: v.example,
    translation: v.translation,
    level: v.level,
    status: statusMap.get(v.id) || 'new',
  }));

  const masteredCount = words.filter(w => w.status === 'mastered').length;

  return NextResponse.json({
    date: dateStr,
    words,
    masteredCount,
    totalCount: words.length,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { vocabularyId, status } = await request.json();

  if (!vocabularyId || !['mastered', 'not_mastered'].includes(status)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  }

  const userId = session.user.id;

  const existing = await prisma.userVocabulary.findUnique({
    where: { userId_vocabularyId: { userId, vocabularyId } },
  });

  await prisma.userVocabulary.upsert({
    where: {
      userId_vocabularyId: { userId, vocabularyId },
    },
    update: {
      status,
      reviewCount: { increment: 1 },
      lastReviewAt: new Date(),
    },
    create: {
      userId,
      vocabularyId,
      status,
      reviewCount: 1,
      lastReviewAt: new Date(),
    },
  });

  if (status === 'mastered' && existing?.status !== 'mastered') {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await prisma.studyCheckin.upsert({
      where: { userId_date: { userId, date: dateStr } },
      update: { wordsLearned: { increment: 1 } },
      create: { userId, date: dateStr, wordsLearned: 1 },
    });
    await addExperience(userId, 'vocabulary');
  }

  return NextResponse.json({ success: true });
}
