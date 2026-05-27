import type { Project } from "@/src/types";

export const mockProjects: Project[] = [
  {
    id: "proj-aurora",
    name: "极光智算 Pre-A 轮",
    industry: "AI · Agent 应用",
    stage: "early-growth",
    riskTolerance: "R2",
    customInstruction:
      "本次重点审查其 AI Agent 在企业 IT 运维场景的真实订单转化能力，以及底层模型 API 调用成本占比。",
    status: "parsed",
    updatedAt: "2026-05-12T09:18:00+08:00",
    files: [
      {
        id: "f-aurora-1",
        name: "极光智算-投决议案-V3.pdf",
        kind: "pdf",
        size: "4.2 MB",
        status: "indexed",
        category: "投决议案",
        uploadedAt: "2026-05-11T18:01:00+08:00",
      },
      {
        id: "f-aurora-2",
        name: "极光智算-2024 财务审计报告.pdf",
        kind: "pdf",
        size: "8.7 MB",
        status: "indexed",
        category: "财务尽调",
        uploadedAt: "2026-05-11T18:02:30+08:00",
      },
      {
        id: "f-aurora-3",
        name: "极光智算-法律尽调报告 LDD.docx",
        kind: "word",
        size: "1.9 MB",
        status: "indexed",
        category: "法律尽调",
        uploadedAt: "2026-05-11T18:03:55+08:00",
      },
      {
        id: "f-aurora-4",
        name: "极光智算-商业计划书 BP_2026Q2.pptx",
        kind: "ppt",
        size: "15.4 MB",
        status: "indexed",
        category: "BP",
        uploadedAt: "2026-05-11T18:05:10+08:00",
      },
      {
        id: "f-aurora-5",
        name: "极光智算-财务底稿_FDD.xlsx",
        kind: "excel",
        size: "2.1 MB",
        status: "indexed",
        category: "财务尽调",
        uploadedAt: "2026-05-11T18:06:42+08:00",
      },
    ],
  },
  {
    id: "proj-helios",
    name: "赫利俄斯半导体 B 轮",
    industry: "TMT · 半导体设计",
    stage: "late-pre-ipo",
    riskTolerance: "R1",
    customInstruction:
      "国资基金，重点关注流片经济学、良率爬坡数据、对受限实体清单 EDA / 代工厂的依赖度。",
    status: "parsing",
    updatedAt: "2026-05-12T16:42:00+08:00",
    files: [
      {
        id: "f-helios-1",
        name: "赫利俄斯-投决议案-初稿.pdf",
        kind: "pdf",
        size: "5.6 MB",
        status: "indexed",
        category: "投决议案",
        uploadedAt: "2026-05-12T15:00:00+08:00",
      },
      {
        id: "f-helios-2",
        name: "赫利俄斯-FDD 底稿.xlsx",
        kind: "excel",
        size: "3.4 MB",
        status: "parsing",
        category: "财务尽调",
        uploadedAt: "2026-05-12T16:30:00+08:00",
      },
    ],
  },
  {
    id: "proj-ocean",
    name: "海洋蓝智能 SaaS · A+ 轮",
    industry: "SaaS · 行业 AI",
    stage: "early-growth",
    riskTolerance: "R3",
    customInstruction: "",
    status: "draft",
    updatedAt: "2026-05-10T11:20:00+08:00",
    files: [],
  },
  /**
   * 演示「资料缺乏关键信息点 → 分析任务终止」场景：
   * 用户批量上传了 BP + 行业研报，但缺审计报告、缺投决议案、缺财务底稿，
   * 解析系统识别后主动终止分析，并在对话流里以 analysis-aborted 卡片提示。
   */
  {
    id: "proj-nebula",
    name: "星云生物医药 Pre-A 轮",
    industry: "医疗 · 创新药",
    stage: "early-growth",
    riskTolerance: "R2",
    customInstruction:
      "重点审查 PD-1/VEGF 双抗管线临床数据真实性与现金跑道，需要 FDD 底稿 + 临床试验报告交叉验证。",
    status: "failed",
    updatedAt: "2026-05-26T10:42:00+08:00",
    files: [
      {
        id: "f-nebula-1",
        name: "星云生物-商业计划书 BP_2026Q2.pptx",
        kind: "ppt",
        size: "12.8 MB",
        status: "indexed",
        category: "BP",
        uploadedAt: "2026-05-26T10:35:00+08:00",
      },
      {
        id: "f-nebula-2",
        name: "创新药行业研报-招商证券-2026Q1.pdf",
        kind: "pdf",
        size: "6.1 MB",
        status: "indexed",
        category: "其他",
        uploadedAt: "2026-05-26T10:36:20+08:00",
      },
      {
        id: "f-nebula-3",
        name: "星云生物-公司介绍 Deck.pdf",
        kind: "pdf",
        size: "3.2 MB",
        status: "indexed",
        category: "其他",
        uploadedAt: "2026-05-26T10:37:11+08:00",
      },
    ],
  },
];
