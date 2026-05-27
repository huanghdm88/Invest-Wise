import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoginPage } from "@/src/components/auth/LoginPage";
import { ChatComposer } from "@/src/components/chat/ChatComposer";
import { MessageList } from "@/src/components/chat/MessageList";
import { QuoteViewer } from "@/src/components/chat/QuoteViewer";
import { ReportDrawer } from "@/src/components/chat/ReportDrawer";
import { SettingsPanel } from "@/src/components/layout/SettingsPanel";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { WorkspaceHeader } from "@/src/components/layout/WorkspaceHeader";
import { ProjectHome } from "@/src/components/project/ProjectHome";
import { ProjectWizard } from "@/src/components/project/ProjectWizard";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import {
  initialRunningTasks,
  mockConversations,
} from "@/src/data/mock-conversations";
import { mockProjects } from "@/src/data/mock-projects";
import { cn, isListedConversation, uid } from "@/src/lib/utils";
import type {
  AssistantBlock,
  ChatMessage,
  Conversation,
  FileKind,
  KnowledgeFile,
  Project,
  RunningTask,
  SourceAnchor,
  WorkMode,
} from "@/src/types";

/**
 * 视图：
 *  - project-home：项目主页（默认输入 / 历史对话 / 知识库 Tabs）
 *  - conversation：对话详情页
 *  - new-project：新建项目向导
 */
type ViewMode = "project-home" | "conversation" | "new-project";

const SETTINGS_OPEN_KEY = "iw.settingsOpen";
/** 任务总时长（毫秒）。每秒推进进度 = 100 / (秒数) */
const TASK_TOTAL_MS = 30_000;
const TASK_TICK_MS = 1_000;
const TASK_TICK_PER_SEC = (100 * TASK_TICK_MS) / TASK_TOTAL_MS;

/** 与 KnowledgePanel 内逻辑一致的小工具，供 handleQuickUpload 复用 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function inferFileKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "word";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return "excel";
  return "other";
}

function App() {
  const [authed, setAuthed] = useState(false);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [runningTasks, setRunningTasks] = useState<RunningTask[]>(initialRunningTasks);

  const initialProjectId = mockProjects[0]?.id ?? "";

  const [currentProjectId, setCurrentProjectId] = useState<string>(initialProjectId);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  // 默认从项目主页进入
  const [view, setView] = useState<ViewMode>("project-home");

  const [generating, setGenerating] = useState(false);
  const [viewerAnchor, setViewerAnchor] = useState<SourceAnchor | null>(null);
  /** 任务完成时如果用户不在当前对话页，把对话 id 标记为未读，UI 上显示绿点 */
  const [unreadConvIds, setUnreadConvIds] = useState<Set<string>>(() => new Set());
  /** 用户已确认过的「任务终止」对话 id；首次点击进入该对话后写入，红点立刻消失 */
  const [acknowledgedAbortedConvIds, setAcknowledgedAbortedConvIds] = useState<
    Set<string>
  >(() => new Set());
  /** 长任务刚刚注入到对话流的报告消息 id；MessageList 会让对应报告卡片走一次 yellow fade 动画 */
  const [newReportMsgIds, setNewReportMsgIds] = useState<Set<string>>(() => new Set());

  // 右侧项目设置面板的折叠状态（持久化到 localStorage）
  const [settingsOpen, setSettingsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(SETTINGS_OPEN_KEY);
    return stored === null ? true : stored === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SETTINGS_OPEN_KEY, settingsOpen ? "1" : "0");
    }
  }, [settingsOpen]);

  const [openReport, setOpenReport] = useState<AssistantBlock | null>(null);

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? projects[0],
    [projects, currentProjectId]
  );

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId) ?? null,
    [conversations, currentConversationId]
  );

  const messages = currentConversation?.messages ?? [];

  const currentProjectRunningTasks = useMemo(
    () => runningTasks.filter((t) => t.projectId === currentProjectId),
    [runningTasks, currentProjectId]
  );

  /** 哪些对话当前有正在跑的任务（用于侧边栏显示小 loading 动画） */
  const runningConvIds = useMemo(() => {
    const set = new Set<string>();
    runningTasks.forEach((t) => set.add(t.conversationId));
    return set;
  }, [runningTasks]);

  /**
   * 派生：当前有「分析终止」未被用户确认的对话 id 集合。
   * 数据源是 conversations 中是否包含 analysis-aborted 类型的 assistant block；
   * 用户进入该对话后会被加入 acknowledgedAbortedConvIds，红点消失。
   */
  const abortedConvIds = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach((c) => {
      if (acknowledgedAbortedConvIds.has(c.id)) return;
      const hasAborted = c.messages.some(
        (m) =>
          m.role === "assistant" &&
          m.blocks?.some((b) => b.kind === "analysis-aborted")
      );
      if (hasAborted) set.add(c.id);
    });
    return set;
  }, [conversations, acknowledgedAbortedConvIds]);

  /** 进入一个对话时，自动清理它的未读标记，并把「任务终止」红点也一并清掉 */
  useEffect(() => {
    if (!currentConversationId) return;
    setUnreadConvIds((prev) => {
      if (!prev.has(currentConversationId)) return prev;
      const next = new Set(prev);
      next.delete(currentConversationId);
      return next;
    });
    setAcknowledgedAbortedConvIds((prev) => {
      if (prev.has(currentConversationId)) return prev;
      const next = new Set(prev);
      next.add(currentConversationId);
      return next;
    });
  }, [currentConversationId]);

  // —— 项目操作 ——
  const updateProject = (patch: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProjectId
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const renameProject = (id: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setConversations((prev) => prev.filter((c) => c.projectId !== id));
    setRunningTasks((prev) => prev.filter((t) => t.projectId !== id));
    if (id === currentProjectId) {
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        const nextProjectId = remaining[0].id;
        setCurrentProjectId(nextProjectId);
        setCurrentConversationId(null);
        setView("project-home");
      } else {
        setCurrentConversationId(null);
        setView("new-project");
      }
    }
  };

  // —— 子对话操作 ——
  const renameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setRunningTasks((prev) => prev.filter((t) => t.conversationId !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setView("project-home");
    }
  };

  const appendMessage = useCallback((conversationId: string, msg: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [...c.messages, msg],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  /** 为指定项目创建一个空的临时对话，并切到对话视图 */
  const createEmptyConversationFor = (projectId: string) => {
    const convId = uid("conv");
    const newConv: Conversation = {
      id: convId,
      projectId,
      title: "新对话",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: true,
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(convId);
    setCurrentProjectId(projectId);
    setView("conversation");
    return convId;
  };

  /** 打开或复用该项目下的草稿对话 */
  const openOrCreateDraftFor = (projectId: string) => {
    const existingDraft = conversations.find(
      (c) => c.projectId === projectId && c.isDraft
    );
    if (existingDraft) {
      setCurrentProjectId(projectId);
      setCurrentConversationId(existingDraft.id);
      setView("conversation");
      return existingDraft.id;
    }
    return createEmptyConversationFor(projectId);
  };

  /** 点击侧边栏的项目「名称」→ 打开项目主页 */
  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentConversationId(null);
    setView("project-home");
  };

  /** 侧边栏「+」/ 项目主页「新建对话」按钮 */
  const handleCreateConversation = (projectId: string) => {
    openOrCreateDraftFor(projectId);
  };

  const handleOpenConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    setCurrentProjectId(conv.projectId);
    setCurrentConversationId(id);
    setView("conversation");
  };

  // —— Agent 能力识别 ——
  const detectIntent = (text: string): "fact-check" | "challenge" | "ambiguous" => {
    const factSignals = [
      "事实", "核对", "校验", "验证", "数字", "数据", "对比", "差异", "出入",
      "一致", "口径", "口径一致", "勾稽",
    ];
    const challengeSignals = [
      "质询", "挑战", "风险", "逻辑", "矛盾", "漏洞", "假设", "存疑", "疑点", "压力", "拷问",
    ];
    const hasFact = factSignals.some((k) => text.includes(k));
    const hasChallenge = challengeSignals.some((k) => text.includes(k));
    if (hasFact && !hasChallenge) return "fact-check";
    if (hasChallenge && !hasFact) return "challenge";
    return "ambiguous";
  };

  /**
   * 触发一个长任务（挑战质询 / 事实交叉验证），右侧栏的任务卡片会实时显示进度，
   * 完成后由 ticker 把 resultBlocks 注入到对话流。
   */
  const startTask = (
    kind: "challenge" | "fact-check",
    conversationId: string,
    projectId: string,
    userQuery: string
  ) => {
    const isChallenge = kind === "challenge";
    const sysMsg: ChatMessage = {
      id: uid("m"),
      role: "system",
      text: isChallenge
        ? "挑战质询任务已启动。该类任务涉及行业研报对照与多文档交叉佐证，预计耗时较长；右侧任务卡片将实时显示进度，完成后自动追加质询清单。"
        : "事实交叉验证任务已启动。Agent 正在对议案 / BP / FDD / 审计报告等多源材料做关键数据交叉比对；右侧任务卡片将实时显示进度，完成后自动追加偏差清单。",
      createdAt: new Date().toISOString(),
    };
    appendMessage(conversationId, sysMsg);

    const resultBlock = isChallenge
      ? buildGenericChallengeBlock(userQuery)
      : buildGenericFactCheckBlock(userQuery);

    const task: RunningTask = {
      id: uid("task"),
      projectId,
      conversationId,
      kind,
      title:
        userQuery.trim().slice(0, 28) ||
        (isChallenge ? "挑战质询任务" : "事实交叉验证任务"),
      summary:
        userQuery.trim() ||
        (isChallenge
          ? "围绕投资逻辑与执行风险开展多维拷问"
          : "对议案 / BP / FDD / 审计的关键数字做多源交叉比对"),
      progress: 4,
      startedAt: new Date().toISOString(),
      resultBlocks: [resultBlock],
    };
    setRunningTasks((prev) => [task, ...prev]);
  };

  /** 在某个 conversation 中发送 user 消息 + 触发 Agent 回复 */
  const sendInConversation = (
    conversationId: string,
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => {
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: new Date().toISOString(),
    };
    appendMessage(conversationId, userMsg);

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        if (!c.isDraft && c.title !== "新对话") return c;
        const nextTitle = text.trim().slice(0, 24) || c.title;
        return { ...c, title: nextTitle, isDraft: false };
      })
    );

    const conv = conversations.find((c) => c.id === conversationId);
    const projectId = conv?.projectId ?? currentProjectId;

    if (text.trim().length === 0) {
      return;
    }

    const intent = detectIntent(text);

    if (intent === "challenge" || intent === "fact-check") {
      startTask(intent, conversationId, projectId, text);
      return;
    }

    // ambiguous → 待确认
    setGenerating(true);
    setTimeout(() => {
      const pickMsg: ChatMessage = {
        id: uid("m"),
        role: "assistant",
        createdAt: new Date().toISOString(),
        blocks: [
          {
            kind: "mode-pick",
            title: "Agent 暂时无法判断该问题适合哪类能力",
            reason:
              "您的问题表述较宽泛，Agent 智能路由未能在「事实交叉验证」与「挑战质询」之间做出可靠判断。请手动选择一项继续。",
            originalQuery: text,
            options: [
              {
                mode: "fact-check",
                label: "走「事实交叉验证」",
                desc: "对议案 / BP / FDD / LDD 内的关键数字做多源比对，输出差异清单与佐证锚点",
                recommended: true,
              },
              {
                mode: "challenge",
                label: "走「挑战质询」",
                desc: "围绕商业逻辑、关键假设、市场与执行风险生成投决会式的拷问清单",
              },
            ],
          },
        ],
      };
      appendMessage(conversationId, pickMsg);
      setGenerating(false);
    }, 700);
  };

  /** 项目主页输入：先打开/创建草稿对话，再发送首条消息 */
  const handleSendFromHome = (
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => {
    const convId = openOrCreateDraftFor(currentProjectId);
    sendInConversation(convId, text, attachments);
  };

  const handleSend = (
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => {
    if (!currentConversationId) return;
    sendInConversation(currentConversationId, text, attachments);
  };

  const handleModePick = (
    _msgId: string,
    pickedMode: Extract<WorkMode, "fact-check" | "challenge">,
    originalQuery: string
  ) => {
    if (!currentConversationId) return;
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text: originalQuery,
      mode: pickedMode,
      createdAt: new Date().toISOString(),
    };
    appendMessage(currentConversationId, userMsg);
    startTask(pickedMode, currentConversationId, currentProjectId, originalQuery);
  };

  const handleClarificationSubmit = (
    _msgId: string,
    values: Record<string, string>,
    followUp?: AssistantBlock[]
  ) => {
    if (!currentConversationId) return;

    if (followUp && followUp.length > 0) {
      const dilution = values["dilution"] || "30";
      const irr = values["expected-irr"] || "15";
      const ackMsg: ChatMessage = {
        id: uid("m"),
        role: "assistant",
        createdAt: new Date().toISOString(),
        blocks: [
          {
            kind: "text",
            text: `已收到补充数据（稀释比例 ${dilution}% · IRR ${irr}%），正在按 VC 倒算 + PS 对比 + PTA 三种方法并行测算…`,
          },
        ],
      };
      appendMessage(currentConversationId, ackMsg);
      setGenerating(true);
      const targetId = currentConversationId;
      setTimeout(() => {
        const reportMsg: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          createdAt: new Date().toISOString(),
          blocks: followUp,
        };
        appendMessage(targetId, reportMsg);
        setGenerating(false);
      }, 1400);
      return;
    }

    const dilution = values["dilution"] || "30";
    const irr = values["expected-irr"] || "15";
    const replyMsg: ChatMessage = {
      id: uid("m"),
      role: "assistant",
      createdAt: new Date().toISOString(),
      blocks: [
        {
          kind: "text",
          text: `已根据补充数据（稀释比例 ${dilution}% · IRR ${irr}%）继续推算，结果详见上方更新结论。`,
        },
      ],
    };
    appendMessage(currentConversationId, replyMsg);
  };

  const handleCreate = (proj: Project) => {
    setProjects((prev) => [proj, ...prev]);
    setCurrentProjectId(proj.id);
    setCurrentConversationId(null);

    if (proj.files.length > 0) {
      setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) => (p.id === proj.id ? { ...p, status: "parsed" } : p))
        );
      }, 2200);
    }
    setView("project-home");
  };

  const handleRecalculate = () => {
    const targetProjectId = currentProjectId;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === targetProjectId
          ? { ...p, status: "parsing", updatedAt: new Date().toISOString() }
          : p
      )
    );
    setTimeout(() => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjectId
            ? { ...p, status: "parsed", updatedAt: new Date().toISOString() }
            : p
        )
      );
    }, 6000);

    if (!currentConversationId) return;
    const sysMsg: ChatMessage = {
      id: uid("m"),
      role: "system",
      text: `分析评估已启动（${currentProject.riskTolerance} · ${
        currentProject.stage === "early-growth" ? "早期/成长期" : "中后期/Pre-IPO"
      }），将基于最新偏好与知识库重新生成事实验证与质询清单。期间您可以继续提问，结果就绪后会自动归档。`,
      createdAt: new Date().toISOString(),
    };
    appendMessage(currentConversationId, sysMsg);
  };

  const handleUpdateFiles = (files: KnowledgeFile[]) => {
    updateProject({ files });
  };

  const handleExport = () => {
    alert("导出为报告（Markdown / Word）— Demo 中保留入口");
  };

  /**
   * 用户在 analysis-aborted 卡片里通过快速上传补传资料：
   *   1) 把新文件 prepend 到当前项目知识库，状态走 uploading → parsing → indexed
   *   2) 同步把项目 status 从 failed 推回 parsing → parsed
   *   3) 在当前对话中追加 system「已接收 N 份补传…」+ 解析完成后的 assistant 文本回执
   * AnalysisAbortedCard 自己负责把卡片视觉切到「成功态」，这里只管真实数据写入。
   */
  const handleQuickUpload = useCallback(
    (_msgId: string, files: FileList) => {
      if (!currentProject || !currentConversationId) return;
      const projectId = currentProject.id;
      const conversationId = currentConversationId;
      const incoming: KnowledgeFile[] = Array.from(files).map((f) => ({
        id: uid("file"),
        name: f.name,
        size: formatFileSize(f.size),
        kind: inferFileKind(f.name),
        status: "uploading",
        uploadedAt: new Date().toISOString(),
      }));
      const incomingIds = new Set(incoming.map((f) => f.id));

      // 1) 立即写入文件 + status 推回 parsing
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                files: [...incoming, ...p.files],
                status: "parsing",
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      );
      // 2) 对话流回执：系统消息
      appendMessage(conversationId, {
        id: uid("m"),
        role: "system",
        text: `已接收 ${incoming.length} 份补传资料，正在重启批量解析…`,
        createdAt: new Date().toISOString(),
      });

      // 3) 600ms：uploading → parsing
      window.setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  files: p.files.map((f) =>
                    incomingIds.has(f.id) ? { ...f, status: "parsing" } : f
                  ),
                }
              : p
          )
        );
      }, 600);

      // 4) 2800ms：parsing → indexed + 项目 status = parsed + assistant 回执
      window.setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  files: p.files.map((f) =>
                    incomingIds.has(f.id) ? { ...f, status: "indexed" } : f
                  ),
                  status: "parsed",
                  updatedAt: new Date().toISOString(),
                }
              : p
          )
        );
        const head = incoming.slice(0, 2).map((f) => f.name).join("、");
        const tail = incoming.length > 2 ? ` 等 ${incoming.length} 份` : "";
        appendMessage(conversationId, {
          id: uid("m"),
          role: "assistant",
          createdAt: new Date().toISOString(),
          blocks: [
            {
              kind: "text",
              text: `补传资料解析完成：${head}${tail}。事实交叉验证、估值平行测算与挑战质询能力已恢复，可继续向 Agent 提问。`,
            },
          ],
        });
      }, 2800);
    },
    [currentProject, currentConversationId, appendMessage]
  );

  // —— 长任务推进 ticker：每秒推进 progress，达 100 后注入结果到对话流 ——
  const taskCompletionRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (runningTasks.length === 0) return;
    const id = window.setInterval(() => {
      setRunningTasks((prev) => {
        if (prev.length === 0) return prev;
        const completedNow: RunningTask[] = [];
        const nextList = prev.map((t) => {
          const next = Math.min(100, t.progress + TASK_TICK_PER_SEC);
          if (next >= 100 && !taskCompletionRef.current.has(t.id)) {
            taskCompletionRef.current.add(t.id);
            completedNow.push({ ...t, progress: 100 });
          }
          return { ...t, progress: next };
        });
        if (completedNow.length > 0) {
          const completedIds = new Set(completedNow.map((t) => t.id));
          // 进度条停在 100% 短暂展示后再清理任务卡 + 注入结果
          window.setTimeout(() => {
            completedNow.forEach((t) => {
              const reportMsg: ChatMessage = {
                id: uid("m"),
                role: "assistant",
                createdAt: new Date().toISOString(),
                blocks: t.resultBlocks,
              };
              appendMessage(t.conversationId, reportMsg);
              // 标记为「新到达的报告」，MessageList 渲染时走一次 yellow fade 动画
              setNewReportMsgIds((prev) => {
                const next = new Set(prev);
                next.add(reportMsg.id);
                return next;
              });
              // 用户当前不在该对话页 → 打未读标记
              if (t.conversationId !== currentConversationId) {
                setUnreadConvIds((prev) => {
                  if (prev.has(t.conversationId)) return prev;
                  const next = new Set(prev);
                  next.add(t.conversationId);
                  return next;
                });
              }
            });
            setRunningTasks((curr) => curr.filter((t) => !completedIds.has(t.id)));
          }, 600);
        }
        return nextList;
      });
    }, TASK_TICK_MS);
    return () => window.clearInterval(id);
  }, [runningTasks.length, appendMessage, currentConversationId]);

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Sidebar
          projects={projects}
          conversations={conversations}
          currentProjectId={currentProjectId}
          currentConversationId={currentConversationId}
          runningConversationIds={runningConvIds}
          unreadConversationIds={unreadConvIds}
          abortedConversationIds={abortedConvIds}
          onSelectProject={selectProject}
          onOpenConversation={handleOpenConversation}
          onCreateConversation={handleCreateConversation}
          onNewProject={() => setView("new-project")}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          {view === "project-home" && currentProject && (
            <ProjectHome
              project={currentProject}
              conversations={conversations}
              settingsOpen={settingsOpen}
              onToggleSettings={() => setSettingsOpen((v) => !v)}
              onRenameProject={renameProject}
              onOpenConversation={handleOpenConversation}
              onCreateConversation={handleCreateConversation}
              onRenameConversation={renameConversation}
              onDeleteConversation={deleteConversation}
              onUpdateFiles={handleUpdateFiles}
              onSendFromHome={handleSendFromHome}
            />
          )}

          {view === "conversation" && currentProject && (
            <>
              <WorkspaceHeader
                project={currentProject}
                conversation={currentConversation}
                settingsOpen={settingsOpen}
                onToggleSettings={() => setSettingsOpen((v) => !v)}
                onRenameConversation={(newTitle) => {
                  if (currentConversationId) {
                    renameConversation(currentConversationId, newTitle);
                  }
                }}
                onBackToProjectHome={() => {
                  setCurrentConversationId(null);
                  setView("project-home");
                }}
              />
              <MessageList
                messages={messages}
                generating={generating}
                onViewSource={setViewerAnchor}
                onClarificationSubmit={handleClarificationSubmit}
                onExport={handleExport}
                onOpenReport={(b) => setOpenReport(b)}
                onModePick={handleModePick}
                hasKnowledge={currentProject.files.length > 0}
                newReportMessageIds={newReportMsgIds}
                onReportAnimated={(id) =>
                  setNewReportMsgIds((prev) => {
                    if (!prev.has(id)) return prev;
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                  })
                }
                onQuickUpload={handleQuickUpload}
              />
              <ChatComposer
                onSend={handleSend}
                generating={generating}
                onStop={() => setGenerating(false)}
              />
            </>
          )}

          {view === "new-project" && (
            <div className="flex-1 overflow-y-auto thin-scroll px-6 py-10">
              <ProjectWizard
                onCreate={handleCreate}
                onCancel={() => {
                  if (projects[0]) selectProject(projects[0].id);
                }}
              />
            </div>
          )}
        </main>

        {/* 右侧项目设置面板：在对话详情页与项目主页都展示，新建项目时隐藏 */}
        {(view === "conversation" || view === "project-home") && currentProject && (
          <div
            className={cn(
              "shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
              settingsOpen ? "w-[320px]" : "w-0"
            )}
            aria-hidden={!settingsOpen}
          >
            <SettingsPanel
              project={currentProject}
              runningTasks={currentProjectRunningTasks}
              onUpdate={updateProject}
              onRecalculate={handleRecalculate}
              onOpenTaskConversation={handleOpenConversation}
            />
          </div>
        )}

        <QuoteViewer anchor={viewerAnchor} onClose={() => setViewerAnchor(null)} />
        <ReportDrawer
          block={openReport}
          onClose={() => setOpenReport(null)}
          onViewSource={setViewerAnchor}
          onDownload={handleExport}
        />
      </div>
    </TooltipProvider>
  );
}

/** 用户主动发起事实交叉验证时，任务完成后注入的通用 fact-verification 块 */
function buildGenericFactCheckBlock(query: string): AssistantBlock {
  return {
    kind: "fact-verification",
    title: "事实交叉验证（基于当前知识库口径）",
    level: "P1",
    summary: `已围绕「${query.trim().slice(0, 36) || "您的请求"}」对议案 / BP / FDD / 审计报告等多源材料做了关键数据交叉比对，命中若干差异点，详见下方对照。`,
    compares: [
      {
        label: "2024 全年营业收入",
        claim: { source: "投决议案-V3.pdf p.7", value: "1.82 亿元" },
        reality: { source: "审计报告 p.23", value: "1.68 亿元" },
        delta: "+8.3%",
        level: "P1",
        deviationDetail: {
          explanation:
            "议案口径包含集团内部交易（约 1,400 万），审计报告做了内部抵销。",
          impact: "若按审计口径，PS 估值倍数实际为 7.5× 而非议案宣称的 6.9×，对估值合理性形成压力。",
          recommendation:
            "要求公司说明合并口径与内部交易抵销策略；条款上可加「营收口径偏差>5% 触发业绩补偿」。",
        },
      },
      {
        label: "2024 经营性现金流",
        claim: { source: "BP_2026Q2.pptx p.14", value: "+3,100 万元" },
        reality: { source: "审计报告 p.36", value: "-1,250 万元" },
        delta: "+348%",
        level: "P0",
        deviationDetail: {
          explanation:
            "BP 将客户预付款计入经营性现金流；审计报告按准则将其归类为合同负债，未计入。",
          impact:
            "经营性现金流真实为负，意味着公司高度依赖外部融资，对估值与对赌条款应做相应调整。",
          recommendation:
            "复核客户预付款合同条款；建议增设「连续 2 季度经营现金流为负则触发回购权」。",
        },
      },
    ],
    anchors: [],
    citations: [],
  };
}

/** 当用户主动发起挑战质询时，构造一个通用 challenge-list 占位块作为完成时的结果 */
function buildGenericChallengeBlock(query: string): AssistantBlock {
  return {
    kind: "challenge-list",
    title: "灵魂质询清单（按当前偏好口径过滤）",
    summary: `围绕您提出的「${query.trim().slice(0, 36)}…」与该项目知识库做了多维对照，得到以下质询要点与条款建议。`,
    items: [
      {
        id: "auto-c-1",
        priority: "P1",
        title: "核心假设缺乏外部数据支撑",
        coreLogic:
          "公司测算所依赖的关键假设（增速 / 毛利 / 客单价）目前主要来源于内部 BP，缺少行业研报或可比对标的交叉佐证。建议在条款层面加入「超出假设区间触发对赌」机制。",
        evidence: [
          {
            document: "BP_2026Q2.pptx",
            page: 17,
            excerpt: "公司假设 2026 年综合毛利率提升至 55%（依据：底层模型推理价格下降 40%）。",
            highlight: ["55%", "下降 40%"],
          },
        ],
        actionAdvice: [
          "要求公司提供第三方对标数据；24 个月内综合毛利不低于 35% 即触发业绩补偿",
        ],
        category: "财务",
      },
      {
        id: "auto-c-2",
        priority: "P2",
        title: "团队基因与战略路径错配",
        coreLogic:
          "团队画像与战略路径之间存在明显错配，需要在投后协议层面建立纠偏机制（如关键岗位变更知会权、独立技术董事席位）。",
        evidence: [
          {
            document: "BP_2026Q2.pptx",
            page: 6,
            excerpt: "CTO 张某履历披露偏概括，缺少具体项目与年限信息。",
            highlight: ["资深架构师"],
          },
        ],
        actionAdvice: [
          "增设 CTO 履历背调专项条款；投后协议预留关键岗位变更知会权",
        ],
        category: "团队",
      },
    ],
    citations: [],
  };
}

export default App;
