'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ProfileData {
  experience: number;
  level: number;
  levelName: string;
  streakDays: number;
  totalStudyDays: number;
  progress: {
    current: number;
    nextThreshold: number;
    percent: number;
  };
  membership: {
    plan: string;
    status: string;
    expireAt: string | null;
    isVIP: boolean;
  };
}

interface SubscriptionRecord {
  id: string;
  plan: string;
  status: string;
  startAt: string;
  expireAt: string;
  amount: number;
}

interface VipStatusData {
  membership: {
    plan: string;
    status: string;
    expireAt: string | null;
    isVIP: boolean;
  };
  subscriptions: SubscriptionRecord[];
}

const PLANS = [
  { key: 'monthly', label: '月度会员', price: 29, unit: '/月', days: 30, saving: 0 },
  { key: 'quarterly', label: '季度会员', price: 69, unit: '/季', days: 90, saving: 18, recommended: true },
  { key: 'yearly', label: '年度会员', price: 199, unit: '/年', days: 365, saving: 149 },
];

const vipFeatures = [
  {
    icon: '🎯',
    title: '无限 AI 错题解析',
    description: '每日 AI 错题解析次数不限，深入理解每道错题',
    free: '每日 20 次',
    vip: '无限制',
  },
  {
    icon: '✍️',
    title: '无限 AI 作文批改',
    description: '随时提交作文获取 AI 详细批改和建议',
    free: '每日 3 次',
    vip: '无限制',
  },
  {
    icon: '🌐',
    title: '无限 AI 翻译',
    description: '长篇文章翻译不限次数，支持更多语种',
    free: '每日 10 次',
    vip: '无限制',
  },
  {
    icon: '📊',
    title: '高级学习报告',
    description: '详细的学习数据分析、薄弱点诊断和改进建议',
    free: '基础报告',
    vip: '深度分析',
  },
  {
    icon: '🎧',
    title: '高级听力训练',
    description: '更多听力材料、语速调节、逐句精听功能',
    free: '基础听力',
    vip: '全部材料',
  },
  {
    icon: '📚',
    title: '扩展词库',
    description: '访问 GRE、TOEFL、IELTS 等高级词库',
    free: '四级/六级/高考',
    vip: '全部词库',
  },
  {
    icon: '🎓',
    title: '专属学习计划',
    description: 'AI 生成的个性化学习路径和目标',
    free: '通用计划',
    vip: '定制计划',
  },
  {
    icon: '💎',
    title: 'VIP 专属标识',
    description: '个人资料和排行榜显示 VIP 金色徽章',
    free: '无',
    vip: '金色徽章',
  },
];

const PLAN_LABELS: Record<string, string> = {
  monthly: '月度会员',
  quarterly: '季度会员',
  yearly: '年度会员',
};

export default function VIPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [subscribeMsg, setSubscribeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProfile = useCallback(() => {
    return fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => setProfile(data));
  }, []);

  const loadVipStatus = useCallback(() => {
    return fetch('/api/vip/subscribe')
      .then(res => res.json())
      .then((data: VipStatusData) => {
        if (data.membership) {
          setProfile(prev => prev ? { ...prev, membership: data.membership } : prev);
        }
        if (data.subscriptions) {
          setSubscriptions(data.subscriptions);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      Promise.all([loadProfile(), loadVipStatus()])
        .catch(err => console.error('Failed to load data:', err))
        .finally(() => setLoading(false));
    }
  }, [status, session, router, loadProfile, loadVipStatus]);

  const handleSubscribe = async (planKey: string) => {
    setSubscribing(planKey);
    setSubscribeMsg(null);
    try {
      const res = await fetch('/api/vip/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubscribeMsg({ type: 'error', text: data.error || '订阅失败，请重试' });
        return;
      }
      setSubscribeMsg({ type: 'success', text: '升级成功！欢迎成为 VIP 会员' });
      await Promise.all([loadProfile(), loadVipStatus()]);
    } catch {
      setSubscribeMsg({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setSubscribing(null);
    }
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!session || !profile) return null;

  const isVIP = profile.membership.isVIP;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          {isVIP ? 'VIP 会员中心' : '升级 VIP 会员'}
        </h1>
        <p className="text-gray-600">
          {isVIP ? '尊享所有高级功能' : '解锁全部学习功能，提升学习效率'}
        </p>
      </div>

      {/* Current Status Card */}
      <div className="mb-8 rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-2xl font-bold text-white shadow-lg">
              {isVIP ? 'VIP' : 'FREE'}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                {isVIP ? 'VIP 会员' : '免费用户'}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {isVIP ? (
                  <>
                    有效期至：{profile.membership.expireAt ? new Date(profile.membership.expireAt).toLocaleDateString('zh-CN') : '永久'}
                  </>
                ) : (
                  '升级 VIP 解锁所有高级功能'
                )}
              </div>
            </div>
          </div>
          {!isVIP && (
            <button
              onClick={scrollToPricing}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl"
            >
              立即升级
            </button>
          )}
        </div>
      </div>

      {/* Subscribe Message */}
      {subscribeMsg && (
        <div className={cn(
          'mb-6 rounded-lg px-4 py-3 text-sm font-medium',
          subscribeMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {subscribeMsg.text}
        </div>
      )}

      {/* Features Comparison */}
      <div className="mb-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">VIP 专属功能</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {vipFeatures.map((feature, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-lg border p-5 transition-all',
                isVIP
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50'
                  : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
              )}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-bold text-gray-900">{feature.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
                {isVIP && (
                  <div className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                    已解锁
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                <div>
                  <span className="text-gray-500">免费版：</span>
                  <span className="text-gray-700">{feature.free}</span>
                </div>
                <div className="font-medium text-amber-600">
                  VIP：{feature.vip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      {!isVIP && (
        <div id="pricing-section" className="mb-8 rounded-lg border bg-gradient-to-br from-primary-50 to-blue-50 p-8 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">选择适合你的方案</h2>
          <p className="mb-6 text-sm text-gray-500">模拟支付，点击即开通</p>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map(plan => (
              <div
                key={plan.key}
                className={cn(
                  'relative rounded-lg border-2 bg-white p-6',
                  plan.recommended ? 'border-amber-400 shadow-lg' : 'border-gray-200'
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">
                    推荐
                  </div>
                )}
                <div className="mb-2 text-lg font-bold text-gray-900">{plan.label}</div>
                <div className={cn('mb-4 text-3xl font-bold', plan.recommended ? 'text-amber-600' : 'text-primary-600')}>
                  ¥{plan.price}<span className="text-base font-normal text-gray-500">{plan.unit}</span>
                </div>
                {plan.saving > 0 && (
                  <div className="mb-4 text-sm text-gray-500">省 ¥{plan.saving}</div>
                )}
                {!plan.saving && <div className="mb-4" />}
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing !== null}
                  className={cn(
                    'w-full rounded-lg py-2 font-medium text-white transition-colors',
                    plan.recommended
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-primary-600 hover:bg-primary-700',
                    subscribing !== null && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {subscribing === plan.key ? '处理中...' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIP User Info */}
      {isVIP && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 text-center">
          <div className="mb-2 text-5xl">💎</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">感谢你的支持！</h2>
          <p className="text-gray-600">
            你已解锁所有 VIP 功能，尽情享受高效学习吧
          </p>
        </div>
      )}

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">订阅记录</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">方案</th>
                  <th className="pb-2 font-medium">金额</th>
                  <th className="pb-2 font-medium">状态</th>
                  <th className="pb-2 font-medium">开始日期</th>
                  <th className="pb-2 font-medium">到期日期</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="py-2.5 text-gray-900">{PLAN_LABELS[sub.plan] || sub.plan}</td>
                    <td className="py-2.5 text-gray-700">¥{sub.amount}</td>
                    <td className="py-2.5">
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium',
                        sub.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {sub.status === 'ACTIVE' ? '生效中' : sub.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">{new Date(sub.startAt).toLocaleDateString('zh-CN')}</td>
                    <td className="py-2.5 text-gray-500">{new Date(sub.expireAt).toLocaleDateString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
