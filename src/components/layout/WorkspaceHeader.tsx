import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconSidebarRight } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { Project } from "@/src/types";

interface WorkspaceHeaderProps {
  project: Project;
  settingsOpen: boolean;
  onToggleSettings: () => void;
}

export function WorkspaceHeader({ project, settingsOpen, onToggleSettings }: WorkspaceHeaderProps) {
  const isDraft = project.status === "draft";
  return (
    <header className="flex items-center justify-between gap-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <h1
          className={cn(
            "truncate text-[15px] font-semibold",
            isDraft ? "text-gray-400" : "text-gray-900"
          )}
        >
          {project.name}
        </h1>
        {!isDraft && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              project.status === "parsed"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : project.status === "parsing"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            )}
          >
            {project.status === "parsed" && "解析完成"}
            {project.status === "parsing" && "解析中"}
            {project.status === "failed" && "解析失败"}
          </span>
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
