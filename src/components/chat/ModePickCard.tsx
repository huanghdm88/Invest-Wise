import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowRight,
  IconAuto,
  IconChallenge,
  IconCheckCircle,
  IconFactCheck,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { ModePickOption, WorkMode } from "@/src/types";

interface ModePickCardProps {
  title: string;
  reason: string;
  options: ModePickOption[];
  /** 用户选择了某个模式 → 以该模式重新发起任务 */
  onPick: (mode: Extract<WorkMode, "fact-check" | "challenge">) => void;
}

const modeIconMap: Record<Extract<WorkMode, "fact-check" | "challenge">, typeof IconAuto> = {
  "fact-check": IconFactCheck,
  challenge: IconChallenge,
};

export function ModePickCard({ title, reason, options, onPick }: ModePickCardProps) {
  const [picked, setPicked] = useState<ModePickOption["mode"] | null>(null);

  if (picked) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <SFIcon icon={IconCheckCircle} size={14} />
        </span>
        <p className="text-[13px] font-medium text-emerald-800">
          已选择「{options.find((o) => o.mode === picked)?.label}」，正在重新分发任务…
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 pt-4 pb-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          <SFIcon icon={IconAuto} size={11} />
          智能路由 · 待确认
        </div>
        <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-gray-900">{title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500">{reason}</p>
      </div>

      <div className="space-y-2 border-t border-gray-100 px-5 py-4">
        {options.map((opt) => {
          const Icon = modeIconMap[opt.mode];
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => {
                setPicked(opt.mode);
                onPick(opt.mode);
              }}
              className={cn(
                "group flex w-full items-start gap-3 rounded-xl border bg-white px-3.5 py-3 text-left transition-all",
                "hover:-translate-y-px hover:border-gray-900 hover:shadow-md",
                opt.recommended ? "border-gray-900" : "border-gray-200"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  opt.recommended
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white"
                )}
              >
                <SFIcon icon={Icon} size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-gray-900">{opt.label}</span>
                  {opt.recommended && (
                    <span className="rounded-full bg-gray-900 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      推荐
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-gray-500">{opt.desc}</p>
              </div>
              <SFIcon
                icon={IconArrowRight}
                size={12}
                className="mt-2.5 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-900"
              />
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 bg-[#fafafa] px-5 py-2.5">
        <p className="text-[11px] text-gray-400">
          选择后 Agent 将以对应模式继续执行任务，不会丢失你当前的问题
        </p>
      </div>
    </div>
  );
}
