import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const PLANS: Record<string, { days: number; amount: number; label: string }> = {
  monthly: { days: 30, amount: 29, label: '月度会员' },
  quarterly: { days: 90, amount: 69, label: '季度会员' },
  yearly: { days: 365, amount: 199, label: '年度会员' },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const { plan } = body;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: '无效的订阅方案' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const now = new Date();
    const expireAt = new Date(now);
    expireAt.setDate(expireAt.getDate() + planConfig.days);

    const existingMembership = await prisma.membership.findUnique({ where: { userId } });

    let baseDate = now;
    if (existingMembership?.expireAt && existingMembership.expireAt > now) {
      baseDate = existingMembership.expireAt;
    }
    const newExpireAt = new Date(baseDate);
    newExpireAt.setDate(newExpireAt.getDate() + planConfig.days);

    const [membership, subscription] = await Promise.all([
      prisma.membership.upsert({
        where: { userId },
        update: {
          plan: 'VIP',
          status: 'ACTIVE',
          expireAt: newExpireAt,
        },
        create: {
          userId,
          plan: 'VIP',
          status: 'ACTIVE',
          expireAt: newExpireAt,
        },
      }),
      prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'ACTIVE',
          startAt: now,
          expireAt: newExpireAt,
          amount: planConfig.amount,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      membership: {
        plan: membership.plan,
        status: membership.status,
        expireAt: membership.expireAt?.toISOString(),
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        startAt: subscription.startAt.toISOString(),
        expireAt: subscription.expireAt.toISOString(),
        amount: subscription.amount,
      },
    });
  } catch (error) {
    console.error('VIP subscribe error:', error);
    return NextResponse.json({ error: '订阅失败' }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const userId = session.user.id;

  const [membership, subscriptions] = await Promise.all([
    prisma.membership.findUnique({ where: { userId } }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const isVIP = membership?.plan === 'VIP'
    && membership?.status === 'ACTIVE'
    && (!membership?.expireAt || membership.expireAt > new Date());

  return NextResponse.json({
    membership: {
      plan: membership?.plan || 'FREE',
      status: membership?.status || 'ACTIVE',
      expireAt: membership?.expireAt?.toISOString() || null,
      isVIP,
    },
    subscriptions: subscriptions.map(s => ({
      id: s.id,
      plan: s.plan,
      status: s.status,
      startAt: s.startAt.toISOString(),
      expireAt: s.expireAt.toISOString(),
      amount: s.amount,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
