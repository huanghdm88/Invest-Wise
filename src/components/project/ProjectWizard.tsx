import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { KnowledgeBase } from "@/src/components/project/KnowledgeBase";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { industryOptions } from "@/src/data/industries";
import {
  IconArrowRight,
  IconBuilding,
  IconCompass,
  IconFolderPlus,
  IconShieldAlert,
  IconWand,
} from "@/src/lib/icons";
import { cn, uid } from "@/src/lib/utils";
import type { InvestmentStage, KnowledgeFile, Project, RiskTolerance } from "@/src/types";

interface ProjectWizardProps {
  onCreate: (project: Project) => void;
  onCancel: () => void;
}

const stages: Array<{ value: InvestmentStage; label: string; sub: string }> = [
  { value: "early-growth", label: "早期 / 成长期", sub: "PS 优先 · TAM 锚定" },
  { value: "late-pre-ipo", label: "中后期 / Pre-IPO", sub: "PE 优先 · 盈利质量" },
];

const risks: Array<{ value: RiskTolerance; label: string; tag: string }> = [
  { value: "R1", label: "国资防守型", tag: "极度敏感" },
  { value: "R2", label: "稳健均衡型", tag: "推荐" },
  { value: "R3", label: "激进创投型", tag: "增长优先" },
];


export function ProjectWizard({ onCreate, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [project, setProject] = useState<Project>({
    id: uid("proj"),
    name: "",
    industry: "",
    stage: "early-growth",
    riskTolerance: "R2",
    customInstruction: "",
    status: "draft",
    files: [],
    updatedAt: new Date().toISOString(),
  });

  const update = (patch: Partial<Project>) =>
    setProject((p) => ({ ...p, ...patch, updatedAt: new Date().toISOString() }));

  const canProceed = project.name.trim() !== "" && project.industry.trim() !== "";

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="relative flex items-center border-b border-gray-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white">
            <SFIcon icon={IconFolderPlus} size={15} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">新建投决项目</p>
            <p className="text-[11px] text-gray-500">两步完成 · 项目隔离 · 偏好可继承</p>
          </div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 text-xs">
          <StepDot active={step >= 1} label="基本信息" />
          <span className="h-px w-8 bg-gray-300" />
          <StepDot active={step >= 2} label="知识库" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto thin-scroll px-6 py-6">
        {step === 1 ? (
          <div className="mx-auto max-w-2xl space-y-5">
            <Section icon={<SFIcon icon={IconBuilding} size={12} />} title="项目命名">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">项目名称</label>
                  <Input
                    placeholder="例：星河智算 A+ 轮投决"
                    value={project.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">行业 / 赛道</label>
                  <select
                    value={project.industry}
                    onChange={(e) => update({ industry: e.target.value })}
                    className={cn(
                      "flex h-9 w-full appearance-none rounded-lg border border-[hsl(var(--input))] bg-white bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat px-3 py-2 pr-9 text-[13px] shadow-sm transition-colors",
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
            </Section>

            <Section icon={<SFIcon icon={IconCompass} size={12} />} title="投资阶段">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {stages.map((s) => {
                  const active = project.stage === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update({ stage: s.value })}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className={cn("mt-0.5 text-[11px]", active ? "text-gray-300" : "text-gray-500")}>
                        {s.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon={<SFIcon icon={IconShieldAlert} size={12} />} title="风险容忍度">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {risks.map((r) => {
                  const active = project.riskTolerance === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => update({ riskTolerance: r.value })}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}
                    >
                      <span className="text-xs font-semibold">{r.value}</span>
                      <span className="text-sm font-medium">{r.label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px]",
                          active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {r.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon={<SFIcon icon={IconWand} size={12} />} title="自定义分析指令（可选）">
              <Textarea
                placeholder="例：本项目重点审查 AI 算力成本、收入确认时点合理性、客户集中度..."
                value={project.customInstruction}
                onChange={(e) => update({ customInstruction: e.target.value })}
                className="min-h-[90px] text-xs leading-relaxed"
              />
              <p className="text-[11px] text-gray-500">
                项目创建后仍可随时修改 · 修改后会触发 Agent 重算
              </p>
            </Section>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-2">
            <p className="text-sm font-semibold text-gray-900">上传项目知识库</p>
            <p className="text-xs text-gray-500">
              建议至少上传：① 投资议案 / IM ② 审计报告或财务尽调 ③ 商业计划书。完成上传后即可与
              Agent 开启对话；未上传也能创建空项目。
            </p>
            <KnowledgeBase
              project={project}
              onUpdateFiles={(files: KnowledgeFile[]) => update({ files })}
            />
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <Button variant="outline" size="sm" onClick={() => setStep(1)}>
              上一步
            </Button>
          )}
          {step === 1 ? (
            <Button variant="default" size="sm" disabled={!canProceed} onClick={() => setStep(2)}>
              下一步：知识库
              <SFIcon icon={IconArrowRight} size={12} />
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                onCreate({
                  ...project,
                  status: project.files.length > 0 ? "parsing" : "draft",
                })
              }
            >
              <SFIcon icon={IconFolderPlus} size={12} />
              创建并进入工作区
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
