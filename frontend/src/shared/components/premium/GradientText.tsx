import React from "react";
import { cn } from "../../utils/cn";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  from?: string;
  to?: string;
}

export const GradientText = ({ 
  children, 
  className, 
  from = "from-blue-400", 
  to = "to-indigo-500",
  ...props 
}: GradientTextProps) => {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r",
        from,
        to,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
