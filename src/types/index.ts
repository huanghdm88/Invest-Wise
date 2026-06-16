/** 内容风险等级（金融领域 R1–R5 口径） */
export type RiskLevel = "R1" | "R2" | "R3" | "R4" | "R5";

/** 风险容忍度档位，PRD § 5.a 主动偏好输入 */
export type RiskTolerance = "R1" | "R2" | "R3";

/** 投资阶段 */
export type InvestmentStage = "early-growth" | "late-pre-ipo";

/** 工作模式 */
export type WorkMode = "auto" | "fact-check" | "challenge";

/** 项目解析状态 */
export type ProjectStatus = "draft" | "parsing" | "parsed" | "failed";

/** 文件类型 */
export type FileKind = "pdf" | "word" | "ppt" | "excel" | "other";

/** 文件解析阶段 */
export type FileStatus = "uploading" | "parsing" | "indexed" | "failed";

export interface KnowledgeFile {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  status: FileStatus;
  category?: "投决议案" | "财务尽调" | "法律尽调" | "商业尽调" | "BP" | "其他";
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  industry: string;
  stage: InvestmentStage;
  riskTolerance: RiskTolerance;
  customInstruction: string;
  status: ProjectStatus;
  updatedAt: string;
  files: KnowledgeFile[];
}

/** 项目下的子对话（每个项目可包含多个独立的子对话） */
export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** 草稿态：未发送首条消息前不在侧边栏项目子集与「最近」中展示 */
  isDraft?: boolean;
}

/** 溯源锚点：一定要带原文页码 */
export interface SourceAnchor {
  document: string;
  page: number | string;
  paragraph?: string;
  /** 原文（保留段落） */
  excerpt: string;
  /** 高亮的关键字词 */
  highlight?: string[];
}

/** 事实验证：对冲面板 */
export interface FactCompare {
  label: string;
  claim: { source: string; value: string };
  reality: { source: string; value: string };
  /** 差异百分比，正数=高估 */
  delta?: string;
  level: RiskLevel;
  /** 偏差详情：仅在 delta ≠ 0 时填充，用于支撑卡片展开"为什么差"的说明 */
  deviationDetail?: {
    /** 差异成因，例如「合并口径口径未做内部抵销」 */
    explanation: string;
    /** 业务影响，例如「现金流真实值低于披露，影响估值与对赌设定」 */
    impact: string;
    /** 处置建议（条款 / 复核动作 / 数据补充） */
    recommendation?: string;
    /** 触发偏差的关键证据锚点 */
    evidence?: SourceAnchor[];
  };
}

/** 挑战质询：单条 */
export interface ChallengeItem {
  id: string;
  riskLevel: RiskLevel;
  title: string;
  /** 底层矛盾，加粗描述 */
  coreLogic: string;
  /** 1-3 条事实底座 */
  evidence: SourceAnchor[];
  /** 行动建议（如降估值、加对赌） */
  actionAdvice: string[];
  category: "行业" | "团队" | "产品" | "财务" | "合规" | "估值";
}

/** 通用语义色调，用于风险/数据可视化的着色 */
export type SemanticTone = "danger" | "warning" | "neutral" | "positive";

/** 交叉验证条目的「分类」枚举，与原 HTML 报告的 cat-xxx 一一对应 */
export type VerificationCategory =
  | "财务数据"
  | "募资"
  | "融资数据"
  | "法务合规"
  | "客户数据"
  | "业务数据"
  | "市场行业"
  | "团队治理";

/** 交叉验证条目的「结论」枚举：一致 / 部分一致 / 不一致 / 证据不足 */
export type VerificationVerdict = "一致" | "部分一致" | "不一致" | "证据不足";

/** 单条「投资备忘录主张 ⇄ 多源尽调证据」对照卡片 */
export interface VerificationCardItem {
  /** 表内序号（保留原 HTML 排序） */
  index: number;
  /** 「投资备忘录 主张」原文，可含 [^N] 引用 */
  claim: string;
  /** 主张的来源锚点（一般来自投资备忘录某页） */
  claimSources?: SourceAnchor[];
  category: VerificationCategory;
  verdict: VerificationVerdict;
  riskLevel: RiskLevel;
  /** 「证据摘要」正文（多源尽调材料的交叉印证 / 反证） */
  evidence: string;
  /** 「证据来源」点击展开：相关支持文档 */
  evidenceSources: SourceAnchor[];
}

/** 尽调复核报告：单个章节内的内容块 */
export type DiligenceContent =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: SemanticTone; title?: string; text: string }
  | {
      /** KPI 指标卡网格：关键数字型数据的可视化呈现 */
      type: "stats";
      items: Array<{ label: string; value: string; sub?: string; tone?: SemanticTone }>;
    }
  | {
      /** 横向条形图：用于占比 / 对比类数字的可视化 */
      type: "bars";
      caption?: string;
      items: Array<{
        label: string;
        /** 0–100 的相对长度 */
        value: number;
        /** 展示用文案，如 "85.26%" / "2.4 亿元" */
        display: string;
        tone?: SemanticTone;
      }>;
    }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
      /** 需要强调的列下标（从 0 开始） */
      emphasizeCol?: number;
    }
  | {
      /**
       * 交叉验证卡片块：把原 HTML 报告中的「单行验证项表格」抽象为视觉卡片，
       * 头部展示分类 + 风险等级 + 结论标签，主体左右两列对照「主张 / 证据摘要」，
       * 右下角「证据来源 ›」可展开支持文档锚点。
       */
      type: "verification-cards";
      /** 选填子标题，例如「证据不足项（4 项）」 */
      caption?: string;
      items: VerificationCardItem[];
      /** 默认是否折叠（默认 false，即展开） */
      defaultCollapsed?: boolean;
    };

/** 尽调复核报告：一个可折叠的大章节 */
export interface DiligenceSection {
  id: string;
  title: string;
  /** 章节风险色点（TOC 与标题用） */
  tone?: SemanticTone;
  /** 默认是否展开，默认 true */
  defaultOpen?: boolean;
  content: DiligenceContent[];
}

/** 反问数据补充表单字段 */
export interface ClarificationField {
  key: string;
  label: string;
  hint?: string;
  type: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
}

/** 智能路由无法识别意图时，给出待选模式让用户决定 */
export interface ModePickOption {
  mode: Extract<WorkMode, "fact-check" | "challenge">;
  label: string;
  desc: string;
  /** 推荐选项，会高亮显示 */
  recommended?: boolean;
}

export type AssistantBlock =
  | { kind: "text"; text: string }
  | {
      kind: "clarification";
      title: string;
      reason: string;
      fields: ClarificationField[];
      /** 用户提交后，由 Agent 自动追加的后续内容（如估值报告）。提交前不展示。 */
      followUp?: AssistantBlock[];
    }
  | {
      kind: "mode-pick";
      title: string;
      reason: string;
      options: ModePickOption[];
      /** 用户原始消息（便于二次提交） */
      originalQuery: string;
    }
  | {
      kind: "fact-verification";
      title: string;
      level: RiskLevel;
      summary: string;
      compares: FactCompare[];
      anchors: SourceAnchor[];
      /** 句级引用，顺序即引用序号 [1] [2] [3]…，summary 内可用 [^N] 标记锚定 */
      citations?: SourceAnchor[];
    }
  | {
      kind: "challenge-list";
      title: string;
      summary: string;
      items: ChallengeItem[];
      citations?: SourceAnchor[];
    }
  | {
      kind: "valuation";
      title: string;
      summary: string;
      methods: Array<{
        method: string;
        range: string;
        assumption: string;
        applicability: string;
      }>;
      conclusion: string;
      citations?: SourceAnchor[];
    }
  | {
      /** 企业分析评估报告：偏好 / 知识库变更后全量重算产出 */
      kind: "enterprise-analysis";
      title: string;
      summary: string;
      /** 综合风险等级 */
      overallLevel: RiskLevel;
      /** 分维度评估 */
      dimensions: Array<{
        key: string;
        label: string;
        level: RiskLevel;
        finding: string;
        recommendation: string;
      }>;
      /** 关键结论（条款式） */
      highlights: string[];
      citations?: SourceAnchor[];
    }
  | {
      /**
       * 分析终止卡片：当批量上传的资料缺乏关键信息点（如缺审计 / 缺议案 / 缺财务底稿）时，
       * Agent 主动终止分析并提示用户补传材料。卡片自带「快速上传」入口。
       */
      kind: "analysis-aborted";
      title: string;
      /** 终止原因总览，一句话 */
      reason: string;
      /** 缺失的关键信息点（每项独立一条） */
      missingItems: Array<{
        key: string;
        /** 缺失项名称，如「2024 年度审计报告」 */
        label: string;
        /** 期望的文档分类（与 KnowledgeFile.category 同名） */
        requirement: NonNullable<KnowledgeFile["category"]>;
        /** 严重等级：R5 缺则无法启动 / R4 关键缺失 / R3 影响精度 */
        severity: Extract<RiskLevel, "R3" | "R4" | "R5">;
        /** 一行补充说明，告诉用户为什么需要 */
        hint?: string;
      }>;
      /** 解析进度概览：已识别 parsed / total */
      parsedSummary?: { parsed: number; total: number };
      /** 给到用户的可操作建议（条款式） */
      nextSteps?: string[];
    }
  | {
      /**
       * 尽调复核报告：对原始投决/尽调材料做独立复核后产出的长篇结构化报告。
       * 支持快捷目录跳转、章节折叠、关键数字可视化、关键信息高亮与逐句引用溯源。
       */
      kind: "diligence-report";
      title: string;
      /** 标的公司名 */
      company: string;
      /** 执行摘要 */
      summary: string;
      /** 总体结论 */
      verdict: {
        /** 最终建议，如「建议暂缓」 */
        recommendation: string;
        /** 整体项目风险评级 */
        riskLevel: RiskLevel;
        /** 估值判断，如「偏高 / 安全边际不足」 */
        valuation: string;
      };
      /** 顶部关键指标卡 */
      metrics: Array<{
        label: string;
        value: string;
        sub?: string;
        tone?: SemanticTone;
      }>;
      /** 正文章节（每个章节可折叠） */
      sections: DiligenceSection[];
      /** 逐句引用，序号即正文中的 [^N] */
      citations: SourceAnchor[];
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  /** 文本内容（用户消息或系统提示） */
  text?: string;
  /** Assistant 结构化输出 */
  blocks?: AssistantBlock[];
  /** 用户消息附带文件 */
  attachments?: Array<{ name: string; size: string; kind: FileKind }>;
  mode?: WorkMode;
  createdAt: string;
}

/** 长任务类型 */
export type RunningTaskKind = "challenge" | "fact-check" | "valuation";

/**
 * 长耗时任务（如挑战质询）。展示在右侧栏的任务卡片中，
 * 完成后会把 resultBlocks 自动注入到对应 conversation 的对话流。
 */
export interface RunningTask {
  id: string;
  projectId: string;
  conversationId: string;
  kind: RunningTaskKind;
  /** 卡片标题（任务核心问题） */
  title: string;
  /** 1–2 行简述（输入的原始问题或 Agent 概括） */
  summary: string;
  /** 0 – 100；ticker 推进 */
  progress: number;
  startedAt: string;
  /** 任务完成后注入对话流的 assistant block */
  resultBlocks: AssistantBlock[];
}
