import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Check } from "lucide-react"

const SelectContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  value: any;
  setValue: (value: any) => void;
} | null>(null);

const Select = ({ children, value, onValueChange }: any) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ open, setOpen, value, setValue: onValueChange }}>
      <div ref={containerRef} className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, any>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        className
      )}
      onClick={() => context?.setOpen(!context.open)}
      type="button"
      {...props}
    >
      <div className="flex items-center gap-2">{children}</div>
      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", context?.open && "rotate-180")} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, children }: any) => {
  const context = React.useContext(SelectContext);
  return <span>{context?.value || placeholder || children}</span>
}

const SelectContent = ({ children, className }: any) => {
  const context = React.useContext(SelectContext);
  if (!context?.open) return null;

  return (
    <div className={cn(
      "absolute z-50 mt-2 w-full min-w-[12rem] overflow-hidden rounded-2xl border border-slate-100 bg-white p-1 text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50", 
      className
    )}>
      <div className="p-1 space-y-1">{children}</div>
    </div>
  )
}

const SelectItem = ({ children, className, value, ...props }: any) => {
  const context = React.useContext(SelectContext);
  const isSelected = context?.value === value;

  return (
    <div 
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 pl-3 pr-9 text-sm font-bold outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50 dark:hover:bg-slate-900 dark:focus:bg-slate-900",
        isSelected && "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400",
        className
      )} 
      onClick={() => {
        context?.setValue(value);
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="absolute right-3 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
