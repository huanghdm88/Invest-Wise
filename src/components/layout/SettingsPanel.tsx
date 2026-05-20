import { useEffect, useRef, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Switch } from "@/src/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Textarea } from "@/src/components/ui/textarea";
import {
  IconAuto,
  IconBuilding,
  IconCheckCircle,
  IconCompass,
  IconDatabase,
  IconDelete,
  IconFile,
  IconFileSpreadsheet,
  IconFileText,
  IconLightbulb,
  IconPlus,
  IconRefresh,
  IconShieldAlert,
  IconTarget,
  IconUpload,
  IconWand,
} from "@/src/lib/icons";
import { industryOptions } from "@/src/data/industries";
import { cn, uid } from "@/src/lib/utils";
import type {
  FileKind,
  InvestmentStage,
  KnowledgeFile,
  Project,
  RiskTolerance,
} from "@/src/types";

export type SettingsTab = "preferences" | "knowledge";

interface SettingsPanelProps {
  project: Project;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  onUpdate: (next: Partial<Project>) => void;
  onUpdateFiles: (files: KnowledgeFile[]) => void;
  onRecalculate: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const stageOptions: Array<{ value: InvestmentStage; label: string; sub: string }> = [
  { value: "early-growth", label: "早期 / 成长期", sub: "PS 优先 · 关注 TAM 与天花板" },
  { value: "late-pre-ipo", label: "中后期 / Pre-IPO", sub: "PE 优先 · 关注盈利质量" },
];

const riskOptions: Array<{
  value: RiskTolerance;
  label: string;
  shortLabel: string;
  desc: string;
  icon: typeof IconShieldAlert;
}> = [
  {
    value: "R1",
    label: "国资防守型",
    shortLabel: "R1",
    desc: "极度敏感。任何 P2 级现金流 / 关联交易 / 财务偏差 > 5%，强制升格为 P1 甚至 P0；条款建议附加连带责任的现金回购对赌。",
    icon: IconShieldAlert,
  },
  {
    value: "R2",
    label: "稳健均衡型",
    shortLabel: "R2",
    desc: "执行基准 P0–P4 分级过滤，不做主观升降级；IRR 锚定 15%–20%；倾向于业绩补偿条款或分期对赌打款。",
    icon: IconTarget,
  },
  {
    value: "R3",
    label: "激进创投型",
    shortLabel: "R3",
    desc: "增长与颠覆性优先。压制审计噪音（应收周转慢、短期现金流为负等 P1 主动降级到 P2）；70% 算力集中在 TAM / 技术代差 / 团队基因；IRR 锚定 20%–25%。",
    icon: IconAuto,
  },
];

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

export function SettingsPanel({
  project,
  activeTab,
  onTabChange,
  onUpdate,
  onUpdateFiles,
  onRecalculate,
  onDirtyChange,
}: SettingsPanelProps) {
  // 任意偏好 / 知识库变更 → dirty = true，「分析评估」按钮被激活
  const [dirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    setDirty(false);
    setShowConfirm(false);
  }, [project.id]);

  const updatePref = (patch: Partial<Project>) => {
    onUpdate(patch);
    setDirty(true);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
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
    setDirty(true);
    setTimeout(() => {
      onUpdateFiles(
        merged.map((f) => (list.find((l) => l.id === f.id) ? { ...f, status: "indexed" } : f))
      );
    }, 1500);
  };

  const removeFile = (id: string) => {
    onUpdateFiles(project.files.filter((f) => f.id !== id));
    setDirty(true);
  };

  const currentRisk = riskOptions.find((r) => r.value === project.riskTolerance);
  const currentStage = stageOptions.find((s) => s.value === project.stage);

  return (
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">项目设置</p>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            {dirty ? "偏好或知识库已更新，待重新分析评估" : "偏好与知识库 · 即时编辑"}
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

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as SettingsTab)}
        className="flex flex-1 min-h-0 flex-col"
      >
        <div className="px-4 pt-2.5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferences">
              <SFIcon icon={IconWand} size={11} />
              偏好
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <SFIcon icon={IconDatabase} size={11} />
              知识库
              <span className="ml-1 rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-600">
                {project.files.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* —— 偏好 Tab —— */}
        <TabsContent
          value="preferences"
          className="thin-scroll mt-2.5 flex-1 overflow-y-auto px-4 pb-4"
        >
          <p className="mb-4 text-[11px] text-gray-500">
            修改后将在底部「分析评估」按钮上提示，需重新分析评估方可生效。
          </p>

          <div className="space-y-6">
            <section>
              <SectionHeader icon={<SFIcon icon={IconBuilding} size={12} />} title="企业信息" />
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">企业名称</label>
                  <Input
                    value={project.name}
                    onChange={(e) => updatePref({ name: e.target.value })}
                    placeholder="请输入企业名称"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">所属行业</label>
                  <select
                    value={project.industry}
                    onChange={(e) => updatePref({ industry: e.target.value })}
                    className={cn(
                      "flex h-9 w-full appearance-none rounded-lg border border-[hsl(var(--input))] bg-white bg-[length:16px_16px] bg-[position:right_10px_center] bg-no-repeat px-3 py-2 pr-8 text-sm shadow-sm transition-colors",
                      "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 16 16%27 fill=%27none%27%3E%3Cpath d=%27M4 6l4 4 4-4%27 stroke=%27%236b7280%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E')]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30",
                      project.industry ? "text-gray-900" : "text-[#CCCCCC]"
                    )}
                  >
                    <option value="" disabled>
                      请选择行业 / 赛道
                    </option>
                    {industryOptions.map((opt) => (
                      <option key={opt} value={opt} className="text-gray-900">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <SectionHeader icon={<SFIcon icon={IconCompass} size={12} />} title="投资阶段" />
              <p className="mb-2.5 text-[11px] text-gray-500">
                前期防止 Agent 对投资阶段的识别错误，建议手动选择项目所处阶段。
              </p>
              <div className="grid grid-cols-1 gap-2">
                {stageOptions.map((opt) => {
                  const active = project.stage === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref({ stage: opt.value })}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--ring))]"
                      )}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px]",
                          active ? "text-gray-300" : "text-gray-500"
                        )}
                      >
                        {opt.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
              {currentStage && (
                <p className="mt-2 text-[10px] text-gray-400">当前：{currentStage.label}</p>
              )}
            </section>

            <section>
              <SectionHeader
                icon={<SFIcon icon={IconShieldAlert} size={12} />}
                title="风险容忍度"
              />
              <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
                {riskOptions.map((opt) => {
                  const active = project.riskTolerance === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref({ riskTolerance: opt.value })}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-semibold transition-all",
                        active
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      <SFIcon icon={opt.icon} size={13} />
                      {opt.shortLabel}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <p className="text-xs font-medium text-gray-900">{currentRisk?.label}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                  {currentRisk?.desc}
                </p>
              </div>
            </section>

            <section>
              <SectionHeader icon={<SFIcon icon={IconWand} size={12} />} title="自定义分析指令" />
              <p className="mb-2 text-[11px] text-gray-500">
                将作为{" "}
                <span className="rounded bg-gray-900 px-1 py-0.5 font-medium text-white">
                  最高优先级
                </span>{" "}
                注入 System Prompt，影响每一步分析。
              </p>
              <Textarea
                value={project.customInstruction}
                onChange={(e) => updatePref({ customInstruction: e.target.value })}
                placeholder="例：本次重点审查其 AI 算力成本是否能打平、销售费用率是否健康..."
                className="min-h-[110px] text-xs leading-relaxed"
              />
            </section>

            <section>
              <SectionHeader icon={<SFIcon icon={IconLightbulb} size={12} />} title="工具开关" />
              <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">联网搜索</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {project.webSearch
                        ? "已开启 · 仅在模型判断必要时调用"
                        : "已关闭 · 仅基于知识库内容作答"}
                    </p>
                  </div>
                  <Switch
                    checked={project.webSearch}
                    onCheckedChange={(v) => updatePref({ webSearch: v })}
                  />
                </div>
              </div>
            </section>
          </div>
        </TabsContent>

        {/* —— 知识库 Tab —— */}
        <TabsContent
          value="knowledge"
          className="thin-scroll mt-2.5 flex-1 overflow-y-auto px-4 pb-4"
        >
          <p className="mb-3 text-[11px] text-[hsl(var(--muted-foreground))]">
            上传 / 删除资料后将影响后续上下文召回，需在底部点击「分析评估」。
          </p>

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
              "flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all",
              drag
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--muted))]"
                : "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 hover:border-[hsl(var(--ring))]"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm">
              <SFIcon icon={IconUpload} size={15} />
            </div>
            <p className="text-xs font-semibold text-gray-900">拖入材料或点击上传</p>
            <p className="text-[11px] text-gray-500">PDF / Word / PPT / Excel · ≤ 50 MB</p>
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

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <p className="text-[11px] font-semibold text-gray-700">
                已纳入资料 · {project.files.length}
              </p>
              <p className="text-[10px] text-gray-400">仅本项目可用</p>
            </div>
            {project.files.length === 0 ? (
              <div className="px-4 py-6 text-center text-[11px] text-gray-400">
                暂无资料，建议上传：投决议案 / 审计报告 / 尽调备忘 / BP / 行业研报
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {project.files.map((f) => {
                  const Icon = kindIcon(f.kind);
                  return (
                    <li key={f.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                        <SFIcon icon={Icon} size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-900">{f.name}</p>
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
        </TabsContent>
      </Tabs>

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
              <SFIcon icon={IconTarget} size={15} className="text-[hsl(var(--foreground))]" />
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">开始分析评估？</h4>
            </div>
            <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">
              确认后将清空当前会话的事实验证与挑战质询清单，按最新偏好（企业信息 / 投资阶段 / 风险容忍度 /
              自定义指令）与知识库重新触发全量工作流。该过程不可逆。
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
