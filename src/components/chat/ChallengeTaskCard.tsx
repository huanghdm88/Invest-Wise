import { useEffect, useState } from "react";

import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconCalculator,
  IconChallenge,
  IconClose,
  IconFactCheck,
  IconRefresh,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { RunningTask, RunningTaskKind } from "@/src/types";

/** 模块加载时刻：之前已存在的任务（startedAt < 此值）不再播放进场动画 */
const MODULE_LOADED_AT = Date.now();

interface ChallengeTaskCardProps {
  task: RunningTask;
  /** 任务所在项目的名称（卡片标题展示） */
  projectName?: string;
  /** 点击卡片可跳转到对应对话查看上下文 */
  onOpen?: () => void;
  /** 用户在二次确认后取消该任务（移除任务 + 在对话中提示「任务已取消」） */
  onCancel?: (task: RunningTask) => void;
  className?: string;
}

const KIND_META: Record<
  RunningTaskKind,
  { label: string; tone: string; icon: typeof IconChallenge }
> = {
  challenge: {
    label: "挑战质询任务",
    tone: "border-orange-200 bg-orange-50/60",
    icon: IconChallenge,
  },
  "fact-check": {
    label: "事实交叉验证任务",
    tone: "border-sky-200 bg-sky-50/60",
    icon: IconFactCheck,
  },
  valuation: {
    label: "估值平行测算任务",
    tone: "border-violet-200 bg-violet-50/60",
    icon: IconCalculator,
  },
};

/** 每种任务的分阶段描述，根据当前 progress 切换 */
const TASK_PHASES: Record<RunningTaskKind, Array<{ min: number; text: string }>> = {
  challenge: [
    { min: 0, text: "正在从知识库召回相关材料…" },
    { min: 25, text: "正在比对议案、BP 与 FDD 的关键假设…" },
    { min: 55, text: "正在生成核心矛盾与风险维度…" },
    { min: 80, text: "正在按当前风险口径整理质询清单与条款建议…" },
  ],
  "fact-check": [
    { min: 0, text: "正在召回议案 / BP / FDD / 审计报告…" },
    { min: 25, text: "正在抽取关键数据字段（营收 / 现金流 / 客户）…" },
    { min: 55, text: "正在做多源交叉比对，定位偏差点…" },
    { min: 80, text: "正在生成差异清单与处置建议…" },
  ],
  valuation: [
    { min: 0, text: "正在加载 NTM 营收与对标公司清单…" },
    { min: 25, text: "正在执行 VC 倒算法…" },
    { min: 55, text: "正在跑 PS 对比与 PTA 三种方法…" },
    { min: 80, text: "正在合并结论区间…" },
  ],
};

function getPhaseText(kind: RunningTaskKind, progress: number): string {
  const phases = TASK_PHASES[kind];
  let current = phases[0].text;
  for (const p of phases) {
    if (progress >= p.min) current = p.text;
  }
  return current;
}

function formatElapsed(startedAt: string, nowMs: number) {
  const startMs = new Date(startedAt).getTime();
  const sec = Math.max(0, Math.round((nowMs - startMs) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rest = sec - min * 60;
  return `${min}m ${rest}s`;
}

export function ChallengeTaskCard({
  task,
  projectName,
  onOpen,
  onCancel,
  className,
}: ChallengeTaskCardProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [shouldAnimate] = useState(
    () => new Date(task.startedAt).getTime() >= MODULE_LOADED_AT - 1500
  );
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const meta = KIND_META[task.kind];
  const Icon = meta.icon;
  const elapsed = formatElapsed(task.startedAt, now);
  const pct = Math.min(100, Math.max(0, Math.round(task.progress)));
  const phase = getPhaseText(task.kind, pct);
  const heading = projectName ? `${projectName} · ${meta.label}` : meta.label;

  return (
    <div
      className={cn(
        "group relative w-full rounded-2xl border px-3 py-2.5 text-left transition-shadow hover:shadow-sm",
        meta.tone,
        shouldAnimate && "animate-task-card-reveal",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label="查看任务对话"
      >
        <div className="flex items-center justify-between gap-2">
          {/* 标题区：右侧预留 6 / hover 时让出 14 空间给 ✕ 按钮，避免与百分比/取消按钮重叠 */}
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1 truncate text-[12.5px] font-semibold text-gray-900",
              onCancel ? "pr-1 group-hover:pr-6" : "pr-1"
            )}
          >
            <SFIcon icon={Icon} size={12} className="shrink-0 text-gray-700" />
            <span className="truncate">{heading}</span>
          </span>
          {/* 百分比常态展示在右上角；hover 时被 ✕ 按钮覆盖（淡出避免重叠） */}
          <span
            className={cn(
              "shrink-0 text-[10.5px] font-medium tabular-nums text-amber-700 transition-opacity",
              onCancel && "group-hover:opacity-0"
            )}
          >
            {pct}%
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-[11.5px] leading-relaxed text-gray-600">
          <SFIcon
            icon={IconRefresh}
            size={10}
            className="shrink-0 animate-spin text-amber-500"
          />
          <span className="line-clamp-1">{phase}</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full bg-amber-500 transition-[width] duration-1000 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-gray-500">
          <span>已运行 {elapsed}</span>
          <span>完成后将自动出现在对话流</span>
        </div>
      </button>

      {onCancel && !confirmingCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmingCancel(true);
          }}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 opacity-0 transition-all hover:bg-white hover:text-rose-600 group-hover:opacity-100"
          aria-label="取消任务"
          title="取消任务"
        >
          <SFIcon icon={IconClose} size={12} />
        </button>
      )}

      {confirmingCancel && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-[11px] text-rose-800">
          <span className="line-clamp-1">确认取消该任务？</span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingCancel(false);
              }}
              className="rounded-md border border-rose-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              保留
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.(task);
              }}
              className="rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-rose-700"
            >
              确认取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
