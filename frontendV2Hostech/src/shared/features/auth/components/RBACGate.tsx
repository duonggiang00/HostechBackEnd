import { type ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';

interface RBACGateProps {
  permission: string;
  fallback?: ReactNode;
  showDisabled?: boolean;
  disabledTooltip?: string;
  children: ReactNode;
}

/**
 * RBACGate handles component-level permissions.
 * - If permission is missing: 
 *   - default: hides children (returns null)
 *   - fallback: returns custom fallback
 *   - showDisabled: clones children with 'disabled' prop and adds a tooltip
 */
export default function RBACGate({ 
  permission, 
  fallback = null, 
  showDisabled = false, 
  disabledTooltip = "You don't have permission for this action",
  children 
}: RBACGateProps) {
  const { hasPermission } = useAuthStore();
  const allowed = hasPermission(permission);

  if (allowed) return <>{children}</>;

  if (showDisabled && typeof children === 'object' && children !== null) {
    // If showDisabled is true, we attempt to inject disabled styles/props
    // Note: This works best with interactive components that support 'disabled'
    return (
      <div className="relative group inline-block">
        <div className="opacity-40 grayscale pointer-events-none cursor-not-allowed">
          {children}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {disabledTooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
}
