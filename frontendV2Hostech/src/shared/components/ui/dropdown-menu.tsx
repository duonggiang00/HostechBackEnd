import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
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
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

const DropdownMenuTrigger = React.forwardRef<HTMLDivElement, any>(({ asChild, children, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext);
  return (
    <div 
      ref={ref} 
      className="cursor-pointer" 
      onClick={() => context?.setOpen(!context.open)}
      {...props}
    >
      {children}
    </div>
  );
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = ({ children, className, align = "right" }: any) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context?.open) return null;

  return (
    <div className={cn(
      "absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200",
      align === "right" ? "right-0" : "left-0",
      className
    )}>
      {children}
    </div>
  )
}

const DropdownMenuItem = ({ children, className, onClick, ...props }: any) => {
  const context = React.useContext(DropdownMenuContext);
  return (
    <div 
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50", 
        className
      )} 
      onClick={(e) => {
        onClick?.(e);
        context?.setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  )
}

const DropdownMenuLabel = ({ children, className }: any) => (
  <div className={cn("px-3 py-2 text-xs font-black text-slate-400 uppercase tracking-widest", className)}>
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className }: any) => (
  <div className={cn("-mx-1 my-1 h-px bg-slate-50", className)} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
