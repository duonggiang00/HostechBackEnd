import React from "react";
import { cn } from "../../utils/cn";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const GlassCard = ({ children, className, hoverable = false, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass-morphism rounded-3xl p-6 transition-all duration-300",
        hoverable && "hover:translate-y-[-4px] hover:shadow-xl hover:border-white/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
