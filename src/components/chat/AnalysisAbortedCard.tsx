import { useRef, useState } from "react";

import { PriorityBadge } from "@/src/components/chat/PriorityBadge";
import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconAbort,
  IconAttach,
  IconCheckCircle,
  IconRefresh,
  IconUpload,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { AssistantBlock } from "@/src/types";

type AnalysisAbortedBlock = Extract<AssistantBlock, { kind: "analysis-aborted" }>;

interface AnalysisAbortedCardProps {
  block: AnalysisAbortedBlock;
  /** 用户通过卡片快速补传文件时回调；上传逻辑由父组件接管 */
  onQuickUpload: (files: FileList) => void;
}

/**
 * 终止 / 重启 状态机：
 *  - idle     初始态，列出缺失项 + 提示用户补传
 *  - uploading 用户已选择文件，模拟解析中；卡片整体进入「正在重启分析」态
 *  - resolved  补传完成，卡片折叠为成功提示
 */
type Phase = "idle" | "uploading" | "resolved";

/** 上传 → 解析 → 重启分析 的本地动画总时长（毫秒） */
const SIMULATED_RESTART_MS = 2400;

export function AnalysisAbortedCard({
  block,
  onQuickUpload,
}: AnalysisAbortedCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [drag, setDrag] = useState(false);
  /** 用户本次实际上传的文件名，用于在 resolved 态回显 */
  const [acceptedNames, setAcceptedNames] = useState<string[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setAcceptedNames(Array.from(files).map((f) => f.name));
    setPhase("uploading");
    // 真正写入项目知识库 + 追加对话消息由父组件处理
    onQuickUpload(files);
    window.setTimeout(() => setPhase("resolved"), SIMULATED_RESTART_MS);
  };

  // —— 已重启分析的成功态：卡片折叠为单行成功提示，避免遮挡新生成的报告 ——
  if (phase === "resolved") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <SFIcon
            icon={IconCheckCircle}
            size={14}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-emerald-800">
              资料已补齐 · Agent 已重启分析
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-emerald-700/85">
              新追加 {acceptedNames.length} 份资料：
              <span className="font-medium">
                {acceptedNames.slice(0, 2).join("、")}
                {acceptedNames.length > 2
                  ? ` 等 ${acceptedNames.length} 份`
                  : ""}
              </span>
              ，事实交叉验证 / 估值平行测算等能力已恢复可用。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
      {/* —— 顶部：醒目终止 banner —— */}
      <div className="flex items-start gap-3 border-b border-rose-100 bg-gradient-to-br from-rose-50 to-amber-50/60 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600/95 text-white shadow-sm">
          <SFIcon icon={IconAbort} size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              ANALYSIS · ABORTED
            </span>
            {block.parsedSummary && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10.5px] font-medium text-rose-700">
                已解析 {block.parsedSummary.parsed} / {block.parsedSummary.total}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-[14.5px] font-semibold leading-snug text-gray-900">
            {block.title}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-gray-600">
            {block.reason}
          </p>
        </div>
      </div>

      {/* —— 缺失关键信息点列表 —— */}
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-400">
          <SFIcon icon={IconAbort} size={10} className="text-rose-500" />
          缺失关键信息 · {block.missingItems.length} 项
        </div>
        <ul className="space-y-1.5">
          {block.missingItems.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2"
            >
              <PriorityBadge level={item.severity} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-gray-900">
                  {item.label}
                  <span className="ml-1.5 text-[10.5px] font-normal text-gray-400">
                    · {item.requirement}
                  </span>
                </p>
                {item.hint && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                    {item.hint}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* —— 处置建议（可选） —— */}
        {block.nextSteps && block.nextSteps.length > 0 && (
          <div className="mt-3 rounded-xl bg-amber-50/70 px-3 py-2.5">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              处置建议
            </p>
            <ul className="space-y-0.5 text-[11.5px] leading-relaxed text-amber-900/85">
              {block.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="shrink-0 text-amber-600">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* —— 底部：快速上传 dropzone —— */}
      <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
        <div
          onDragOver={(e) => {
            if (phase !== "idle") return;
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            if (phase !== "idle") return;
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all",
            phase === "uploading"
              ? "border-amber-300 bg-amber-50/70"
              : drag
                ? "border-gray-900 bg-white"
                : "border-gray-200 bg-white hover:border-gray-300"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm",
                phase === "uploading"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-900 text-white"
              )}
            >
              <SFIcon
                icon={phase === "uploading" ? IconRefresh : IconUpload}
                size={14}
                className={phase === "uploading" ? "animate-spin" : ""}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">
                {phase === "uploading"
                  ? "正在补传并重启解析…"
                  : "快速补传缺失资料"}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                {phase === "uploading"
                  ? `已接收 ${acceptedNames.length} 份文件，Agent 将在 2–3 秒后恢复分析。`
                  : "支持拖拽到此处或点击右侧浏览（PDF / Word / PPT / Excel）"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={phase !== "idle"}
              onClick={() => fileInputRef.current?.click()}
            >
              <SFIcon icon={IconAttach} size={11} />
              上传文件
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
