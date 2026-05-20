import { useEffect, useMemo, useState } from "react";

import { LoginPage } from "@/src/components/auth/LoginPage";
import { ChatComposer } from "@/src/components/chat/ChatComposer";
import { MessageList } from "@/src/components/chat/MessageList";
import { QuoteViewer } from "@/src/components/chat/QuoteViewer";
import { ReportDrawer } from "@/src/components/chat/ReportDrawer";
import { SettingsPanel, type SettingsTab } from "@/src/components/layout/SettingsPanel";
import { Sidebar } from "@/src/components/layout/Sidebar";
import { WorkspaceHeader } from "@/src/components/layout/WorkspaceHeader";
import { ProjectWizard } from "@/src/components/project/ProjectWizard";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { mockConversations } from "@/src/data/mock-conversations";
import { mockProjects } from "@/src/data/mock-projects";
import { cn, isListedConversation, uid } from "@/src/lib/utils";
import type {
  AssistantBlock,
  ChatMessage,
  Conversation,
  FileKind,
  KnowledgeFile,
  Project,
  SourceAnchor,
  WorkMode,
} from "@/src/types";

/**
 * 视图：
 *  - conversation：对话详情页（默认）
 *  - new-project：新建项目向导
 */
type ViewMode = "conversation" | "new-project";

const SETTINGS_OPEN_KEY = "iw.settingsOpen";

function App() {
  const [authed, setAuthed] = useState(false);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

  // 进入应用时默认选中第一个项目下最近的一条对话
  const initialProjectId = mockProjects[0]?.id ?? "";
  const initialConversationId = useMemo(() => {
    const sorted = mockConversations
      .filter((c) => c.projectId === initialProjectId && isListedConversation(c))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return sorted[0]?.id ?? null;
  }, [initialProjectId]);

  const [currentProjectId, setCurrentProjectId] = useState<string>(initialProjectId);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId
  );
  const [view, setView] = useState<ViewMode>("conversation");

  const [generating, setGenerating] = useState(false);
  const [viewerAnchor, setViewerAnchor] = useState<SourceAnchor | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("preferences");

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

  // Canvas 抽屉：当前展开查看的报告块
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
    if (id === currentProjectId) {
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        const nextProjectId = remaining[0].id;
        const nextProjectConvs = conversations
          .filter((c) => c.projectId === nextProjectId && isListedConversation(c))
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        setCurrentProjectId(nextProjectId);
        if (nextProjectConvs[0]) {
          setCurrentConversationId(nextProjectConvs[0].id);
          setView("conversation");
        } else {
          createEmptyConversationFor(nextProjectId);
        }
      } else {
        setCurrentConversationId(null);
        setView("new-project");
      }
    }
  };

  // —— 子对话操作 ——
  const updateConversation = (id: string, patch: Partial<Conversation>) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const renameConversation = (id: string, newTitle: string) => {
    updateConversation(id, { title: newTitle });
  };

  const appendMessage = (conversationId: string, msg: ChatMessage) => {
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
  };

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

  /** 点击侧边栏的项目：切到该项目下最新已发布对话，否则打开草稿或新建草稿 */
  const selectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setView("conversation");
    const listed = conversations
      .filter((c) => c.projectId === projectId && isListedConversation(c))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (listed[0]) {
      setCurrentConversationId(listed[0].id);
      return;
    }
    openOrCreateDraftFor(projectId);
  };

  /** 侧边栏 hover：为项目新建对话（草稿，不出现在子集/最近） */
  const handleCreateConversation = (projectId: string) => {
    openOrCreateDraftFor(projectId);
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

  const buildAssistantTextReply = (): ChatMessage => ({
    id: uid("m"),
    role: "assistant",
    createdAt: new Date().toISOString(),
    blocks: [
      {
        kind: "text",
        text:
          "已收到您的指令，正在结合当前项目知识库与偏好设置（" +
          (currentProject.riskTolerance === "R1"
            ? "国资防守型"
            : currentProject.riskTolerance === "R2"
            ? "稳健均衡型"
            : "激进创投型") +
          "）开展分析。Demo 环境下结构化结论卡片以预置示例呈现，详见上方对话历史。",
      },
    ],
  });

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

    // 首条用户消息：更新标题并退出草稿态（侧边栏子集/最近才会展示）
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        if (!c.isDraft && c.title !== "新对话") return c;
        const nextTitle = text.trim().slice(0, 24) || c.title;
        return { ...c, title: nextTitle, isDraft: false };
      })
    );

    // Agent 自动识别意图；ambiguous → mode-pick；明确意图 → 直接处理
    if (text.trim().length > 0) {
      const intent = detectIntent(text);
      if (intent === "ambiguous") {
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
        return;
      }
    }

    setGenerating(true);
    setTimeout(() => {
      appendMessage(conversationId, buildAssistantTextReply());
      setGenerating(false);
    }, 1200);
  };

  /** 对话详情页：底部发送框 */
  const handleSend = (
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => {
    if (!currentConversationId) return;
    sendInConversation(currentConversationId, text, attachments);
  };

  /** mode-pick 卡片选择后：以指定能力继续处理 */
  const handleModePick = (
    _msgId: string,
    _pickedMode: Extract<WorkMode, "fact-check" | "challenge">,
    originalQuery: string
  ) => {
    if (!currentConversationId) return;
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text: originalQuery,
      createdAt: new Date().toISOString(),
    };
    appendMessage(currentConversationId, userMsg);
    setGenerating(true);
    setTimeout(() => {
      appendMessage(currentConversationId, buildAssistantTextReply());
      setGenerating(false);
    }, 1200);
  };

  const handleClarificationSubmit = (
    _msgId: string,
    values: Record<string, string>,
    followUp?: AssistantBlock[]
  ) => {
    if (!currentConversationId) return;

    // 有 followUp（如估值平行测算报告）：模拟分析过程后追加 Agent 报告
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

    // 无 followUp：保留兜底文案
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

    // 创建项目时若有资料则附带一条 system 引导对话；否则进入空对话
    if (proj.files.length > 0) {
      const convId = uid("conv");
      const greeting: Conversation = {
        id: convId,
        projectId: proj.id,
        title: "项目入库引导",
        messages: [
          {
            id: uid("m"),
            role: "system",
            text: `项目「${proj.name}」资料库已开始解析（${proj.files.length} 份文件），完成后将通过邮件通知您。`,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setConversations((prev) => [greeting, ...prev]);
      setCurrentConversationId(convId);
      setView("conversation");
      setTimeout(() => {
        setProjects((prev) =>
          prev.map((p) => (p.id === proj.id ? { ...p, status: "parsed" } : p))
        );
      }, 2200);
    } else {
      createEmptyConversationFor(proj.id);
    }
  };

  const handleRecalculate = () => {
    // 模拟「分析中」可视化：把项目状态切到 parsing，约 6 秒后恢复为 parsed
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
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversationId
          ? {
              ...c,
              messages: [...c.messages, sysMsg],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  const handleUpdateFiles = (files: KnowledgeFile[]) => {
    updateProject({ files });
  };

  const handleExport = () => {
    alert("导出为报告（Markdown / Word）— Demo 中保留入口");
  };

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        {/* 左侧栏：项目列表 + 二级历史对话 + 最近对话 */}
        <Sidebar
          projects={projects}
          conversations={conversations}
          currentProjectId={currentProjectId}
          currentConversationId={currentConversationId}
          onSelectProject={selectProject}
          onOpenConversation={(id) => {
            const conv = conversations.find((c) => c.id === id);
            if (conv) {
              setCurrentProjectId(conv.projectId);
              setCurrentConversationId(id);
              setView("conversation");
            }
          }}
          onCreateConversation={handleCreateConversation}
          onNewProject={() => setView("new-project")}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
        />

        {/* 中间工作区 */}
        <main className="relative flex min-w-0 flex-1 flex-col">
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
                  // 取消时回到当前项目下的对话（或现有第一条对话）
                  if (currentConversationId) setView("conversation");
                  else if (projects[0]) selectProject(projects[0].id);
                }}
              />
            </div>
          )}
        </main>

        {/* 右侧项目设置面板：仅对话详情页显示 */}
        {view === "conversation" && currentProject && (
          <div
            className={cn(
              "shrink-0 overflow-hidden transition-[width] duration-300 ease-out",
              settingsOpen ? "w-[320px]" : "w-0"
            )}
            aria-hidden={!settingsOpen}
          >
            <SettingsPanel
              project={currentProject}
              activeTab={settingsTab}
              onTabChange={setSettingsTab}
              onUpdate={updateProject}
              onUpdateFiles={handleUpdateFiles}
              onRecalculate={handleRecalculate}
            />
          </div>
        )}

        {/* 引文查看抽屉 */}
        <QuoteViewer anchor={viewerAnchor} onClose={() => setViewerAnchor(null)} />

        {/* 报告 Canvas 抽屉 */}
        <ReportDrawer
          block={openReport}
          onClose={() => setOpenReport(null)}
          onViewSource={setViewerAnchor}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
