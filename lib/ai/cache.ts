import { prisma } from '@/lib/prisma';

export type CacheType = 'writing' | 'translation' | 'analysis';

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function computeHash(content: string): string {
  return hashString(content.trim().toLowerCase());
}

export async function getCachedResponse(type: CacheType, contentHash: string): Promise<unknown | null> {
  const cached = await prisma.aIResponseCache.findUnique({
    where: { type_contentHash: { type, contentHash } },
  });

  if (!cached) return null;

  try {
    return JSON.parse(cached.response);
  } catch {
    return null;
  }
}

export async function saveToCache(type: CacheType, contentHash: string, response: unknown) {
  await prisma.aIResponseCache.upsert({
    where: { type_contentHash: { type, contentHash } },
    update: { response: JSON.stringify(response) },
    create: {
      type,
      contentHash,
      response: JSON.stringify(response),
    },
  });
}
