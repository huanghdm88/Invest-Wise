# Invest Wise · 投决智能体

> 投资决策辅助 Agent 一期 Demo。在投决议案、尽调报告等非结构化材料的基础上，提供 **事实交叉验证** 与 **核心投资逻辑挑战质询** 两类核心能力。

## 设计目标

- **数据确权 / 逻辑清晰**：所有结论必须带溯源锚点（文档名 + 页码 + 段落）
- **结构化卡片优先**：拒绝大段纯文本，事实对比、质询清单均以可视化卡片呈现
- **偏好驱动**：右侧偏好栏（投资阶段 / 风险容忍度 R1-R3 / 自定义指令）作为最高优先级注入 Prompt

## 本地运行

前置：Node.js 18+

```bash
npm install
npm run dev
```

访问 http://localhost:3002

> 默认演示账号：任意邮箱 + 任意密码即可进入。

## 主要页面

| 页面 | 说明 |
| --- | --- |
| `/login` | 邮箱+密码登录、找回密码入口 |
| 主工作台 | 三段式：左侧项目栏 / 中央对话+卡片 / 右侧偏好控制栏 |
| 项目管理 | 新建项目向导、知识库 Dropzone、文件解析状态 |

## 技术栈

- React 19 + TypeScript + Vite 6
- Tailwind CSS v4（@theme inline 配置）
- Radix UI Primitives
- lucide-react 图标
- 视觉风格沿用 `UI_Stantard-main`（Notion 风格 / 圆角 0.875rem / Inter 字体）
