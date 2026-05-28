import { ChallengeTaskCard } from "@/src/components/chat/ChallengeTaskCard";
import { CompanyInfoSection } from "@/src/components/layout/CompanyInfoSection";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconChallenge } from "@/src/lib/icons";
import type { Project, RunningTask } from "@/src/types";

interface SettingsPanelProps {
  project: Project;
  runningTasks: RunningTask[];
  onUpdate: (next: Partial<Project>) => void;
  /** 点击任务卡片：跳转到任务对应的对话 */
  onOpenTaskConversation?: (conversationId: string) => void;
}

export function SettingsPanel({
  project,
  runningTasks,
  onUpdate,
  onOpenTaskConversation,
}: SettingsPanelProps) {
  return (
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center border-b border-[hsl(var(--border))] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">
            项目设置
          </p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            企业信息 / 偏好 · 即时生效
          </p>
        </div>
      </div>

      <CompanyInfoSection project={project} onUpdate={onUpdate} />

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
              暂无进行中任务。发起挑战质询或事实交叉验证后将在此处实时显示进度。
            </p>
          </div>
        )}
      </div>
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
