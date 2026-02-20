import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-9 px-3 py-1",
        sm: "h-8 px-2.5 py-1 text-xs",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-5 py-3 text-base",
      },
      variant: {
        default: "border-input",
        ghost: "border-transparent bg-transparent hover:border-input focus-visible:border-input",
        filled: "border-transparent bg-muted focus-visible:bg-background focus-visible:border-input",
        error: "border-error focus-visible:ring-error",
        success: "border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:ring-warning",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  clearable?: boolean
  onClear?: () => void
  loading?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    size, 
    variant, 
    icon, 
    iconPosition = "left", 
    clearable = false,
    onClear,
    loading = false,
    ...props 
  }, ref) => {
    const hasIcon = icon || loading || (clearable && props.value)
    
    return (
      <div className="relative">
        {(icon || loading) && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              icon
            )}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ size, variant }),
            hasIcon && iconPosition === "left" && "pl-10",
            hasIcon && iconPosition === "right" && "pr-10",
            clearable && props.value && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {icon && iconPosition === "right" && !clearable && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        {clearable && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Specialized search input component
interface SearchInputProps extends Omit<InputProps, 'type' | 'icon'> {
  onSearch?: (query: string) => void
  debounceMs?: number
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 300, className, ...props }, ref) => {
    const [query, setQuery] = React.useState(props.value || '')
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>()
    
    React.useEffect(() => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        onSearch?.(String(query))
      }, debounceMs)
      
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      }
    }, [query, onSearch, debounceMs])
    
    return (
      <Input
        ref={ref}
        type="search"
        icon={
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        }
        placeholder="Search collaborators..."
        clearable
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onClear={() => setQuery('')}
        className={className}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, SearchInput, inputVariants }