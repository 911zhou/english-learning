import { prisma } from '@/lib/prisma';

export type ExperienceAction = 'exam' | 'listening' | 'vocabulary' | 'writing' | 'wrong_review';

const EXPERIENCE_REWARDS: Record<ExperienceAction, number> = {
  exam: 50,
  listening: 10,
  vocabulary: 5,
  writing: 20,
  wrong_review: 10,
};

const LEVEL_THRESHOLDS = [
  { level: 1, minExp: 0 },
  { level: 2, minExp: 100 },
  { level: 3, minExp: 300 },
  { level: 4, minExp: 600 },
  { level: 5, minExp: 1000 },
];

const LEVEL_NAMES: Record<number, string> = {
  1: '初学者',
  2: '进阶者',
  3: '熟练者',
  4: '精通者',
  5: '大师',
};

export function getLevelFromExperience(exp: number): number {
  let level = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (exp >= t.minExp) level = t.level;
  }
  return level;
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] || '初学者';
}

export function getLevelProgress(exp: number): { current: number; nextThreshold: number; percent: number } {
  const level = getLevelFromExperience(exp);
  if (level >= 5) {
    return { current: level, nextThreshold: LEVEL_THRESHOLDS[4].minExp, percent: 100 };
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1].minExp;
  const nextThreshold = LEVEL_THRESHOLDS[level].minExp;
  const progress = exp - currentThreshold;
  const needed = nextThreshold - currentThreshold;
  return {
    current: level,
    nextThreshold,
    percent: Math.min(100, Math.round((progress / needed) * 100)),
  };
}

export function getExperienceReward(action: ExperienceAction): number {
  return EXPERIENCE_REWARDS[action];
}

export async function ensureProfile(userId: string) {
  let profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { userId, experience: 0, level: 1, streakDays: 0, totalStudyDays: 0 },
    });
  }
  return profile;
}

export async function addExperience(userId: string, action: ExperienceAction) {
  const reward = EXPERIENCE_REWARDS[action];
  const profile = await ensureProfile(userId);
  const newExp = profile.experience + reward;
  const newLevel = getLevelFromExperience(newExp);

  return prisma.userProfile.update({
    where: { userId },
    data: { experience: newExp, level: newLevel },
  });
}

export async function isVIP(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership) return false;
  if (membership.plan !== 'VIP') return false;
  if (membership.status !== 'ACTIVE') return false;
  if (membership.expireAt && membership.expireAt < new Date()) return false;
  return true;
}

export type FeatureKey = 'ai_writing' | 'ai_translation' | 'ai_analysis' | 'advanced_report' | 'vip_questions';

const FREE_LIMITS: Record<FeatureKey, number> = {
  ai_writing: 3,
  ai_translation: 10,
  ai_analysis: 20,
  advanced_report: 0,
  vip_questions: 0,
};

const VIP_LIMITS: Record<FeatureKey, number> = {
  ai_writing: 999,
  ai_translation: 999,
  ai_analysis: 999,
  advanced_report: 999,
  vip_questions: 999,
};

export async function checkFeatureAccess(userId: string, feature: FeatureKey): Promise<{ allowed: boolean; reason?: string }> {
  const vip = await isVIP(userId);

  if (feature === 'advanced_report' || feature === 'vip_questions') {
    if (!vip) {
      return { allowed: false, reason: '该功能仅限VIP用户使用' };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

export function getFeatureLimit(feature: FeatureKey, vip: boolean): number {
  return vip ? VIP_LIMITS[feature] : FREE_LIMITS[feature];
}

export async function getUserProfile(userId: string) {
  const profile = await ensureProfile(userId);
  const membership = await prisma.membership.findUnique({ where: { userId } });

  return {
    experience: profile.experience,
    level: profile.level,
    levelName: getLevelName(profile.level),
    streakDays: profile.streakDays,
    totalStudyDays: profile.totalStudyDays,
    progress: getLevelProgress(profile.experience),
    membership: {
      plan: membership?.plan || 'FREE',
      status: membership?.status || 'ACTIVE',
      expireAt: membership?.expireAt?.toISOString() || null,
      isVIP: membership?.plan === 'VIP' && membership?.status === 'ACTIVE' && (!membership?.expireAt || membership.expireAt > new Date()),
    },
  };
}
