import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconArrowUp,
  IconAttach,
  IconClose,
  IconStop,
} from "@/src/lib/icons";
import type { FileKind } from "@/src/types";

interface ChatComposerProps {
  onSend: (text: string, attachments: Array<{ name: string; size: string; kind: FileKind }>) => void;
  generating: boolean;
  onStop: () => void;
}

/** 输入框可识别的快捷指令。完整命中时在输入框内以蓝色高亮显示。 */
const COMMANDS = ["@交叉验证", "@投资报告"] as const;

/** split 用（带捕获组，保留分隔符） */
const COMMAND_SPLIT_REGEX = /(@交叉验证|@投资报告)/g;

/** test 用（非全局，避免 lastIndex 状态问题） */
const COMMAND_TEST_REGEX = /@交叉验证|@投资报告/;

/** 激活指令后，提示用户上传材料的占位文案 */
const COMMAND_HINT = "请上传投决议案或投资备忘录";

/**
 * 把输入文本拆分为「普通文本 / 指令」分段，供高亮叠层渲染。
 * 末尾换行追加零宽字符，保证叠层高度与 textarea 一致。
 */
function renderHighlighted(text: string) {
  const source = text.endsWith("\n") ? text + "\u200b" : text;
  const parts = source.split(COMMAND_SPLIT_REGEX);
  return parts.map((part, i) =>
    (COMMANDS as readonly string[]).includes(part) ? (
      <span key={i} className="rounded font-medium text-blue-600">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function inferKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "other";
}

export function ChatComposer({
  onSend,
  generating,
  onStop,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; kind: FileKind }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  /** 自适应高度 + 同步高亮叠层滚动 */
  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  };

  const syncScroll = () => {
    const ta = taRef.current;
    const bd = backdropRef.current;
    if (ta && bd) {
      bd.scrollTop = ta.scrollTop;
      bd.scrollLeft = ta.scrollLeft;
    }
  };

  // 文本变化后同步叠层滚动位置
  useLayoutEffect(syncScroll, [text]);

  // —— 指令状态 ——
  const hasCommand = COMMAND_TEST_REGEX.test(text);
  // 指令之外没有其它正文时，在指令后展示上传提示占位
  const restEmpty = text.replace(COMMAND_SPLIT_REGEX, "").trim() === "";
  const showCommandHint = hasCommand && restEmpty;
  // 激活指令后，必须先上传附件才能发送
  const requiresAttachment = hasCommand;
  const canSend = requiresAttachment
    ? attachments.length > 0
    : text.trim().length > 0 || attachments.length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  /**
   * 点击快捷按钮：输入框始终只保留一个指令。
   * 先剥离已有指令、保留其余正文，再把新指令放到最前。
   * 因此再次点击（同一或另一个）会替换现有指令，而非叠加。
   */
  const insertCommand = (cmd: string) => {
    const rest = text.replace(COMMAND_SPLIT_REGEX, "").trim();
    const prefix = `${cmd} `;
    const next = rest ? `${prefix}${rest}` : prefix;
    setText(next);
    const caret = prefix.length;
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caret, caret);
      resize(ta);
      syncScroll();
    });
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
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-notion-card)]">
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
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5">
          <button
            type="button"
            onClick={() => insertCommand("@交叉验证")}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            交叉验证
          </button>
          <button
            type="button"
            onClick={() => insertCommand("@投资报告")}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            投资报告
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            onClick={() => fileInputRef.current?.click()}
            aria-label="上传文件"
            title="临时附件（沙盒）"
          >
            <SFIcon icon={IconAttach} size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
            className="hidden"
            onChange={handleAttach}
          />

          <div className="relative flex-1 self-center">
            {/* 高亮叠层：镜像文本，指令以蓝色显示；与 textarea 完全对齐 */}
            <div
              ref={backdropRef}
              aria-hidden
              className="thin-scroll pointer-events-none absolute inset-0 max-h-[220px] overflow-auto whitespace-pre-wrap break-words px-1 py-1.5 text-sm leading-6 text-gray-900"
            >
              {renderHighlighted(text)}
              {showCommandHint && (
                <span className="text-[#CCCCCC]">
                  {(text.endsWith(" ") ? "" : " ") + COMMAND_HINT}
                </span>
              )}
            </div>
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                resize(e.currentTarget);
              }}
              onScroll={syncScroll}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="向 Agent 提问…"
              rows={1}
              className="thin-scroll relative h-9 max-h-[220px] min-h-[36px] w-full resize-none bg-transparent px-1 py-1.5 text-sm leading-6 text-transparent caret-gray-900 placeholder:text-[#CCCCCC] focus:outline-none"
            />
          </div>

          {generating ? (
            <Button variant="outline" size="icon" onClick={onStop} aria-label="停止生成" title="停止生成">
              <SFIcon icon={IconStop} size={13} />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              disabled={!canSend}
              onClick={send}
              aria-label="发送"
            >
              <SFIcon icon={IconArrowUp} size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
