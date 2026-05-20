import { useEffect, useMemo, useRef, useState } from "react";

import { AnalyzingBadge } from "@/src/components/ui/analyzing-badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconDelete,
  IconFolder,
  IconFolderOpen,
  IconMore,
  IconPlus,
  IconRename,
} from "@/src/lib/icons";
import { cn, isListedConversation, isProjectAnalyzing } from "@/src/lib/utils";
import type { Conversation, Project } from "@/src/types";

interface SidebarProps {
  projects: Project[];
  conversations: Conversation[];
  currentProjectId: string;
  currentConversationId: string | null;
  onSelectProject: (id: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onCreateConversation: (projectId: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
}

const PROJECT_VISIBLE_LIMIT = 4;
const SUBITEM_VISIBLE_LIMIT = 5;
const RECENT_LIMIT = 8;

export function Sidebar({
  projects,
  conversations,
  currentProjectId,
  currentConversationId,
  onSelectProject,
  onOpenConversation,
  onCreateConversation,
  onNewProject,
  onRenameProject,
  onDeleteProject,
}: SidebarProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set([currentProjectId]));
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [expandedAllConvs, setExpandedAllConvs] = useState<Set<string>>(() => new Set());

  const listedConversations = useMemo(
    () => conversations.filter(isListedConversation),
    [conversations]
  );

  useEffect(() => {
    if (!currentProjectId) return;
    setExpandedIds((prev) => {
      if (prev.has(currentProjectId)) return prev;
      const next = new Set(prev);
      next.add(currentProjectId);
      return next;
    });
  }, [currentProjectId]);

  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const beginRename = (p: Project) => {
    setRenameId(p.id);
    setRenameDraft(p.name);
    setMenuId(null);
  };

  const commitRename = () => {
    if (renameId && renameDraft.trim()) {
      onRenameProject(renameId, renameDraft.trim());
    }
    setRenameId(null);
    setRenameDraft("");
  };

  const convsByProject = useMemo(() => {
    const map: Record<string, Conversation[]> = {};
    for (const c of listedConversations) {
      if (!map[c.projectId]) map[c.projectId] = [];
      map[c.projectId].push(c);
    }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return map;
  }, [listedConversations]);

  const recentConversations = useMemo(
    () =>
      [...listedConversations]
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, RECENT_LIMIT),
    [listedConversations]
  );

  const visibleProjects = showAllProjects
    ? projects
    : projects.slice(0, PROJECT_VISIBLE_LIMIT);
  const hasMoreProjects = projects.length > PROJECT_VISIBLE_LIMIT;

  const showProjectActions = (projectId: string) =>
    menuId === projectId ? "opacity-100" : "opacity-0 group-hover/project:opacity-100";

  return (
    <aside
      ref={rootRef}
      className="thin-scroll flex h-full w-[260px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white px-3 py-4"
    >
      <Button
        variant="default"
        size="default"
        className="mb-3 w-full justify-center"
        onClick={onNewProject}
      >
        <SFIcon icon={IconPlus} size={13} />
        新项目
      </Button>

      <h2 className="px-2 pb-1.5 text-[13.5px] font-semibold text-gray-900">项目</h2>
      <ul className="space-y-0.5">
        {visibleProjects.map((p) => {
          const active = p.id === currentProjectId;
          const renaming = renameId === p.id;
          const expanded = expandedIds.has(p.id);
          const projectConvs = convsByProject[p.id] ?? [];
          const ToggleIcon = expanded ? IconFolderOpen : IconFolder;
          const showAllForThis = expandedAllConvs.has(p.id);
          const visibleConvs = showAllForThis
            ? projectConvs
            : projectConvs.slice(0, SUBITEM_VISIBLE_LIMIT);
          const hasMoreConvs =
            projectConvs.length > SUBITEM_VISIBLE_LIMIT && !showAllForThis;
          const analyzing = isProjectAnalyzing(p);

          return (
            <li key={p.id}>
              {/* 项目行：操作按钮仅相对本行定位，避免叠在子对话之间 */}
              <div className="group/project relative">
                {renaming ? (
                  <div className="px-2 py-1">
                    <Input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        if (e.key === "Escape") {
                          setRenameId(null);
                          setRenameDraft("");
                        }
                      }}
                      className="h-7 text-[13px]"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (active) {
                          const isExpanded = expandedIds.has(p.id);
                          if (isExpanded) {
                            setExpandedIds((prev) => {
                              if (!prev.has(p.id)) return prev;
                              const next = new Set(prev);
                              next.delete(p.id);
                              return next;
                            });
                          } else {
                            setExpandedIds((prev) => {
                              if (prev.has(p.id)) return prev;
                              const next = new Set(prev);
                              next.add(p.id);
                              return next;
                            });
                          }
                        } else {
                          onSelectProject(p.id);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md py-1.5 pl-2 pr-[4.5rem] text-left text-[13.5px] transition-colors",
                        active
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-800 hover:bg-gray-100"
                      )}
                    >
                      <SFIcon
                        icon={ToggleIcon}
                        size={14}
                        className={cn(
                          "shrink-0",
                          expanded ? "text-gray-900" : "text-gray-400"
                        )}
                      />
                      <span className="line-clamp-1 flex-1">{p.name}</span>
                    </button>

                    {/* 分析中徽章：默认显示，hover 时让位给操作按钮 */}
                    {analyzing && (
                      <div
                        className={cn(
                          "pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 transition-opacity",
                          menuId === p.id
                            ? "opacity-0"
                            : "opacity-100 group-hover/project:opacity-0"
                        )}
                      >
                        <AnalyzingBadge />
                      </div>
                    )}

                    <div
                      className={cn(
                        "absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 transition-opacity",
                        showProjectActions(p.id),
                        menuId === p.id
                          ? "pointer-events-auto"
                          : "pointer-events-none group-hover/project:pointer-events-auto"
                      )}
                    >
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIds((prev) => {
                            if (prev.has(p.id)) return prev;
                            const next = new Set(prev);
                            next.add(p.id);
                            return next;
                          });
                          onCreateConversation(p.id);
                        }}
                        aria-label="新建对话"
                        title="新建对话"
                      >
                        <SFIcon icon={IconPlus} size={12} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuId(menuId === p.id ? null : p.id);
                        }}
                        aria-label="更多操作"
                        title="更多操作"
                      >
                        <SFIcon icon={IconMore} size={12} />
                      </button>
                    </div>

                    {menuId === p.id && (
                      <div className="absolute right-1 top-full z-20 mt-0.5 w-28 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                        <MenuButton
                          icon={<SFIcon icon={IconRename} size={11} />}
                          label="重命名"
                          onClick={() => beginRename(p)}
                        />
                        <MenuButton
                          icon={<SFIcon icon={IconDelete} size={11} />}
                          label="删除"
                          danger
                          onClick={() => {
                            setMenuId(null);
                            if (
                              confirm(
                                `确定要删除项目「${p.name}」吗？此操作不可撤销。`
                              )
                            ) {
                              onDeleteProject(p.id);
                            }
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {expanded && !renaming && projectConvs.length > 0 && (
                <ul className="mb-1 mt-0.5 space-y-0.5">
                  {visibleConvs.map((c) => {
                    const activeConv = c.id === currentConversationId;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => onOpenConversation(c.id)}
                          className={cn(
                            "block w-full truncate rounded-md py-1.5 pl-9 pr-3 text-left text-[13px] transition-colors",
                            activeConv
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                          title={c.title}
                        >
                          {c.title}
                        </button>
                      </li>
                    );
                  })}
                  {hasMoreConvs && (
                    <li>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAllConvs((prev) => {
                            if (prev.has(p.id)) return prev;
                            const next = new Set(prev);
                            next.add(p.id);
                            return next;
                          })
                        }
                        className="block w-full rounded-md py-1.5 pl-9 pr-3 text-left text-[12.5px] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                      >
                        显示更多
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}

        {hasMoreProjects && (
          <li>
            <button
              type="button"
              onClick={() => setShowAllProjects((v) => !v)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13.5px] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <SFIcon icon={IconMore} size={14} className="text-gray-400" />
              <span>{showAllProjects ? "收起" : "更多"}</span>
            </button>
          </li>
        )}
      </ul>

      {recentConversations.length > 0 && (
        <>
          <h2 className="mt-6 px-2 pb-1.5 text-[13.5px] font-semibold text-gray-900">
            最近
          </h2>
          <ul className="space-y-0.5">
            {recentConversations.map((c) => {
              const active = c.id === currentConversationId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpenConversation(c.id)}
                    className={cn(
                      "block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={c.title}
                  >
                    {c.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
}

function MenuButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11.5px] hover:bg-gray-50",
        danger
          ? "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
          : "text-gray-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
