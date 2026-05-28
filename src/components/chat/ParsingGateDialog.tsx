import { Button } from "@/src/components/ui/button";
import { SFIcon } from "@/src/components/ui/sf-icon";
import { IconAbort, IconRefresh } from "@/src/lib/icons";

interface ParsingGateDialogProps {
  open: boolean;
  /** 触发任务的种类：用来定制弹窗文案 */
  taskKind: "challenge" | "fact-check";
  /** 项目名（仅用于文案上下文，可选） */
  projectName?: string;
  onCancel: () => void;
  onContinue: () => void;
}

/**
 * 当项目知识库仍在解析中时，用户发起挑战质询 / 事实交叉验证前的二次确认。
 * 强调「结论置信度可能受影响」，并提供「继续执行」和「等待解析完成」两个出口。
 */
export function ParsingGateDialog({
  open,
  taskKind,
  projectName,
  onCancel,
  onContinue,
}: ParsingGateDialogProps) {
  if (!open) return null;

  const taskLabel =
    taskKind === "challenge" ? "挑战质询" : "事实交叉验证";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
      <div className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-gray-100 bg-amber-50/60 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <SFIcon icon={IconAbort} size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              KNOWLEDGE BASE · PARSING
            </p>
            <h4 className="mt-1 text-[14px] font-semibold leading-snug text-gray-900">
              知识库仍在解析中
            </h4>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-gray-600">
            {projectName ? `「${projectName}」` : "当前项目"}
            的知识库仍有内容正在解析。继续执行
            <span className="mx-1 font-medium text-gray-900">{taskLabel}</span>
            可能因部分材料尚未入库，导致结论的置信度低于完整口径。建议等待解析完成后再启动。
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-gray-500">
            <SFIcon
              icon={IconRefresh}
              size={11}
              className="animate-spin text-amber-500"
            />
            <span>解析任务通常会在 1–2 分钟内完成。</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            等待解析完成
          </Button>
          <Button variant="default" size="sm" onClick={onContinue}>
            继续执行
          </Button>
        </div>
      </div>
    </div>
  );
}
