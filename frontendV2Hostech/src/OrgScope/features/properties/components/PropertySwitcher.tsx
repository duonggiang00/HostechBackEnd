import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/features/auth/hooks/useAuth';
import { useProperties, type Property } from '@/OrgScope/features/properties/hooks/useProperties';
import { Building2, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DropdownRect {
  top: number;
  left: number;
  width: number;
}

export default function PropertySwitcher({ variant = 'header' }: { variant?: 'header' | 'sidebar' }) {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const organizationId = user?.org_id;

  const { data: properties = [], isLoading, isError } = useProperties({
    'filter[org_id]': organizationId || undefined,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedProperty = properties.find((p: Property) => p.id === propertyId);

  // Compute dropdown position from button bounding rect every time dropdown opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownRect({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 256),
      });
    }
  }, [isOpen]);

  // Close when scrolling so the dropdown doesn't drift
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [isOpen]);

  if (isLoading) {
    return (
      <div
        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 ${
          variant === 'sidebar'
            ? 'border-slate-200/50 bg-slate-50/50 dark:border-slate-700/50 dark:bg-slate-800/50'
            : 'border-white/80 bg-white/80 shadow-[0_10px_28px_rgba(15,23,42,0.06)] dark:border-slate-800/70 dark:bg-slate-900/80'
        }`}
      >
        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400">Đang tải...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/90 px-3.5 py-3 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-bold">Lỗi tải dữ liệu</span>
      </div>
    );
  }

  // Dropdown rendered via portal so it is completely outside the sidebar DOM tree.
  // This escapes: overflow-hidden clipping, backdrop-filter stacking context, overflow-y-auto context.
  const dropdownPortal = (
    <AnimatePresence>
      {isOpen && dropdownRect && (
        <>
          {/* Invisible backdrop – captures outside clicks */}
          <div
            className="fixed inset-0 z-9998"
            onClick={() => setIsOpen(false)}
          />

          {/* Floating dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-1 border-b border-slate-100 px-3 py-2 dark:border-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Chọn phạm vi
              </p>
            </div>
            <div className="cust-scrollbar max-h-60 space-y-0.5 overflow-y-auto">
              {properties.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-400">Không tìm thấy cơ sở nào.</p>
                </div>
              )}
              {properties.map((property: Property) => (
                <button
                  key={property.id}
                  onClick={() => {
                    if (propertyId && location.pathname.includes(`/properties/${propertyId}/`)) {
                      const relativePath =
                        location.pathname.split(`/properties/${propertyId}/`)[1] || 'dashboard';
                      navigate(`/properties/${property.id}/${relativePath}`);
                    } else {
                      navigate(`/properties/${property.id}/dashboard`);
                    }
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                    property.id === propertyId
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-[13px] font-semibold">{property.name}</p>
                    <p className="text-[11px] font-medium opacity-60">
                      {property.address || property.code}
                    </p>
                  </div>
                  {property.id === propertyId && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="relative w-full">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex w-full items-center justify-between gap-3 rounded-xl border transition-all duration-300 ${
            variant === 'sidebar'
              ? 'border-transparent bg-transparent px-2.5 py-2 hover:bg-slate-500/5 dark:hover:bg-white/5'
              : 'border-white/80 bg-white/80 px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)] hover:border-brand-100 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/80 dark:hover:border-slate-700 dark:hover:bg-slate-900'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-[0_12px_24px_rgba(99,102,241,0.24)] dark:bg-brand-500 dark:shadow-none ${
                variant === 'sidebar' ? 'h-9 w-9' : 'h-10 w-10'
              }`}
            >
              <Building2 className={`${variant === 'sidebar' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
            </div>
            <div className="min-w-0 text-left">
              <p className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.18em] text-slate-400">
                {variant === 'sidebar' ? 'Cơ sở' : 'Cơ sở hoạt động'}
              </p>
              <p className="truncate text-[13px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
                {selectedProperty?.name || 'Chọn cơ sở'}
              </p>
              {variant === 'header' && (
                <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {selectedProperty?.address || selectedProperty?.code || 'Chuyển phạm vi'}
                </p>
              )}
            </div>
          </div>
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 dark:bg-white/5 dark:text-slate-500 ${
              variant === 'sidebar' ? 'h-7 w-7' : 'h-8 w-8'
            }`}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </div>

      {/* Portal: renders into document.body, fully outside sidebar stacking context */}
      {createPortal(dropdownPortal, document.body)}
    </>
  );
}
