/** 优先级，对应 PRD § 4.d 严重性定义 */
export type Priority = "P0" | "P1" | "P2" | "P3";

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
  level: Priority;
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
  priority: Priority;
  title: string;
  /** 底层矛盾，加粗描述 */
  coreLogic: string;
  /** 1-3 条事实底座 */
  evidence: SourceAnchor[];
  /** 行动建议（如降估值、加对赌） */
  actionAdvice: string[];
  category: "行业" | "团队" | "产品" | "财务" | "合规" | "估值";
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
      level: Priority;
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
        /** 严重等级：P0 缺则无法启动 / P1 关键缺失 / P2 影响精度 */
        severity: Extract<Priority, "P0" | "P1" | "P2">;
        /** 一行补充说明，告诉用户为什么需要 */
        hint?: string;
      }>;
      /** 解析进度概览：已识别 parsed / total */
      parsedSummary?: { parsed: number; total: number };
      /** 给到用户的可操作建议（条款式） */
      nextSteps?: string[];
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
