import { useEffect, useState } from "react";

import { ChallengeTaskCard } from "@/src/components/chat/ChallengeTaskCard";
import { CompanyInfoSection } from "@/src/components/layout/CompanyInfoSection";
import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconChallenge, IconTarget } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { Project, RunningTask } from "@/src/types";

interface SettingsPanelProps {
  project: Project;
  runningTasks: RunningTask[];
  onUpdate: (next: Partial<Project>) => void;
  onRecalculate: () => void;
  /** 点击任务卡片：跳转到任务对应的对话 */
  onOpenTaskConversation?: (conversationId: string) => void;
}

export function SettingsPanel({
  project,
  runningTasks,
  onUpdate,
  onRecalculate,
  onOpenTaskConversation,
}: SettingsPanelProps) {
  const [dirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setDirty(false);
    setShowConfirm(false);
  }, [project.id]);

  const updatePref = (patch: Partial<Project>) => {
    onUpdate(patch);
    setDirty(true);
  };

  return (
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">
            项目设置
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            {dirty ? "偏好已更新，待重新分析评估" : "企业信息 / 偏好 · 即时编辑"}
          </p>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
            dirty
              ? "border-amber-300 bg-amber-100 text-amber-800"
              : "border-emerald-300 bg-emerald-100 text-emerald-800"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dirty ? "animate-pulse bg-amber-500" : "bg-emerald-500"
            )}
          />
          {dirty ? "待评估" : "已同步"}
        </div>
      </div>

      <CompanyInfoSection project={project} onUpdate={updatePref} />

      <div className="thin-scroll flex-1 overflow-y-auto px-4 py-4">
        {runningTasks.length > 0 ? (
          <section>
            <SectionHeader
              icon={<SFIcon icon={IconChallenge} size={12} />}
              title={`进行中任务 · ${runningTasks.length}`}
            />
            <div className="space-y-2">
              {runningTasks.map((task) => (
                <ChallengeTaskCard
                  key={task.id}
                  task={task}
                  projectName={project.name}
                  onOpen={() => onOpenTaskConversation?.(task.conversationId)}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
            <p className="text-[11.5px] text-gray-500">
              暂无进行中任务。发起挑战质询后将在此处实时显示进度。
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-[hsl(var(--border))] px-4 py-3">
        <Button
          type="button"
          variant={dirty ? "default" : "outline"}
          size="default"
          className="w-full"
          disabled={!dirty}
          onClick={() => setShowConfirm(true)}
        >
          <SFIcon icon={IconTarget} size={13} />
          分析评估
        </Button>
        {dirty && (
          <p className="mt-1.5 text-center text-[11px] text-gray-600">
            当前有内容更新，需重新分析评估后才能激活
          </p>
        )}
      </div>

      {showConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-[var(--shadow-notion-deep)]">
            <div className="mb-3 flex items-center gap-2">
              <SFIcon
                icon={IconTarget}
                size={15}
                className="text-[hsl(var(--foreground))]"
              />
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                开始分析评估？
              </h4>
            </div>
            <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
              确认后将清空当前会话的事实验证与挑战质询清单，按最新偏好（企业信息 / 投资阶段 /
              风险容忍度 / 自定义指令）与知识库重新触发全量工作流。该过程不可逆。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                取消
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setShowConfirm(false);
                  setDirty(false);
                  onRecalculate();
                }}
              >
                开始评估
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {icon}
      {title}
    </div>
  );
}
