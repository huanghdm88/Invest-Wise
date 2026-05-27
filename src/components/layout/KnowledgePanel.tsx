import { useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconCheckCircle,
  IconDelete,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconPlus,
  IconRefresh,
  IconUpload,
} from "@/src/lib/icons";
import { cn, uid } from "@/src/lib/utils";
import type { FileKind, FileStatus, KnowledgeFile } from "@/src/types";

interface KnowledgePanelProps {
  files: KnowledgeFile[];
  onUpdateFiles: (files: KnowledgeFile[]) => void;
  /** 紧凑模式：用于右侧栏，移除一些 dropzone 说明 */
  compact?: boolean;
  /** 文件变动通知（如 SettingsPanel 用来打 dirty 标） */
  onDirty?: () => void;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function inferKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "other";
}

function kindIcon(kind: FileKind) {
  if (kind === "excel") return IconFileSpreadsheet;
  if (kind === "pdf" || kind === "word") return IconFileText;
  return IconFile;
}

/** 抽取自原 SettingsPanel 的「项目知识库」模块，供右侧栏与项目主页复用 */
export function KnowledgePanel({
  files,
  onUpdateFiles,
  compact = false,
  onDirty,
  className,
}: KnowledgePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const markDirty = () => onDirty?.();

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const list: KnowledgeFile[] = Array.from(incoming).map((f) => ({
      id: uid("file"),
      name: f.name,
      size: formatSize(f.size),
      kind: inferKind(f.name),
      status: "uploading" as FileStatus,
      uploadedAt: new Date().toISOString(),
    }));
    const merged = [...list, ...files];
    onUpdateFiles(merged);
    markDirty();
    const newIds = new Set(list.map((f) => f.id));
    setTimeout(() => {
      onUpdateFiles(
        merged.map((f) =>
          newIds.has(f.id) ? { ...f, status: "parsing" as FileStatus } : f
        )
      );
    }, 600);
    setTimeout(() => {
      onUpdateFiles(
        merged.map((f) =>
          newIds.has(f.id) ? { ...f, status: "indexed" as FileStatus } : f
        )
      );
    }, 2800);
  };

  const removeFile = (id: string) => {
    onUpdateFiles(files.filter((f) => f.id !== id));
    markDirty();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed text-center transition-all",
          compact ? "px-4 py-5" : "px-6 py-8",
          drag
            ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
            : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 hover:border-[hsl(var(--ring))]"
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm">
          <SFIcon icon={IconUpload} size={15} />
        </div>
        <p className="text-xs font-semibold text-gray-900">拖入材料或点击上传</p>
        {!compact && (
          <p className="text-[11px] text-gray-500">
            PDF / Word / PPT / Excel · ≤ 50 MB / 份 · 仅本项目可用
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <SFIcon icon={IconPlus} size={11} />
          浏览文件
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-700">
            已纳入资料 · {files.length}
          </p>
          <p className="text-[10px] text-gray-400">仅本项目可用</p>
        </div>
        {files.length === 0 ? (
          <div className="px-4 py-6 text-center text-[11px] text-gray-400">
            暂无资料，建议上传：投决议案 / 审计报告 / 尽调备忘 / BP / 行业研报
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {files.map((f) => {
              const Icon = kindIcon(f.kind);
              return (
                <li key={f.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                    <SFIcon icon={Icon} size={13} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {f.size} · {f.kind.toUpperCase()}
                      {f.category ? ` · ${f.category}` : ""}
                    </p>
                  </div>
                  <FileStatusBadge status={f.status} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="删除资料"
                    onClick={() => removeFile(f.id)}
                  >
                    <SFIcon icon={IconDelete} size={12} className="text-gray-400" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function FileStatusBadge({ status }: { status: KnowledgeFile["status"] }) {
  if (status === "indexed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <SFIcon icon={IconCheckCircle} size={10} />
        已索引
      </span>
    );
  }
  if (status === "parsing" || status === "uploading") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
        <SFIcon icon={IconRefresh} size={10} className="animate-spin" />
        {status === "parsing" ? "解析中" : "上传中"}
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
        失败
      </span>
    );
  }
  return null;
}

/** 给外部使用的"知识库当前活跃状态"工具（项目主页 Tab 标题、SettingsPanel 同步用） */
export function getKnowledgeActivity(
  files: KnowledgeFile[],
  projectStatus: import("@/src/types").ProjectStatus
):
  | { label: string; count: number; spinning: boolean; tone: "amber" | "rose" }
  | null {
  const uploading = files.filter((f) => f.status === "uploading");
  const parsing = files.filter((f) => f.status === "parsing");
  const failed = files.filter((f) => f.status === "failed");
  if (uploading.length > 0) {
    return { label: "上传中", count: uploading.length, spinning: true, tone: "amber" };
  }
  if (parsing.length > 0 || projectStatus === "parsing") {
    return {
      label: "解析中",
      count: parsing.length > 0 ? parsing.length : files.length,
      spinning: true,
      tone: "amber",
    };
  }
  if (failed.length > 0) {
    return { label: "部分失败", count: failed.length, spinning: false, tone: "rose" };
  }
  return null;
}
