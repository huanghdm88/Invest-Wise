import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconCheckCircle, IconHelpCircle } from "@/src/lib/icons";
import { cn } from "@/src/lib/utils";
import type { ClarificationField } from "@/src/types";

interface ClarificationCardProps {
  title: string;
  reason: string;
  fields: ClarificationField[];
  onSubmit: (values: Record<string, string>) => void;
}

const fieldInputClass =
  "h-10 border border-gray-200 bg-white shadow-none focus-visible:border focus-visible:border-black focus-visible:ring-0";

export function ClarificationCard({ title, reason, fields, onSubmit }: ClarificationCardProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allRequiredFilled = fields
    .filter((f) => f.required)
    .every((f) => (values[f.key] ?? "").trim() !== "");

  if (submitted) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <SFIcon icon={IconCheckCircle} size={14} />
        </span>
        <p className="text-[13px] font-medium text-emerald-800">
          已提交，Agent 将基于补充数据继续推算
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 pt-4 pb-3.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
          <SFIcon icon={IconHelpCircle} size={11} />
          Agent · 待补充信息
        </div>
        <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-gray-900">{title}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500">{reason}</p>
      </div>

      <div className="space-y-3.5 border-t border-gray-100 px-5 py-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="flex items-center gap-1 text-[12px] font-medium text-gray-800">
              {f.label}
              {f.required && <span className="text-rose-500">*</span>}
            </label>
            <Input
              type={f.type === "number" ? "number" : "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.hint || `请输入${f.label}`}
              className={fieldInputClass}
            />
            {f.hint && (
              <p className="text-[11px] leading-relaxed text-gray-400">{f.hint}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-[#fafafa] px-5 py-3">
        <span className="text-[11px] text-gray-400">
          {allRequiredFilled
            ? "已填写完所有必填项，可提交"
            : `${fields.filter((f) => f.required).length} 项必填 · 完成后可提交`}
        </span>
        <Button
          variant="default"
          size="sm"
          disabled={!allRequiredFilled}
          onClick={() => {
            onSubmit(values);
            setSubmitted(true);
          }}
          className={cn("min-w-[88px]")}
        >
          提交
        </Button>
      </div>
    </div>
  );
}

