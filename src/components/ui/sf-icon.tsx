import * as React from "react";
import { SFIcon as BaseSFIcon } from "@bradleyhodges/sfsymbols-react";

import { cn } from "@/src/lib/utils";

/**
 * 项目统一的 SF Symbols 图标组件，沿用 UI_Standard 的封装。
 *
 * 设计要点：
 * - `size` 默认 16px（与原 lucide 默认尺寸保持一致）
 * - `weight` 控制描边粗细（不传 = 填充模式，传数字 = 描边模式）
 * - `color` 默认 currentColor，方便用 Tailwind 的 text-* 控制颜色
 * - 自带 `shrink-0`，避免 flex 容器中被压缩
 */
type SFIconProps = {
  icon: React.ComponentProps<typeof BaseSFIcon>["icon"];
  size?: number | string;
  weight?: number | null;
  color?: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

function SFIcon({ icon, size = 16, weight, color, className, title, ...rest }: SFIconProps) {
  return (
    <BaseSFIcon
      icon={icon}
      size={size}
      weight={weight ?? undefined}
      color={color}
      title={title}
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}

export { SFIcon };
export type { SFIconProps };
