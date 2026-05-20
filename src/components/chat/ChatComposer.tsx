import { useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowUp,
  IconAttach,
  IconAuto,
  IconChallenge,
  IconClose,
  IconFactCheck,
  IconMessage,
  IconStop,
} from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { FileKind, WorkMode } from "@/src/types";

interface ChatComposerProps {
  mode: WorkMode;
  onChangeMode: (mode: WorkMode) => void;
  webSearch: boolean;
  onToggleWebSearch: (v: boolean) => void;
  onSend: (text: string, attachments: Array<{ name: string; size: string; kind: FileKind }>) => void;
  generating: boolean;
  onStop: () => void;
  /** 偏好 / 知识库有未提交变更时，需先完成分析评估 */
  settingsPending?: boolean;
  /** 项目尚未准备好（草稿状态：偏好未配 / 知识库未上传）时，全面禁用 */
  awaitingSetup?: boolean;
}

const modeMeta: Record<
  WorkMode,
  { label: string; description: string; placeholder: string; icon: typeof IconAuto; color: string }
> = {
  auto: {
    label: "智能路由",
    description: "默认 · 由意图理解模型自动分配",
    placeholder: "用自然语言提问，例如「这家公司营收质量怎么样」",
    icon: IconAuto,
    color: "text-gray-900",
  },
  "fact-check": {
    label: "事实验证",
    description: "Agent 仅执行客观数据交叉比对",
    placeholder: "例如：核对议案与审计报告的营收口径是否一致",
    icon: IconFactCheck,
    color: "text-gray-900",
  },
  challenge: {
    label: "挑战质询",
    description: "Agent 执行全量逻辑推演并输出风险清单",
    placeholder: "例如：输出本项目核心投资逻辑的灵魂质询清单",
    icon: IconChallenge,
    color: "text-gray-900",
  },
};

const modes: WorkMode[] = ["auto", "fact-check", "challenge"];

function inferKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "other";
}

export function ChatComposer({
  mode,
  onChangeMode,
  webSearch,
  onToggleWebSearch,
  onSend,
  generating,
  onStop,
  settingsPending = false,
  awaitingSetup = false,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; kind: FileKind }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const meta = modeMeta[mode];
  // 二者任一为真则禁用输入；awaitingSetup 优先级更高（项目尚未就绪）
  const disabled = awaitingSetup || settingsPending;

  const send = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const list = Array.from(files).map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(0)} KB`,
      kind: inferKind(f.name),
    }));
    setAttachments((prev) => [...prev, ...list]);
    e.target.value = "";
  };

  return (
    <div className="px-4 pb-4">
      <div
        className={cn(
          "rounded-2xl border bg-[hsl(var(--card))] shadow-[var(--shadow-notion-card)] transition-opacity",
          disabled
            ? "border-gray-300 opacity-60"
            : "border-[hsl(var(--border))]"
        )}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-2.5 py-1.5">
          <div className="flex items-center gap-1 rounded-md bg-gray-50 p-0.5">
            {modes.map((m) => {
              const M = modeMeta[m];
              const active = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={awaitingSetup}
                  onClick={() => onChangeMode(m)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11.5px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
                    active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                  title={M.description}
                >
                  <SFIcon icon={M.icon} size={12} className={active ? M.color : undefined} />
                  {M.label}
                </button>
              );
            })}
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-3 py-2">
            {attachments.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
              >
                <SFIcon icon={IconAttach} size={11} className="text-gray-400" />
                <span className="font-medium text-gray-700">{a.name}</span>
                <span className="text-gray-400">{a.size}</span>
                <button
                  type="button"
                  className="ml-1 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                  aria-label="移除附件"
                >
                  <SFIcon icon={IconClose} size={11} />
                </button>
              </div>
            ))}
            <span className="ml-1 self-center text-[10px] text-gray-400">
              发送后将询问是否并入项目知识库
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-2.5">
          <button
            type="button"
            disabled={disabled}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:pointer-events-none disabled:opacity-40"
            onClick={() => fileInputRef.current?.click()}
            aria-label="上传文件"
            title="临时附件（沙盒）"
          >
            <SFIcon icon={IconAttach} size={15} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
            className="hidden"
            onChange={handleAttach}
          />

          <textarea
            ref={taRef}
            value={text}
            disabled={disabled}
            onChange={(e) => {
              setText(e.target.value);
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 220) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={awaitingSetup ? "请先在右侧完善偏好并上传核心材料后再发起提问" : meta.placeholder}
            rows={1}
            className="thin-scroll min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-[#CCCCCC] focus:outline-none disabled:cursor-not-allowed"
          />

          {generating ? (
            <Button variant="outline" size="icon" onClick={onStop} aria-label="停止生成" title="停止生成">
              <SFIcon icon={IconStop} size={13} />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              disabled={disabled || (!text.trim() && attachments.length === 0)}
              onClick={send}
              aria-label="发送"
            >
              <SFIcon icon={IconArrowUp} size={14} />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[hsl(var(--border))] px-3 py-1.5">
          {awaitingSetup ? (
            <p className="text-[10px] text-gray-600">完成偏好设置并上传核心材料后，即可发起事实验证 / 挑战质询</p>
          ) : settingsPending ? (
            <p className="text-[10px] text-gray-600">当前有内容更新，需在右侧完成「分析评估」后才能继续提问</p>
          ) : (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]">
              <SFIcon icon={IconMessage} size={10} />
              Enter 发送 · Shift+Enter 换行
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
