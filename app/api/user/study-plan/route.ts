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

  const today = getDateStr(new Date());

  const plan = await prisma.studyPlan.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  if (plan) {
    return NextResponse.json({
      date: plan.date,
      wordsTarget: plan.wordsTarget,
      questionsTarget: plan.questionsTarget,
      readingTarget: plan.readingTarget,
      completedWords: plan.completedWords,
      completedQuestions: plan.completedQuestions,
      completedReading: plan.completedReading,
    });
  }

  const checkin = await prisma.studyCheckin.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const newPlan = await prisma.studyPlan.create({
    data: {
      userId: session.user.id,
      date: today,
      wordsTarget: 20,
      questionsTarget: 10,
      readingTarget: 1,
      completedWords: checkin?.wordsLearned || 0,
      completedQuestions: checkin?.questionsDone || 0,
      completedReading: 0,
    },
  });

  return NextResponse.json({
    date: newPlan.date,
    wordsTarget: newPlan.wordsTarget,
    questionsTarget: newPlan.questionsTarget,
    readingTarget: newPlan.readingTarget,
    completedWords: newPlan.completedWords,
    completedQuestions: newPlan.completedQuestions,
    completedReading: newPlan.completedReading,
  });
}

export async function PUT() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const today = getDateStr(new Date());

  const checkin = await prisma.studyCheckin.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const plan = await prisma.studyPlan.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: {
      userId: session.user.id,
      date: today,
      wordsTarget: 20,
      questionsTarget: 10,
      readingTarget: 1,
      completedWords: checkin?.wordsLearned || 0,
      completedQuestions: checkin?.questionsDone || 0,
      completedReading: 0,
    },
    update: {
      completedWords: checkin?.wordsLearned || 0,
      completedQuestions: checkin?.questionsDone || 0,
    },
  });

  return NextResponse.json({
    date: plan.date,
    wordsTarget: plan.wordsTarget,
    questionsTarget: plan.questionsTarget,
    readingTarget: plan.readingTarget,
    completedWords: plan.completedWords,
    completedQuestions: plan.completedQuestions,
    completedReading: plan.completedReading,
  });
}
