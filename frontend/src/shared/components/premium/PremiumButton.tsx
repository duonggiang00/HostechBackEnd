import React from "react";
import { cn } from "../../utils/cn";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const PremiumButton = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  ...props
}: PremiumButtonProps) => {
  const variants = {
    primary: "premium-gradient-primary text-white shadow-premium hover:shadow-lg hover:brightness-110",
    secondary: "premium-gradient-success text-white shadow-premium hover:shadow-lg hover:brightness-110",
    outline: "bg-transparent border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10",
    ghost: "bg-transparent text-slate-400 hover:bg-white/5 hover:text-white",
    link: "bg-transparent text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline px-0 py-0",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant as keyof typeof variants] || variants.primary,
        variant !== "link" && sizes[size as keyof typeof sizes],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
