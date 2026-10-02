export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">关于我们</h3>
            <p className="text-sm text-gray-600">
              专注英语学习，提供四六级、高考真题、每日单词等核心功能。
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">功能</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>四六级真题</li>
              <li>高考英语真题</li>
              <li>每日单词</li>
              <li>AI翻译（即将上线）</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">更多</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>AI作文润色（即将上线）</li>
              <li>文件格式转换（即将上线）</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
          © 2026 英语学习. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
