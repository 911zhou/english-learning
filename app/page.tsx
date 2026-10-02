import Link from 'next/link';
import { dailyWords } from '@/lib/data';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          高效英语学习平台
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          四六级真题、高考英语、每日单词，一站式解决你的英语学习需求
        </p>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-3">
        <div className="group relative rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <Link href="/exam" className="absolute inset-0 z-10" aria-label="历年真题" />
          <div className="mb-4 text-4xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-primary-600">
            历年真题
          </h2>
          <p className="text-sm text-gray-600">
            四六级、高考英语真题练习，含详细解析
          </p>
        </div>

        <div className="group relative rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <Link href="/vocabulary" className="absolute inset-0 z-10" aria-label="每日单词" />
          <div className="mb-4 text-4xl">📚</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900 group-hover:text-primary-600">
            每日单词
          </h2>
          <p className="text-sm text-gray-600">
            科学记忆，每天进步一点点
          </p>
        </div>

        <div className="rounded-lg border bg-gray-50 p-6 opacity-60">
          <div className="mb-4 text-4xl">🤖</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            AI 工具
          </h2>
          <p className="text-sm text-gray-600">
            翻译、作文润色（即将上线）
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">今日单词</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dailyWords.words.slice(0, 4).map((word) => (
            <div
              key={word.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {word.word}
                </h3>
                <p className="text-sm text-gray-500">{word.phonetic}</p>
              </div>
              <p className="mb-2 text-sm text-gray-700">{word.meaning}</p>
              <p className="text-xs text-gray-500 italic">{word.example}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/vocabulary"
            className="inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            查看全部单词
          </Link>
        </div>
      </section>
    </div>
  );
}
