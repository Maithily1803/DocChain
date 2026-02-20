import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-gray-300 focus:border-primary focus:ring-primary/50 focus:ring-1 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring focus-visible:ring-primary/50 focus-visible:ring-offset-0 disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-600 dark:focus:border-primary/80 dark:focus:ring-primary/20 dark:focus:ring-offset-gray-900 dark:focus-visible:ring-primary/20 dark:focus-visible:ring-offset-gray-900 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-400 aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
