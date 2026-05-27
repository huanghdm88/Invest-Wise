import { useEffect, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { Textarea } from "@/src/components/ui/textarea";
import {
  IconAuto,
  IconClose,
  IconRename,
  IconShieldAlert,
  IconTarget,
} from "@/src/lib/icons";
import { industryOptions } from "@/src/data/industries";
import { cn } from "@/src/lib/utils";
import type { InvestmentStage, Project, RiskTolerance } from "@/src/types";

interface CompanyInfoSectionProps {
  project: Project;
  onUpdate: (patch: Partial<Project>) => void;
}

const STAGE_OPTIONS: Array<{
  value: InvestmentStage;
  label: string;
}> = [
  { value: "early-growth", label: "早期 / 成长期" },
  { value: "late-pre-ipo", label: "中后期 / Pre-IPO" },
];

const RISK_OPTIONS: Array<{
  value: RiskTolerance;
  shortLabel: string;
  label: string;
  icon: typeof IconShieldAlert;
}> = [
  { value: "R1", shortLabel: "R1", label: "国资防守型", icon: IconShieldAlert },
  { value: "R2", shortLabel: "R2", label: "稳健均衡型", icon: IconTarget },
  { value: "R3", shortLabel: "R3", label: "激进创投型", icon: IconAuto },
];

function stageMeta(stage: InvestmentStage) {
  return STAGE_OPTIONS.find((s) => s.value === stage);
}

function riskMeta(value: RiskTolerance) {
  return RISK_OPTIONS.find((r) => r.value === value);
}

/**
 * 独立的「企业信息」卡片。
 * 默认仅显示卡片（企业名称、所属行业、投资阶段、风险容忍度），不带外层标题；
 * 点击卡片右上角的编辑按钮才进入可改写状态。
 */
export function CompanyInfoSection({ project, onUpdate }: CompanyInfoSectionProps) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [industryDraft, setIndustryDraft] = useState(project.industry);
  const [stageDraft, setStageDraft] = useState<InvestmentStage>(project.stage);
  const [riskDraft, setRiskDraft] = useState<RiskTolerance>(project.riskTolerance);
  const [instructionDraft, setInstructionDraft] = useState(project.customInstruction);

  useEffect(() => {
    setNameDraft(project.name);
    setIndustryDraft(project.industry);
    setStageDraft(project.stage);
    setRiskDraft(project.riskTolerance);
    setInstructionDraft(project.customInstruction);
    setEditing(false);
  }, [
    project.id,
    project.name,
    project.industry,
    project.stage,
    project.riskTolerance,
    project.customInstruction,
  ]);

  const cancel = () => {
    setNameDraft(project.name);
    setIndustryDraft(project.industry);
    setStageDraft(project.stage);
    setRiskDraft(project.riskTolerance);
    setInstructionDraft(project.customInstruction);
    setEditing(false);
  };

  const save = () => {
    const patch: Partial<Project> = {};
    if (nameDraft.trim() && nameDraft.trim() !== project.name) {
      patch.name = nameDraft.trim();
    }
    if (industryDraft.trim() && industryDraft.trim() !== project.industry) {
      patch.industry = industryDraft.trim();
    }
    if (stageDraft !== project.stage) {
      patch.stage = stageDraft;
    }
    if (riskDraft !== project.riskTolerance) {
      patch.riskTolerance = riskDraft;
    }
    if (instructionDraft !== project.customInstruction) {
      patch.customInstruction = instructionDraft;
    }
    if (Object.keys(patch).length > 0) {
      onUpdate(patch);
    }
    setEditing(false);
  };

  const currentStage = stageMeta(project.stage);
  const currentRisk = riskMeta(project.riskTolerance);
  const hasInstruction = project.customInstruction.trim().length > 0;

  return (
    <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
      {editing ? (
        <div className="space-y-2.5 rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-[var(--shadow-notion-card)]">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-500">
              编辑企业信息
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="取消编辑"
                onClick={cancel}
                title="取消"
              >
                <SFIcon icon={IconClose} size={11} />
              </Button>
              <Button variant="default" size="sm" onClick={save}>
                保存
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500">企业名称</label>
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="请输入企业名称"
              className="h-8 text-[13px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-gray-500">所属行业</label>
            <select
              value={industryDraft}
              onChange={(e) => setIndustryDraft(e.target.value)}
              className={cn(
                "flex h-8 w-full appearance-none rounded-lg border border-[hsl(var(--input))] bg-white bg-[length:16px_16px] bg-[position:right_10px_center] bg-no-repeat px-3 py-1 pr-8 text-[13px] shadow-sm transition-colors",
                "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 16 16%27 fill=%27none%27%3E%3Cpath d=%27M4 6l4 4 4-4%27 stroke=%27%236b7280%27 stroke-width=%271.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E')]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30",
                industryDraft ? "text-gray-900" : "text-[#CCCCCC]"
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
          <div>
            <label className="mb-1.5 block text-[11px] text-gray-500">投资阶段</label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_OPTIONS.map((opt) => {
                const active = stageDraft === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStageDraft(opt.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition-all",
                      active
                        ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] text-gray-500">
              机构风险容忍度
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
              {RISK_OPTIONS.map((opt) => {
                const active = riskDraft === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRiskDraft(opt.value)}
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
          </div>

          <div>
            <label className="mb-1 block text-[11px] text-gray-500">自定义指令</label>
            <Textarea
              value={instructionDraft}
              onChange={(e) => setInstructionDraft(e.target.value)}
              placeholder="例：本次重点审查 AI 算力成本是否能打平、销售费用率是否健康..."
              className="min-h-[88px] text-xs leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="group relative rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="编辑企业信息"
            title="编辑企业信息"
            className={cn(
              "absolute right-1.5 top-1.5 inline-flex items-center justify-center rounded-md px-1.5 py-1 shadow-sm transition-all",
              "bg-gray-900 text-white hover:bg-black",
              "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            )}
          >
            <SFIcon icon={IconRename} size={12} />
          </button>
          <dl className="space-y-2.5 pr-6">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-gray-500">企业名称</dt>
              <dd className="truncate text-right text-[12.5px] font-medium text-gray-900">
                {project.name || "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-gray-500">所属行业</dt>
              <dd className="truncate text-right text-[12.5px] font-medium text-gray-900">
                {project.industry || "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-gray-500">投资阶段</dt>
              <dd className="truncate text-right text-[12.5px] font-medium text-gray-900">
                {currentStage?.label ?? "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[11px] text-gray-500">机构风险容忍度</dt>
              <dd className="truncate text-right text-[12.5px] font-medium text-gray-900">
                {currentRisk?.shortLabel} · {currentRisk?.label}
              </dd>
            </div>
            <div className="flex flex-col gap-1 border-t border-gray-200/70 pt-2.5">
              <dt className="text-[11px] text-gray-500">自定义指令</dt>
              <dd
                className={cn(
                  "whitespace-pre-wrap break-words text-[12px] leading-relaxed",
                  hasInstruction ? "text-gray-800" : "text-gray-400"
                )}
              >
                {hasInstruction ? project.customInstruction : "未设置，点击右上角编辑可填入"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
