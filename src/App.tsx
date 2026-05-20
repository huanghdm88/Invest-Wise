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
import { mockMessages } from "@/src/data/mock-conversations";
import { mockProjects } from "@/src/data/mock-projects";
import { cn, uid } from "@/src/lib/utils";
import type {
  AssistantBlock,
  ChatMessage,
  FileKind,
  KnowledgeFile,
  Project,
  SourceAnchor,
  WorkMode,
} from "@/src/types";

type ViewMode = "workspace" | "new-project";

const SETTINGS_OPEN_KEY = "iw.settingsOpen";

function App() {
  const [authed, setAuthed] = useState(false);

  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentId, setCurrentId] = useState<string>(mockProjects[0].id);
  const [view, setView] = useState<ViewMode>("workspace");

  // 每个项目独立的会话
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({
    [mockProjects[0].id]: mockMessages,
  });

  const [mode, setMode] = useState<WorkMode>("auto");
  const [generating, setGenerating] = useState(false);
  const [viewerAnchor, setViewerAnchor] = useState<SourceAnchor | null>(null);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("preferences");
  const [settingsDirty, setSettingsDirty] = useState(false);

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
    () => projects.find((p) => p.id === currentId) ?? projects[0],
    [projects, currentId]
  );

  const messages = conversations[currentId] ?? [];

  const updateProject = (patch: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === currentId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
    );
  };

  /** 智能路由：识别用户意图属于 fact-check / challenge / 无法判断 */
  const detectIntent = (text: string): "fact-check" | "challenge" | "ambiguous" => {
    const factSignals = ["事实", "核对", "校验", "验证", "数字", "数据", "对比", "差异", "出入", "一致", "口径", "口径一致", "勾稽"];
    const challengeSignals = ["质询", "挑战", "风险", "逻辑", "矛盾", "漏洞", "假设", "存疑", "疑点", "压力", "拷问"];
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

  const handleSend = (
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => {
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      mode,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => ({
      ...prev,
      [currentId]: [...(prev[currentId] ?? []), userMsg],
    }));

    // 智能路由模式下，若意图模糊（同时命中或都未命中），返回 mode-pick 让用户决定
    if (mode === "auto" && text.trim().length > 0) {
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
                title: "这条问题适合哪种 Agent 处理？",
                reason:
                  "智能路由未能在「事实交叉验证」和「挑战质询」之间确定唯一意图。请选择一个模式以继续，Agent 将按选择重新分发任务。",
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
          setConversations((prev) => ({
            ...prev,
            [currentId]: [...(prev[currentId] ?? []), pickMsg],
          }));
          setGenerating(false);
        }, 700);
        return;
      }
    }

    setGenerating(true);
    setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [currentId]: [...(prev[currentId] ?? []), buildAssistantTextReply()],
      }));
      setGenerating(false);
    }, 1200);
  };

  /** 用户在 mode-pick 卡片上挑了模式 → 切换并以该模式重发原问题 */
  const handleModePick = (
    _msgId: string,
    pickedMode: Extract<WorkMode, "fact-check" | "challenge">,
    originalQuery: string
  ) => {
    setMode(pickedMode);
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      text: originalQuery,
      mode: pickedMode,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => ({
      ...prev,
      [currentId]: [...(prev[currentId] ?? []), userMsg],
    }));
    setGenerating(true);
    setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [currentId]: [...(prev[currentId] ?? []), buildAssistantTextReply()],
      }));
      setGenerating(false);
    }, 1200);
  };

  const handleClarificationSubmit = (msgId: string, values: Record<string, string>) => {
    const dilution = values["dilution"] || "30";
    const irr = values["expected-irr"] || "15";
    const replyMsg: ChatMessage = {
      id: uid("m"),
      role: "assistant",
      createdAt: new Date().toISOString(),
      blocks: [
        {
          kind: "text",
          text: `已根据补充数据（稀释比例 ${dilution}% · IRR ${irr}%）重新触发估值平行测算，详见上方更新结论。`,
        },
      ],
    };
    setConversations((prev) => ({
      ...prev,
      [currentId]: [...(prev[currentId] ?? []), replyMsg],
    }));
  };

  const handleCreate = (proj: Project) => {
    setProjects((prev) => [proj, ...prev]);
    setConversations((prev) => ({
      ...prev,
      [proj.id]: [
        {
          id: uid("m"),
          role: "system",
          text:
            proj.files.length > 0
              ? `项目「${proj.name}」资料库已开始解析（${proj.files.length} 份文件），完成后将通过邮件通知您。`
              : `项目「${proj.name}」已创建。请上传投决议案、财务尽调、法律尽调等核心材料，方可发起事实验证 / 挑战质询。`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setCurrentId(proj.id);
    setView("workspace");
    // 模拟解析完成
    if (proj.files.length > 0) {
      setTimeout(() => {
        setProjects((prev) => prev.map((p) => (p.id === proj.id ? { ...p, status: "parsed" } : p)));
      }, 2200);
    }
  };

  const handleRecalculate = () => {
    const sysMsg: ChatMessage = {
      id: uid("m"),
      role: "system",
      text: `分析评估已启动（${currentProject.riskTolerance} · ${
        currentProject.stage === "early-growth" ? "早期/成长期" : "中后期/Pre-IPO"
      }），将基于最新偏好与知识库重新生成事实验证与质询清单。`,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => ({ ...prev, [currentId]: [sysMsg] }));
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
        {/* 左侧栏 */}
        <Sidebar
          projects={projects}
          currentProjectId={currentId}
          onSelectProject={(id) => {
            setCurrentId(id);
            setView("workspace");
          }}
          onNewProject={() => setView("new-project")}
          onOpenManager={() => {
            setView("workspace");
            setSettingsTab("knowledge");
          }}
        />

        {/* 中间工作区 */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {view === "workspace" && (
            <>
              <WorkspaceHeader
                project={currentProject}
                settingsOpen={settingsOpen}
                onToggleSettings={() => setSettingsOpen((v) => !v)}
              />
              <MessageList
                messages={messages}
                generating={generating}
                onViewSource={setViewerAnchor}
                onClarificationSubmit={handleClarificationSubmit}
                onExport={handleExport}
                onOpenReport={(b) => setOpenReport(b)}
                onModePick={handleModePick}
                awaitingSetup={currentProject.status === "draft"}
              />
              <ChatComposer
                mode={mode}
                onChangeMode={setMode}
                webSearch={currentProject.webSearch}
                onToggleWebSearch={(v) => updateProject({ webSearch: v })}
                onSend={handleSend}
                generating={generating}
                onStop={() => setGenerating(false)}
                settingsPending={settingsDirty}
                awaitingSetup={currentProject.status === "draft"}
              />
            </>
          )}

          {view === "new-project" && (
            <div className="flex-1 overflow-y-auto thin-scroll px-6 py-10">
              <ProjectWizard onCreate={handleCreate} onCancel={() => setView("workspace")} />
            </div>
          )}
        </main>

        {/* 右侧项目设置面板：偏好 + 知识库（仅工作区显示，可折叠） */}
        {view === "workspace" && (
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
              onDirtyChange={setSettingsDirty}
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
