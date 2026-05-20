import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Logo } from "@/src/components/logo";
import {
  IconArchive,
  IconCheckCircle,
  IconDelete,
  IconFolderManager,
  IconMore,
  IconPlus,
  IconRefresh,
  IconRename,
} from "@/src/lib/icons";
import { cn, formatRelative } from "@/src/lib/utils";
import type { Project } from "@/src/types";

interface SidebarProps {
  projects: Project[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenManager: () => void;
}

function statusBadge(status: Project["status"]) {
  if (status === "parsed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
        <SFIcon icon={IconCheckCircle} size={11} />
        解析完成
      </span>
    );
  }
  if (status === "parsing") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
        <SFIcon icon={IconRefresh} size={11} className="animate-spin" />
        解析中
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        解析失败
      </span>
    );
  }
  // draft 状态不显示状态徽标，改用标题文字置灰来表达"未就绪"
  return null;
}

export function Sidebar({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject,
  onOpenManager,
}: SidebarProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-gray-200 bg-[#f8f8f9]">
      <div className="flex items-center justify-between border-b border-gray-200/70 px-3.5 py-3">
        <Logo />
        <button
          type="button"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"
          onClick={onOpenManager}
          aria-label="项目管理"
          title="项目管理"
        >
          <SFIcon icon={IconFolderManager} size={14} />
        </button>
      </div>

      <div className="px-2.5 pt-2.5">
        <Button variant="default" size="default" className="w-full justify-start" onClick={onNewProject}>
          <SFIcon icon={IconPlus} size={13} />
          新建项目
        </Button>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto thin-scroll px-2 pb-3">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          历史项目 · {projects.length}
        </p>
        <ul className="space-y-0.5">
          {projects.map((p) => {
            const active = p.id === currentProjectId;
            const muted = p.status === "draft";
            return (
              <li
                key={p.id}
                className="relative"
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => {
                  setHoverId(null);
                  setMenuId(null);
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className={cn(
                    "group flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    active
                      ? "bg-[#EBEBEB]"
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={cn(
                        "line-clamp-1 text-[13px]",
                        muted
                          ? "font-medium text-gray-400"
                          : active
                          ? "font-semibold text-gray-900"
                          : "font-medium text-gray-900"
                      )}
                    >
                      {p.name}
                    </span>
                    {statusBadge(p.status)}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-1.5 text-[10.5px]",
                      muted ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    <span className="line-clamp-1">{p.industry}</span>
                    <span className="shrink-0">{formatRelative(p.updatedAt)}</span>
                  </div>
                </button>

                {(hoverId === p.id || menuId === p.id) && (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1.5 rounded p-1 text-gray-400 opacity-90 hover:bg-gray-200 hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuId(menuId === p.id ? null : p.id);
                    }}
                    aria-label="更多操作"
                  >
                    <SFIcon icon={IconMore} size={12} />
                  </button>
                )}
                {menuId === p.id && (
                  <div className="absolute right-1.5 top-8 z-20 w-28 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                    <MenuButton icon={<SFIcon icon={IconRename} size={11} />} label="重命名" />
                    <MenuButton icon={<SFIcon icon={IconArchive} size={11} />} label="归档" />
                    <MenuButton icon={<SFIcon icon={IconDelete} size={11} />} label="删除" danger />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function MenuButton({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[11.5px] hover:bg-gray-50",
        danger ? "text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10" : "text-gray-700"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
