import { useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import {
  IconCheckCircle,
  IconDatabase,
  IconDelete,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconPlus,
  IconRefresh,
  IconUpload,
} from "@/src/lib/icons";
import { cn, uid } from "@/src/lib/utils";
import type { FileKind, KnowledgeFile, Project } from "@/src/types";

interface KnowledgeBaseProps {
  project: Project;
  onUpdateFiles: (files: KnowledgeFile[]) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const RECOMMENDED = [
  { name: "投资议案 / IM", description: "项目核心叙事文件，奠定投决基线" },
  { name: "审计报告（近 3 年）", description: "财务真实性核验入口" },
  { name: "尽调备忘录（业务/财务/法律）", description: "建立证据链与风险标签" },
  { name: "商业计划书 / 路演 PPT", description: "提取业务模型与战略画布" },
  { name: "管理层访谈纪要", description: "团队基因 + 真实落地能力" },
  { name: "行业研报", description: "TAM / SAM / SOM 的外部锚点" },
];

function kindIcon(kind: FileKind) {
  if (kind === "excel") return IconFileSpreadsheet;
  if (kind === "pdf" || kind === "word") return IconFileText;
  return IconFile;
}

function inferKind(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  return "other";
}

export function KnowledgeBase({ project, onUpdateFiles }: KnowledgeBaseProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const list: KnowledgeFile[] = Array.from(files).map((f) => ({
      id: uid("file"),
      name: f.name,
      size: formatSize(f.size),
      kind: inferKind(f.name),
      status: "uploading",
      uploadedAt: new Date().toISOString(),
    }));
    const merged = [...list, ...project.files];
    onUpdateFiles(merged);
    setTimeout(() => {
      onUpdateFiles(merged.map((f) => (list.find((l) => l.id === f.id) ? { ...f, status: "indexed" } : f)));
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
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
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
          drag
            ? "border-slate-900 bg-slate-50"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
          <SFIcon icon={IconUpload} size={18} />
        </div>
        <p className="text-sm font-semibold text-slate-900">把项目相关材料拖到这里</p>
        <p className="text-xs text-slate-500">支持 PDF / Word / PPT / Excel · 单文件 ≤ 50 MB</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
          <SFIcon icon={IconPlus} size={12} />
          浏览文件
        </Button>
        <input
          ref={inputRef}
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

      {project.files.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <SFIcon icon={IconDatabase} size={12} />
            推荐资料类型
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {RECOMMENDED.map((r) => (
              <li
                key={r.name}
                className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-slate-900">{r.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{r.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="text-xs font-semibold text-slate-700">已纳入资料库 · {project.files.length}</p>
            <p className="text-[10px] text-slate-400">仅本项目可用，与全局知识库隔离</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {project.files.map((f) => {
              const Icon = kindIcon(f.kind);
              return (
                <li key={f.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                    <SFIcon icon={Icon} size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{f.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {f.size} · {f.kind.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {f.status === "indexed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                        <SFIcon icon={IconCheckCircle} size={11} />
                        已索引
                      </span>
                    )}
                    {f.status === "parsing" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                        <SFIcon icon={IconRefresh} size={11} className="animate-spin" />
                        解析中
                      </span>
                    )}
                    {f.status === "uploading" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                        <SFIcon icon={IconRefresh} size={11} className="animate-spin" />
                        上传中
                      </span>
                    )}
                    {f.status === "failed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700">
                        失败 · 重试
                      </span>
                    )}
                    <Button variant="ghost" size="icon-sm" aria-label="删除资料">
                      <SFIcon icon={IconDelete} size={12} className="text-slate-400" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
