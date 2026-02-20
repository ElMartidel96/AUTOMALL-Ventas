import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 border backdrop-blur-sm",
          // Light mode - glass crystal effect
          "border-gray-300/80 bg-white/80 text-gray-900 placeholder:text-gray-400 focus-visible:border-cyan-500 focus-visible:bg-white",
          // Dark mode - glass crystal effect with visible borders
          "dark:border-white/20 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-gray-400 dark:focus-visible:border-purple-400/60 dark:focus-visible:bg-slate-800/70",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }