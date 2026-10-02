# 运行说明

## 前置要求

确保已安装 Node.js 18+ 和 npm

检查版本：
```bash
node --version
npm --version
```

## 安装步骤

### 1. 进入项目目录

```bash
cd english-learning
```

### 2. 安装依赖

```bash
npm install
```

这将安装以下主要依赖：
- next: ^14.2.0
- react: ^18.3.1
- react-dom: ^18.3.1
- typescript: ^5.4.0
- tailwindcss: ^3.4.0

### 3. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 4. 访问网站

打开浏览器访问：http://localhost:3000

## 常见问题

### 问题1: npm 命令找不到

**解决方案：**
1. 确认 Node.js 已安装
2. 检查环境变量 PATH 是否包含 Node.js 路径
3. Windows 默认路径：`C:\Program Files\nodejs\`
4. 重新安装 Node.js 并勾选"Add to PATH"

### 问题2: 端口 3000 被占用

**解决方案：**
```bash
# 使用其他端口
npm run dev -- -p 3001
```

### 问题3: TypeScript 报错

**解决方案：**
```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 构建生产版本

```bash
# 构建
npm run build

# 运行生产版本
npm start
```

## 项目功能

### 已实现功能

1. **首页** (/)
   - 功能介绍
   - 今日单词预览

2. **真题页面** (/exam)
   - 四六级、高考真题列表
   - 按类型筛选
   - 题目数量和时长显示

3. **单词页面** (/vocabulary)
   - 每日单词卡片
   - 点击显示释义和例句
   - 单词等级标签

4. **占位页面**
   - 翻译 (/translate)
   - AI写作 (/writing)
   - 格式转换 (/convert)

### 响应式设计

- 手机端：单列布局
- 平板端：双列布局
- 桌面端：三列布局

## 下一步开发

1. 接入真实数据库（PostgreSQL）
2. 添加用户认证系统
3. 实现做题功能
4. 接入 AI API（翻译、润色）
5. 添加学习进度追踪

## 技术文档

- [Next.js 文档](https://nextjs.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
