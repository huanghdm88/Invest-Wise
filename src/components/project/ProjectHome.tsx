import { useEffect, useMemo, useState } from "react";

import { ChatComposer } from "@/src/components/chat/ChatComposer";
import { AnalyzingBadge } from "@/src/components/ui/analyzing-badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  KnowledgePanel,
  getKnowledgeActivity,
} from "@/src/components/layout/KnowledgePanel";
import {
  IconDelete,
  IconMessage,
  IconPlus,
  IconRefresh,
  IconRename,
  IconSidebarRight,
} from "@/src/lib/icons";
import {
  cn,
  formatRelative,
  isListedConversation,
  isProjectAnalyzing,
} from "@/src/lib/utils";
import type {
  Conversation,
  FileKind,
  KnowledgeFile,
  Project,
} from "@/src/types";

interface ProjectHomeProps {
  project: Project;
  conversations: Conversation[];
  /** 右侧栏开合状态（用于在项目主页也能折叠右侧栏） */
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onRenameProject: (id: string, newName: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onCreateConversation: (projectId: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onUpdateFiles: (files: KnowledgeFile[]) => void;
  /** 项目主页输入框：发送即创建/打开草稿对话并提交首条消息 */
  onSendFromHome: (
    text: string,
    attachments: Array<{ name: string; size: string; kind: FileKind }>
  ) => void;
}

type HomeTab = "conversations" | "knowledge";

export function ProjectHome({
  project,
  conversations,
  settingsOpen,
  onToggleSettings,
  onRenameProject,
  onOpenConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onUpdateFiles,
  onSendFromHome,
}: ProjectHomeProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [tab, setTab] = useState<HomeTab>("conversations");
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [convDraft, setConvDraft] = useState("");

  useEffect(() => {
    setNameDraft(project.name);
    setEditingName(false);
  }, [project.id, project.name]);

  const listedConvs = useMemo(
    () =>
      conversations
        .filter((c) => c.projectId === project.id && isListedConversation(c))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [conversations, project.id]
  );

  const commitProjectName = () => {
    const next = nameDraft.trim();
    if (next && next !== project.name) {
      onRenameProject(project.id, next);
    } else {
      setNameDraft(project.name);
    }
    setEditingName(false);
  };

  const beginRenameConv = (c: Conversation) => {
    setRenamingConvId(c.id);
    setConvDraft(c.title);
  };

  const commitRenameConv = () => {
    if (renamingConvId && convDraft.trim()) {
      onRenameConversation(renamingConvId, convDraft.trim());
    }
    setRenamingConvId(null);
    setConvDraft("");
  };

  const analyzing = isProjectAnalyzing(project);
  const knowledgeActivity = getKnowledgeActivity(project.files, project.status);

  return (
    <div className="thin-scroll relative flex-1 overflow-y-auto bg-[hsl(var(--background))]">
      {/* 右侧栏开合按钮：始终钉在主区右上角，方便项目主页也能折叠右侧栏 */}
      <button
        type="button"
        onClick={onToggleSettings}
        className={cn(
          "absolute right-4 top-4 z-10 shrink-0 rounded-lg p-1.5 transition-colors",
          settingsOpen
            ? "bg-gray-100 text-gray-900"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        )}
        aria-label={settingsOpen ? "收起项目设置" : "展开项目设置"}
        aria-pressed={settingsOpen}
        title={settingsOpen ? "收起项目设置" : "展开项目设置"}
      >
        <SFIcon icon={IconSidebarRight} size={14} />
      </button>

      <div className="mx-auto w-full max-w-3xl px-6 pb-16 pt-12">
        {/* —— 顶部：项目名 + 副信息 + 解析中徽章 —— */}
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitProjectName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      setNameDraft(project.name);
                      setEditingName(false);
                    }
                  }}
                  className="h-10 max-w-[420px] text-[26px] font-semibold"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="group flex min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-gray-100"
                  title="重命名项目"
                >
                  <h1 className="truncate text-[26px] font-semibold leading-tight text-gray-900">
                    {project.name}
                  </h1>
                  <SFIcon
                    icon={IconRename}
                    size={13}
                    className="text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              )}
              {analyzing && <AnalyzingBadge size="md" />}
            </div>
            <p className="mt-1.5 text-[12.5px] text-gray-500">
              {project.industry} · {project.stage === "early-growth" ? "早期 / 成长期" : "中后期 / Pre-IPO"} · {project.riskTolerance}
              {" · 最近更新 "}
              {formatRelative(project.updatedAt)}
            </p>
          </div>
        </header>

        {/* —— 输入框：发送即创建草稿对话 —— */}
        <ChatComposer
          onSend={(text, attachments) => onSendFromHome(text, attachments)}
          generating={false}
          onStop={() => {}}
        />

        {/* —— Tabs：历史对话 / 项目知识库 —— */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as HomeTab)}
          className="mt-6 px-4"
        >
          <TabsList
            className="flex h-auto w-full items-center justify-start gap-2 bg-transparent p-0"
            aria-label="项目内容分类"
          >
            <TabsTrigger
              value="conversations"
              className="inline-flex items-center gap-1 rounded-full border border-transparent bg-transparent px-3.5 py-1 text-[13px] font-medium text-gray-400 shadow-none transition-colors hover:text-gray-600 data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
            >
              <span>历史对话</span>
              {listedConvs.length > 0 && (
                <span className="text-[11px] font-normal text-gray-400">
                  · {listedConvs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="knowledge"
              className="inline-flex items-center gap-1 rounded-full border border-transparent bg-transparent px-3.5 py-1 text-[13px] font-medium text-gray-400 shadow-none transition-colors hover:text-gray-600 data-[state=active]:border-gray-200 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none"
            >
              <span>项目知识库</span>
              {knowledgeActivity ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[11px] font-medium",
                    knowledgeActivity.tone === "amber"
                      ? "text-amber-600"
                      : "text-rose-600"
                  )}
                >
                  {knowledgeActivity.spinning && (
                    <SFIcon
                      icon={IconRefresh}
                      size={10}
                      className="animate-spin"
                    />
                  )}
                  <span>
                    {knowledgeActivity.label}
                    {knowledgeActivity.count > 1
                      ? ` · ${knowledgeActivity.count}`
                      : ""}
                  </span>
                </span>
              ) : project.files.length > 0 ? (
                <span className="text-[11px] font-normal text-gray-400">
                  · {project.files.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* 历史对话 */}
          <TabsContent value="conversations" className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11.5px] text-gray-500">
                所有已发送对话按更新时间排序
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateConversation(project.id)}
              >
                <SFIcon icon={IconPlus} size={11} />
                新建对话
              </Button>
            </div>

            {listedConvs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                <p className="text-[13px] font-medium text-gray-700">
                  当前项目还没有历史对话
                </p>
                <p className="mt-1 text-[11.5px] text-gray-500">
                  从上方输入框直接发问，或点击「新建对话」开始一段全新讨论。
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {listedConvs.map((c) => {
                  const preview =
                    c.messages.find((m) => m.role === "user")?.text ??
                    c.messages.find((m) => m.role === "assistant")?.blocks?.find(
                      (b) => b.kind === "text"
                    )?.text ??
                    "尚未开始";
                  const renaming = renamingConvId === c.id;
                  return (
                    <li
                      key={c.id}
                      className="group/conv flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
                        <SFIcon icon={IconMessage} size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        {renaming ? (
                          <Input
                            autoFocus
                            value={convDraft}
                            onChange={(e) => setConvDraft(e.target.value)}
                            onBlur={commitRenameConv}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") {
                                setRenamingConvId(null);
                                setConvDraft("");
                              }
                            }}
                            className="h-7 text-[13px]"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenConversation(c.id)}
                            className="block w-full text-left"
                          >
                            <p className="truncate text-[13.5px] font-medium text-gray-900">
                              {c.title}
                            </p>
                            <p className="mt-0.5 truncate text-[11.5px] leading-snug text-gray-500">
                              {String(preview).slice(0, 64)}
                            </p>
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-[10.5px] text-gray-400">
                          {formatRelative(c.updatedAt)}
                        </span>
                        <button
                          type="button"
                          aria-label="重命名对话"
                          title="重命名对话"
                          onClick={(e) => {
                            e.stopPropagation();
                            beginRenameConv(c);
                          }}
                          className="rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover/conv:opacity-100 hover:bg-gray-100 hover:text-gray-700"
                        >
                          <SFIcon icon={IconRename} size={11} />
                        </button>
                        <button
                          type="button"
                          aria-label="删除对话"
                          title="删除对话"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `确定要删除对话「${c.title}」吗？此操作不可撤销。`
                              )
                            ) {
                              onDeleteConversation(c.id);
                            }
                          }}
                          className="rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover/conv:opacity-100 hover:bg-gray-100 hover:text-[hsl(var(--destructive))]"
                        >
                          <SFIcon icon={IconDelete} size={11} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          {/* 项目知识库 */}
          <TabsContent value="knowledge" className="mt-4">
            <KnowledgePanel files={project.files} onUpdateFiles={onUpdateFiles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
