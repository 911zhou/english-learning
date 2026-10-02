import { prisma } from '@/lib/prisma';
import { isVIP } from '@/lib/auth/permission';

export type AIFeatureType = 'writing' | 'translation' | 'analysis';

const FREE_LIMITS: Record<AIFeatureType, number> = {
  writing: 3,
  translation: 10,
  analysis: 20,
};

const VIP_DAILY_LIMITS: Record<AIFeatureType, number> = {
  writing: 999,
  translation: 999,
  analysis: 999,
};

function getDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getDailyLimit(type: AIFeatureType, userId?: string): Promise<number> {
  if (userId) {
    const vip = await isVIP(userId);
    return vip ? VIP_DAILY_LIMITS[type] : FREE_LIMITS[type];
  }
  return FREE_LIMITS[type];
}

export async function getTodayUsage(userId: string) {
  const today = getDateStr();

  const record = await prisma.userAIUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return {
    writing: record?.writingCount || 0,
    translation: record?.translationCount || 0,
    analysis: record?.analysisCount || 0,
  };
}

export async function checkUsageLimit(userId: string, type: AIFeatureType): Promise<{ allowed: boolean; remaining: number }> {
  const usage = await getTodayUsage(userId);
  const limit = await getDailyLimit(type, userId);
  const used = usage[type];
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function incrementUsage(userId: string, type: AIFeatureType) {
  const today = getDateStr();

  await prisma.userAIUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      [type === 'writing' ? 'writingCount' : type === 'translation' ? 'translationCount' : 'analysisCount']: { increment: 1 },
    },
    create: {
      userId,
      date: today,
      [type === 'writing' ? 'writingCount' : type === 'translation' ? 'translationCount' : 'analysisCount']: 1,
    },
  });
}

export async function getUsageSummary(userId: string) {
  const usage = await getTodayUsage(userId);
  const vip = await isVIP(userId);
  const limits = vip ? VIP_DAILY_LIMITS : FREE_LIMITS;
  return {
    writing: { used: usage.writing, limit: limits.writing, remaining: Math.max(0, limits.writing - usage.writing) },
    translation: { used: usage.translation, limit: limits.translation, remaining: Math.max(0, limits.translation - usage.translation) },
    analysis: { used: usage.analysis, limit: limits.analysis, remaining: Math.max(0, limits.analysis - usage.analysis) },
  };
}
