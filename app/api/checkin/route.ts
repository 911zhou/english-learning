import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function getDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;
  const today = getDateStr(new Date());

  const checkins = await prisma.studyCheckin.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 365,
  });

  const todayCheckin = checkins.find(c => c.date === today);
  const checkedIn = todayCheckin?.checkin || false;

  let consecutiveDays = 0;
  const sortedDates = checkins
    .filter(c => c.checkin)
    .map(c => c.date)
    .sort()
    .reverse();

  if (sortedDates.length > 0) {
    const d = new Date();
    const todayStr = getDateStr(d);
    const yesterday = new Date(d);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateStr(yesterday);

    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      consecutiveDays = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          consecutiveDays++;
        } else {
          break;
        }
      }
    }
  }

  const calendarData: Record<string, { questionsDone: number; wordsLearned: number; checkin: boolean }> = {};
  for (const c of checkins) {
    calendarData[c.date] = {
      questionsDone: c.questionsDone,
      wordsLearned: c.wordsLearned,
      checkin: c.checkin,
    };
  }

  const totalCheckins = checkins.filter(c => c.checkin).length;
  const totalQuestions = checkins.reduce((sum, c) => sum + c.questionsDone, 0);
  const totalWords = checkins.reduce((sum, c) => sum + c.wordsLearned, 0);

  return NextResponse.json({
    today,
    checkedIn,
    consecutiveDays,
    totalCheckins,
    totalQuestions,
    totalWords,
    calendarData,
    todayStats: todayCheckin ? {
      questionsDone: todayCheckin.questionsDone,
      wordsLearned: todayCheckin.wordsLearned,
    } : { questionsDone: 0, wordsLearned: 0 },
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;
  const today = getDateStr(new Date());

  const existing = await prisma.studyCheckin.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing?.checkin) {
    return NextResponse.json({ success: true, message: '今日已打卡' });
  }

  await prisma.studyCheckin.upsert({
    where: { userId_date: { userId, date: today } },
    update: { checkin: true },
    create: {
      userId,
      date: today,
      checkin: true,
      questionsDone: existing?.questionsDone || 0,
      wordsLearned: existing?.wordsLearned || 0,
    },
  });

  return NextResponse.json({ success: true, message: '打卡成功' });
}
