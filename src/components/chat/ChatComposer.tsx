import { useRef, useState } from "react";

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

        <div className="flex items-end gap-2 px-3 py-2.5">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
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
            placeholder="向 Agent 提问，例如「这家公司营收质量怎么样」或「核对议案与审计的营收口径」"
            rows={1}
            className="thin-scroll min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-[#CCCCCC] focus:outline-none"
          />

          {generating ? (
            <Button variant="outline" size="icon" onClick={onStop} aria-label="停止生成" title="停止生成">
              <SFIcon icon={IconStop} size={13} />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              disabled={!text.trim() && attachments.length === 0}
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
