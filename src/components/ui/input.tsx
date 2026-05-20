import * as React from "react";

import { cn } from "@/src/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-[13px] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#CCCCCC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
