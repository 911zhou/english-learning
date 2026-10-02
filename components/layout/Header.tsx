'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/exam', label: '真题' },
  { href: '/vocabulary/daily', label: '每日单词' },
  { href: '/vocabulary', label: '单词表' },
  { href: '/vocabulary/wrong', label: '错题本' },
  { href: '/exam/history', label: '答题记录' },
  { href: '/translation', label: 'AI翻译' },
  { href: '/writing', label: 'AI写作' },
  { href: '/convert', label: '格式转换' },
  { href: '/assistant', label: 'AI助手' },
  { href: '/vip', label: 'VIP', highlight: true },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="text-xl font-bold text-primary-600">英语学习</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100',
                'highlight' in item && item.highlight
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                  : pathname === item.href
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-4 flex items-center gap-2">
          {status === 'loading' ? null : session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {(session.user.name || session.user.email || '?')[0].toUpperCase()}
                </span>
                <span className="hidden md:inline">{session.user.name || session.user.email}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                退出
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
