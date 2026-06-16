import { useEffect, useMemo, useRef, useState } from "react";

import { AnalyzingBadge } from "@/src/components/ui/analyzing-badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconChevronDown,
  IconDelete,
  IconFolder,
  IconFolderOpen,
  IconMore,
  IconPlus,
  IconRefresh,
  IconRename,
  IconSettings,
  IconSignOut,
  IconUser,
} from "@/src/lib/icons";
import { cn, isListedConversation, isProjectAnalyzing } from "@/src/lib/utils";
import type { Conversation, Project } from "@/src/types";

interface SidebarProps {
  projects: Project[];
  conversations: Conversation[];
  currentProjectId: string;
  currentConversationId: string | null;
  /** 有正在跑任务的对话 id 集合 —— 行尾显示循环 loading 小图标 */
  runningConversationIds?: Set<string>;
  /** 未读对话 id 集合（任务完成时用户不在该对话页则会加入） —— 行尾显示绿点 */
  unreadConversationIds?: Set<string>;
  /** 任务已终止且用户尚未查看的对话 id 集合 —— 行尾显示红色脉动点 */
  abortedConversationIds?: Set<string>;
  onSelectProject: (id: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onCreateConversation: (projectId: string) => void;
  onNewProject: () => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  /** 对话重命名 / 删除（侧边栏与项目主页共用同一套行为） */
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

const PROJECT_VISIBLE_LIMIT = 4;
const SUBITEM_VISIBLE_LIMIT = 5;
const RECENT_LIMIT = 8;

export function Sidebar({
  projects,
  conversations,
  currentProjectId,
  currentConversationId,
  runningConversationIds,
  unreadConversationIds,
  abortedConversationIds,
  onSelectProject,
  onOpenConversation,
  onCreateConversation,
  onNewProject,
  onRenameProject,
  onDeleteProject,
  onRenameConversation,
  onDeleteConversation,
}: SidebarProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  /** 对话行的更多菜单 / 重命名 inline 编辑 */
  const [convMenuId, setConvMenuId] = useState<string | null>(null);
  const [convRenameId, setConvRenameId] = useState<string | null>(null);
  const [convRenameDraft, setConvRenameDraft] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set([currentProjectId]));
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [expandedAllConvs, setExpandedAllConvs] = useState<Set<string>>(() => new Set());
  /** 鼠标停在项目左侧图标上时，把文件夹图标替换为下箭头 */
  const [iconHoverId, setIconHoverId] = useState<string | null>(null);
  /** 假登录态：默认已登录，UI 可在 footer 模拟登录/退出切换 */
  const [loggedIn, setLoggedIn] = useState(true);
  /** 底部用户菜单的展开状态 */
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        setConvMenuId(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const beginConvRename = (c: Conversation, rowKey: string) => {
    setConvRenameId(rowKey);
    setConvRenameDraft(c.title);
    setConvMenuId(null);
  };

  const commitConvRename = (convId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      onRenameConversation(convId, trimmed);
    }
    setConvRenameId(null);
    setConvRenameDraft("");
  };

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
      className="flex h-full w-[260px] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white"
    >
      <div className="thin-scroll flex-1 overflow-y-auto px-3 pb-3 pt-4">
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
          const projectConvs = convsByProject[p.id] ?? [];
          const hasConvs = projectConvs.length > 0;
          // 没有历史对话时禁用展开态：图标 & 颜色都保持折叠样式
          const expanded = expandedIds.has(p.id) && hasConvs;
          // 鼠标 hover 在图标上时：若有历史对话则展示下箭头，否则维持文件夹
          const showChevronOnIcon = iconHoverId === p.id && hasConvs;
          const FolderIcon = expanded ? IconFolderOpen : IconFolder;
          const showAllForThis = expandedAllConvs.has(p.id);
          const visibleConvs = showAllForThis
            ? projectConvs
            : projectConvs.slice(0, SUBITEM_VISIBLE_LIMIT);
          const hasMoreConvs =
            projectConvs.length > SUBITEM_VISIBLE_LIMIT && !showAllForThis;
          const analyzing = isProjectAnalyzing(p);

          const toggleExpand = () => {
            if (!hasConvs) return;
            setExpandedIds((prev) => {
              const next = new Set(prev);
              if (next.has(p.id)) next.delete(p.id);
              else next.add(p.id);
              return next;
            });
          };

          return (
            <li key={p.id}>
              {/* 项目行：使用 div 容器承载 hover/active 背景，内部拆出「图标」和「项目名」两个独立按钮 */}
              <div
                className={cn(
                  "group/project relative flex items-center rounded-md transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-800 hover:bg-gray-100"
                )}
              >
                {renaming ? (
                  <div className="w-full px-2 py-1">
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
                    {/* 左侧图标：hover 变成下箭头，点击展开/折叠 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand();
                      }}
                      onMouseEnter={() => setIconHoverId(p.id)}
                      onMouseLeave={() => setIconHoverId(null)}
                      aria-label={expanded ? "收起项目对话" : "展开项目对话"}
                      title={
                        hasConvs
                          ? expanded
                            ? "收起历史对话"
                            : "展开历史对话"
                          : "暂无历史对话"
                      }
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                        hasConvs
                          ? "hover:bg-gray-200"
                          : "cursor-default"
                      )}
                    >
                      <SFIcon
                        icon={showChevronOnIcon ? IconChevronDown : FolderIcon}
                        size={14}
                        className={cn(
                          showChevronOnIcon
                            ? "text-gray-900"
                            : expanded
                            ? "text-gray-900"
                            : "text-gray-400"
                        )}
                      />
                    </button>

                    {/* 项目名：点击打开项目主页 */}
                    <button
                      type="button"
                      onClick={() => onSelectProject(p.id)}
                      className="min-w-0 flex-1 truncate py-1.5 pr-[4.5rem] text-left text-[13.5px]"
                    >
                      <span className="line-clamp-1">{p.name}</span>
                    </button>

                    {/* 解析中徽章：默认显示，hover 时让位给操作按钮 */}
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
                    // 同一对话可能在「项目展开列表」与「最近」同时出现，
                    // 用「位置 + convId」做复合 key，避免菜单/重命名状态串扰
                    const rowKey = `proj-${p.id}:${c.id}`;
                    return (
                      <ConvRow
                        key={c.id}
                        conv={c}
                        indent
                        active={c.id === currentConversationId}
                        running={runningConversationIds?.has(c.id) ?? false}
                        unread={unreadConversationIds?.has(c.id) ?? false}
                        aborted={abortedConversationIds?.has(c.id) ?? false}
                        menuOpen={convMenuId === rowKey}
                        renaming={convRenameId === rowKey}
                        renameDraft={convRenameDraft}
                        onOpen={() => onOpenConversation(c.id)}
                        onToggleMenu={() =>
                          setConvMenuId(convMenuId === rowKey ? null : rowKey)
                        }
                        onBeginRename={() => beginConvRename(c, rowKey)}
                        onCommitRename={(newTitle) =>
                          commitConvRename(c.id, newTitle)
                        }
                        onCancelRename={() => {
                          setConvRenameId(null);
                          setConvRenameDraft("");
                        }}
                        onChangeRenameDraft={setConvRenameDraft}
                        onDelete={() => {
                          setConvMenuId(null);
                          if (
                            confirm(
                              `确定要删除对话「${c.title}」吗？此操作不可撤销。`
                            )
                          ) {
                            onDeleteConversation(c.id);
                          }
                        }}
                      />
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
              const rowKey = `recent:${c.id}`;
              return (
                <ConvRow
                  key={c.id}
                  conv={c}
                  active={c.id === currentConversationId}
                  running={runningConversationIds?.has(c.id) ?? false}
                  unread={unreadConversationIds?.has(c.id) ?? false}
                  aborted={abortedConversationIds?.has(c.id) ?? false}
                  menuOpen={convMenuId === rowKey}
                  renaming={convRenameId === rowKey}
                  renameDraft={convRenameDraft}
                  onOpen={() => onOpenConversation(c.id)}
                  onToggleMenu={() =>
                    setConvMenuId(convMenuId === rowKey ? null : rowKey)
                  }
                  onBeginRename={() => beginConvRename(c, rowKey)}
                  onCommitRename={(newTitle) =>
                    commitConvRename(c.id, newTitle)
                  }
                  onCancelRename={() => {
                    setConvRenameId(null);
                    setConvRenameDraft("");
                  }}
                  onChangeRenameDraft={setConvRenameDraft}
                  onDelete={() => {
                    setConvMenuId(null);
                    if (
                      confirm(
                        `确定要删除对话「${c.title}」吗？此操作不可撤销。`
                      )
                    ) {
                      onDeleteConversation(c.id);
                    }
                  }}
                />
              );
            })}
          </ul>
        </>
      )}
      </div>

      <UserFooter
        loggedIn={loggedIn}
        menuOpen={userMenuOpen}
        onToggleMenu={() => setUserMenuOpen((v) => !v)}
        onLogin={() => {
          setLoggedIn(true);
          setUserMenuOpen(false);
        }}
        onLogout={() => {
          setLoggedIn(false);
          setUserMenuOpen(false);
        }}
        onCloseMenu={() => setUserMenuOpen(false)}
      />
    </aside>
  );
}

/** 侧边栏底部的用户入口：展示当前账号、点击展开「设置 / 退出登录」迷你菜单；未登录则展示「登录 / 注册」按钮 */
function UserFooter({
  loggedIn,
  menuOpen,
  onToggleMenu,
  onLogin,
  onLogout,
  onCloseMenu,
}: {
  loggedIn: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onCloseMenu: () => void;
}) {
  // 假账号信息：仅用于 demo，真实数据接入后从 user store 取
  const MOCK_USER = {
    name: "黄海",
    role: "投资总监 · 启明创投",
    initial: "黄",
  };

  return (
    <div className="relative shrink-0 border-t border-gray-200 bg-white px-3 py-2.5">
      {loggedIn ? (
        <>
          <button
            type="button"
            onClick={onToggleMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors",
              menuOpen ? "bg-gray-100" : "hover:bg-gray-100"
            )}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[12px] font-semibold text-white"
              aria-hidden
            >
              {MOCK_USER.initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 text-[12.5px] font-medium text-gray-900">
                {MOCK_USER.name}
              </span>
              <span className="line-clamp-1 text-[11px] text-gray-500">
                {MOCK_USER.role}
              </span>
            </span>
            <SFIcon
              icon={IconMore}
              size={12}
              className={cn(
                "shrink-0 transition-colors",
                menuOpen
                  ? "text-gray-700"
                  : "text-gray-400 group-hover:text-gray-600"
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute bottom-[calc(100%-6px)] left-3 right-3 z-30 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
              <UserMenuItem
                icon={<SFIcon icon={IconUser} size={12} />}
                label="个人资料"
                onClick={() => {
                  onCloseMenu();
                  alert("演示：跳转个人资料页（暂未实现）");
                }}
              />
              <UserMenuItem
                icon={<SFIcon icon={IconSettings} size={12} />}
                label="账号设置"
                onClick={() => {
                  onCloseMenu();
                  alert("演示：跳转账号设置（暂未实现）");
                }}
              />
              <div className="h-px bg-gray-100" />
              <UserMenuItem
                icon={<SFIcon icon={IconSignOut} size={12} />}
                label="退出登录"
                danger
                onClick={onLogout}
              />
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-[12.5px] font-medium text-white shadow-sm transition-colors hover:bg-black"
        >
          <SFIcon icon={IconUser} size={12} />
          登录 / 注册
        </button>
      )}
    </div>
  );
}

function UserMenuItem({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors",
        danger
          ? "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <span className={cn(danger ? "" : "text-gray-500")}>{icon}</span>
      {label}
    </button>
  );
}

/**
 * 对话行尾的状态指示器，优先级从高到低：
 *  - 有正在跑的任务 → 循环 loading（与文字颜色一致）
 *  - 任务终止待确认 → 红色脉动圆点
 *  - 有未读新消息  → 绿色脉动圆点
 */
function ConvIndicator({
  running,
  unread,
  aborted,
}: {
  running: boolean;
  unread: boolean;
  aborted: boolean;
}) {
  if (running) {
    // 使用 text-current 让 loading 图标继承所在对话行的文字颜色，与标题一致
    return (
      <SFIcon
        icon={IconRefresh}
        size={10}
        className="shrink-0 animate-spin text-current opacity-70"
        aria-label="任务运行中"
      />
    );
  }
  if (aborted) {
    return (
      <span
        className="relative flex h-2 w-2 shrink-0"
        aria-label="任务已终止"
        title="任务已终止，待处理"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
      </span>
    );
  }
  if (unread) {
    return (
      <span
        className="relative flex h-2 w-2 shrink-0"
        aria-label="未读新消息"
        title="有新结果未读"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    );
  }
  return null;
}

/**
 * 单条对话行：项目展开列表 & 「最近」 复用同一份渲染。
 * 提供 hover 出现的 ⋯ 操作菜单：重命名 / 删除（删除二次确认），重命名走 inline Input。
 */
function ConvRow({
  conv,
  indent = false,
  active,
  running,
  unread,
  aborted,
  menuOpen,
  renaming,
  renameDraft,
  onOpen,
  onToggleMenu,
  onBeginRename,
  onCommitRename,
  onCancelRename,
  onChangeRenameDraft,
  onDelete,
}: {
  conv: Conversation;
  /** 在项目展开列表里左侧有 9px 缩进对齐折叠图标 */
  indent?: boolean;
  active: boolean;
  running: boolean;
  unread: boolean;
  aborted: boolean;
  menuOpen: boolean;
  renaming: boolean;
  renameDraft: string;
  onOpen: () => void;
  onToggleMenu: () => void;
  onBeginRename: () => void;
  /** 入参为最新草稿内容，由父级负责 trim + 调用 onRenameConversation */
  onCommitRename: (newTitle: string) => void;
  onCancelRename: () => void;
  onChangeRenameDraft: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <li>
      <div
        className={cn(
          "group/conv relative flex items-center rounded-md transition-colors",
          active
            ? "bg-gray-100 text-gray-900"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {renaming ? (
          <div className={cn("w-full py-1", indent ? "pl-9 pr-2" : "px-2")}>
            <Input
              autoFocus
              value={renameDraft}
              onChange={(e) => onChangeRenameDraft(e.target.value)}
              onBlur={(e) => onCommitRename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") onCancelRename();
              }}
              className="h-7 text-[13px]"
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-[13px]",
                indent ? "pl-9 pr-16" : "pl-2 pr-16"
              )}
              title={conv.title}
            >
              <span className="line-clamp-1 flex-1">{conv.title}</span>
              <ConvIndicator
                running={running}
                unread={unread}
                aborted={aborted}
              />
            </button>

            <div
              className={cn(
                "absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 transition-opacity",
                menuOpen
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 group-hover/conv:pointer-events-auto group-hover/conv:opacity-100"
              )}
            >
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMenu();
                }}
                aria-label="更多操作"
                title="更多操作"
              >
                <SFIcon icon={IconMore} size={12} />
              </button>
            </div>

            {menuOpen && (
              <div className="absolute right-1 top-full z-20 mt-0.5 w-28 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                <MenuButton
                  icon={<SFIcon icon={IconRename} size={11} />}
                  label="重命名"
                  onClick={onBeginRename}
                />
                <MenuButton
                  icon={<SFIcon icon={IconDelete} size={11} />}
                  label="删除"
                  danger
                  onClick={onDelete}
                />
              </div>
            )}
          </>
        )}
      </div>
    </li>
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
