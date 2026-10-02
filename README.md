# 英语学习网站

现代化的英语学习平台，提供四六级、高考英语真题练习和每日单词记忆功能。

## 功能特性

### 已实现
- ✅ 历年真题（四六级、高考英语）
- ✅ 每日单词（含释义、例句、音标）
- ✅ 响应式设计（支持手机和电脑）

### 即将上线
- 🔄 AI 翻译（句子/短文）
- 🔄 AI 作文润色
- 🔄 文件格式转换

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **部署**: 支持 Vercel 或自建服务器

## 快速开始

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
english-learning/
├── app/                    # 页面路由
│   ├── exam/              # 真题页面
│   ├── vocabulary/        # 单词页面
│   ├── translate/         # 翻译页面（占位）
│   ├── writing/           # 写作页面（占位）
│   └── convert/           # 转换页面（占位）
├── components/            # React 组件
│   ├── layout/           # 布局组件
│   └── ui/               # UI 组件
├── lib/                   # 工具函数和数据
├── types/                 # TypeScript 类型定义
└── public/               # 静态资源
```

## 开发计划

1. **Phase 1** (当前): 核心功能 MVP
   - 基础框架搭建
   - 真题浏览
   - 每日单词

2. **Phase 2**: 功能完善
   - 在线做题系统
   - 用户登录
   - 学习进度追踪

3. **Phase 3**: AI 功能
   - 接入 AI API
   - 翻译功能
   - 作文润色

4. **Phase 4**: 扩展功能
   - 文件格式转换
   - 听力练习
   - 口语评测

## License

MIT
