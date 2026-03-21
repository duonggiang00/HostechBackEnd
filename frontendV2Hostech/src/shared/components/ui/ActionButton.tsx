import React from 'react';
import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion';
import { type LucideIcon, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes safely
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ActionButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  label: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  glow?: boolean;
  fullWidth?: boolean;
}

/**
 * ActionButton - A premium, animated action button with glassmorphism and modern aesthetics.
 * Refactor of standard buttons following @frontend-developer and @react-patterns.
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  glow = true,
  fullWidth = false,
  disabled,
  ...props
}) => {
  // ── Variant Styles ────────────────────────────────────────────────────────
  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      "bg-linear-to-br from-brand-600 to-brand-500 text-white shadow-brand-500/20",
      glow && "hover:shadow-brand-500/40 hover:shadow-lg"
    ),
    secondary: cn(
      "bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700",
      glow && "hover:shadow-slate-500/10 hover:shadow-lg"
    ),
    danger: cn(
      "bg-linear-to-br from-danger-600 to-danger-500 text-white shadow-danger-500/20",
      glow && "hover:shadow-danger-500/40 hover:shadow-lg"
    ),
    success: cn(
      "bg-linear-to-br from-success-600 to-success-500 text-white shadow-success-500/20",
      glow && "hover:shadow-success-500/40 hover:shadow-lg"
    ),
    warning: cn(
      "bg-linear-to-br from-warning-600 to-warning-500 text-white shadow-warning-500/20",
      glow && "hover:shadow-warning-500/40 hover:shadow-lg"
    ),
    glass: cn(
      "bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 text-brand-600 dark:text-brand-400",
      "hover:bg-white/20 dark:hover:bg-black/30"
    )
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
    xl: "px-8 py-4 text-lg rounded-3xl gap-3 font-black tracking-tight"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }}
      disabled={disabled || isLoading}
      className={cn(
        "relative flex items-center justify-center font-bold transition-all overflow-hidden",
        "focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        fullWidth ? "w-full" : "w-fit",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {/* ── Background Shimmer ─────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full"
        animate={{
          translateX: ["-100%", "200%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
          repeatDelay: 2
        }}
      />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            className="flex items-center"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-inherit"
          >
            {Icon && <Icon className={cn(
              size === 'sm' ? "w-3.5 h-3.5" : size === 'xl' ? "w-6 h-6" : "w-5 h-5"
            )} />}
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ActionButton;
