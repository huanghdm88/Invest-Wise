import * as React from "react";

import { cn } from "@/src/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[64px] w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-[13px] shadow-sm transition-colors placeholder:text-[#CCCCCC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
