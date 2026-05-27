import { useEffect, useState } from "react";

import { AnalyzingBadge } from "@/src/components/ui/analyzing-badge";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconRename, IconSidebarRight } from "@/src/lib/icons";
import { cn, isProjectAnalyzing } from "@/src/lib/utils";
import type { Conversation, Project } from "@/src/types";

interface WorkspaceHeaderProps {
  project: Project;
  conversation: Conversation | null;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  onRenameConversation: (newTitle: string) => void;
  /** 点击项目名 / 返回按钮：回到项目主页 */
  onBackToProjectHome?: () => void;
}

export function WorkspaceHeader({
  project,
  conversation,
  settingsOpen,
  onToggleSettings,
  onRenameConversation,
  onBackToProjectHome,
}: WorkspaceHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(conversation?.title ?? "");

  useEffect(() => {
    setDraft(conversation?.title ?? "");
    setEditing(false);
  }, [conversation?.id, conversation?.title]);

  const commit = () => {
    if (draft.trim() && conversation && draft.trim() !== conversation.title) {
      onRenameConversation(draft.trim());
    } else {
      setDraft(conversation?.title ?? "");
    }
    setEditing(false);
  };

  const analyzing = isProjectAnalyzing(project);

  return (
    <header className="flex items-center justify-between gap-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onBackToProjectHome}
          className="max-w-[140px] shrink-0 truncate rounded-md px-1.5 py-0.5 text-[12px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title={`返回「${project.name}」项目主页`}
        >
          {project.name}
        </button>
        {analyzing && <AnalyzingBadge size="md" />}
        <span className="text-gray-300">/</span>
        {conversation ? (
          editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraft(conversation.title);
                  setEditing(false);
                }
              }}
              className="h-7 max-w-[320px] text-[13.5px] font-semibold"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="group flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 text-left hover:bg-gray-100"
              title="重命名对话"
            >
              <h1 className="truncate text-[14px] font-semibold text-gray-900">
                {conversation.title}
              </h1>
              <SFIcon
                icon={IconRename}
                size={11}
                className="text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          )
        ) : (
          <h1 className="truncate text-[14px] font-semibold text-gray-900">新对话</h1>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleSettings}
        className={cn(
          "shrink-0 rounded-lg p-1.5 transition-colors",
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
    </header>
  );
}
