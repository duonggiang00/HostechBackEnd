import { useMemo, useState } from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from 'framer-motion';
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  DoorOpen,
  FileSignature,
  HelpCircle,
  House,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MoonStar,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Settings2,
  SunMedium,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarItemId =
  | 'dashboard'
  | 'analytics'
  | 'rooms'
  | 'tenants'
  | 'contracts'
  | 'collections'
  | 'expenses'
  | 'reports'
  | 'settings'
  | 'support';

type SidebarSectionId = 'overview' | 'management' | 'finance' | 'system';

interface SidebarItem {
  id: SidebarItemId;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  alertDot?: boolean;
}

interface SidebarSection {
  id: SidebarSectionId;
  label: string;
  items: SidebarItem[];
}

export interface NhaTroProSidebarProps {
  ownerName?: string;
  roleLabel?: string;
  avatarUrl?: string;
  roomCount?: number;
  availableRooms?: number;
  overdueRentCount?: number;
  onLogout?: () => void;
}

const syneStyle = { fontFamily: '"Syne", sans-serif' } as const;
const sansStyle = { fontFamily: '"DM Sans", sans-serif' } as const;
const noiseTexture =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

const baseSections: SidebarSection[] = [
  {
    id: 'overview',
    label: 'TỔNG QUAN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Thống kê', icon: BarChart3 },
    ],
  },
  {
    id: 'management',
    label: 'QUẢN LÝ',
    items: [
      { id: 'rooms', label: 'Phòng trọ', icon: DoorOpen },
      { id: 'tenants', label: 'Khách thuê', icon: UsersRound },
      { id: 'contracts', label: 'Hợp đồng', icon: FileSignature },
    ],
  },
  {
    id: 'finance',
    label: 'TÀI CHÍNH',
    items: [
      { id: 'collections', label: 'Thu tiền', icon: WalletCards, alertDot: true },
      { id: 'expenses', label: 'Chi phí', icon: CreditCard },
      { id: 'reports', label: 'Báo cáo', icon: ReceiptText },
    ],
  },
  {
    id: 'system',
    label: 'HỆ THỐNG',
    items: [
      { id: 'settings', label: 'Cài đặt', icon: Settings2 },
      { id: 'support', label: 'Hỗ trợ', icon: HelpCircle },
    ],
  },
];

const initialOpenSections: Record<SidebarSectionId, boolean> = {
  overview: true,
  management: true,
  finance: true,
  system: true,
};

const itemVariants = {
  hidden: (index: number) => ({
    opacity: 0,
    x: -18,
    transition: { duration: 0.22, delay: index * 0.045 },
  }),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { 
      duration: 0.3,
      delay: index * 0.05,
      ease: [0.25, 0.1, 0.25, 1] as any // Fix TypeScript variance requirement
    }
  }),
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function NhaTroProSidebar({
  ownerName = 'Nguyễn Thành Nam',
  roleLabel = 'Chủ sở hữu',
  avatarUrl,
  roomCount = 48,
  availableRooms = 7,
  overdueRentCount = 3,
  onLogout,
}: NhaTroProSidebarProps) {
  const [activeItemId, setActiveItemId] = useState<SidebarItemId>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [openSections, setOpenSections] = useState(initialOpenSections);

  const occupiedRooms = Math.max(roomCount - availableRooms, 0);
  const occupancyRate = roomCount > 0 ? Math.round((occupiedRooms / roomCount) * 100) : 0;

  const sections = useMemo(
    () =>
      baseSections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.id === 'rooms') {
            return { ...item, badge: roomCount };
          }

          if (item.id === 'collections') {
            return { ...item, alertDot: overdueRentCount > 0 };
          }

          return item;
        }),
      })),
    [overdueRentCount, roomCount],
  );

  const surfaceClasses = isDarkMode
    ? 'bg-[#0f1623] text-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]'
    : 'bg-[#f6efe5] text-[#131926] shadow-[0_30px_90px_rgba(15,22,35,0.12)]';

  const subtleCardClasses = isDarkMode
    ? 'border-white/10 bg-white/[0.05]'
    : 'border-[#d4c2a3] bg-white/70';

  const sectionLabelClasses = isDarkMode
    ? 'text-[#f0a500]/85'
    : 'text-[#b67900]';

  const inactiveItemClasses = isDarkMode
    ? 'text-slate-300 hover:text-white'
    : 'text-slate-600 hover:text-[#131926]';

  const dividerClasses = isDarkMode
    ? 'from-transparent via-[#f0a500]/45 to-transparent'
    : 'from-transparent via-[#c78b10]/55 to-transparent';

  const iconShellClasses = isDarkMode
    ? 'bg-white/[0.04] text-[#f0a500]'
    : 'bg-[#131926] text-[#f0a500]';

  return (
    <>
      <style id="nhatro-pro-sidebar-fonts">{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@500;700;800&display=swap');
      `}</style>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 overflow-hidden border-r border-white/10',
          surfaceClasses,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{ backgroundImage: noiseTexture }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(240,165,0,0.16),_transparent_36%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#f0a500]/35 to-transparent" />

        <div className="relative flex h-full flex-col">
          <div className="px-4 pb-4 pt-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[0_12px_34px_rgba(240,165,0,0.18)]',
                    iconShellClasses,
                  )}
                >
                  <div className="relative">
                    <House className="h-5 w-5" />
                    <KeyRound className="absolute -bottom-1 -right-1 h-3.5 w-3.5" />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {!collapsed ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="min-w-0"
                    >
                      <p
                        className="truncate text-[1.15rem] font-extrabold tracking-tight text-white"
                        style={syneStyle}
                      >
                        NhàTrọ Pro
                      </p>
                      <p
                        className="truncate text-[11px] uppercase tracking-[0.26em] text-slate-400"
                        style={sansStyle}
                      >
                        Boarding HQ
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => setCollapsed((current) => !current)}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all',
                  subtleCardClasses,
                  isDarkMode
                    ? 'text-slate-200 hover:border-[#f0a500]/45 hover:bg-white/[0.08]'
                    : 'text-slate-700 hover:border-[#f0a500]/45 hover:bg-white',
                )}
                aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {!collapsed ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn('mt-5 rounded-3xl border p-3', subtleCardClasses)}
                >
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={ownerName}
                        className="h-12 w-12 rounded-2xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-sm font-bold text-white"
                        style={syneStyle}
                      >
                        {getInitials(ownerName)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white" style={syneStyle}>
                        {ownerName}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#f0a500]/12 px-2.5 py-1 text-[11px] font-semibold text-[#ffd27a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f0a500]" />
                        <span style={sansStyle}>{roleLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Phòng', value: roomCount },
                      { label: 'Lấp đầy', value: `${occupancyRate}%` },
                      { label: 'Quá hạn', value: overdueRentCount },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={cn(
                          'rounded-2xl border px-2 py-2 text-center',
                          isDarkMode ? 'border-white/8 bg-[#151f30]' : 'border-[#dfcfb2] bg-white/80',
                        )}
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400" style={sansStyle}>
                          {stat.label}
                        </p>
                        <p className="mt-1 text-sm font-bold text-white" style={syneStyle}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <LayoutGroup id="nhatro-pro-sidebar-active">
              {sections.map((section, sectionIndex) => {
                const sectionIsOpen = collapsed ? true : openSections[section.id];

                return (
                  <div key={section.id} className={cn(sectionIndex > 0 ? 'mt-4 pt-4' : '')}>
                    {sectionIndex > 0 ? (
                      <div className={cn('mx-3 mb-4 h-px bg-gradient-to-r', dividerClasses)} />
                    ) : null}

                    {collapsed ? null : (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSections((current) => ({
                            ...current,
                            [section.id]: !current[section.id],
                          }))
                        }
                        className="mb-2 flex w-full items-center gap-3 px-3 text-left"
                      >
                        <span
                          className={cn('text-[11px] font-bold tracking-[0.28em]', sectionLabelClasses)}
                          style={syneStyle}
                        >
                          {section.label}
                        </span>
                        <div className={cn('h-px flex-1 bg-gradient-to-r', dividerClasses)} />
                        <motion.span
                          animate={{ rotate: sectionIsOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-slate-500"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                    )}

                    <AnimatePresence initial={false}>
                      {sectionIsOpen ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1.5">
                            {section.items.map((item, itemIndex) => {
                              const isActive = activeItemId === item.id;
                              const sequenceIndex = sectionIndex * 3 + itemIndex;

                              return (
                                <motion.div
                                  key={item.id}
                                  custom={sequenceIndex}
                                  initial="hidden"
                                  animate="visible"
                                  variants={itemVariants}
                                  className="relative"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setActiveItemId(item.id)}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                      'group relative flex w-full items-center overflow-hidden rounded-2xl text-left transition-transform duration-300',
                                      collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3',
                                      inactiveItemClasses,
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100',
                                        isDarkMode ? 'bg-white/[0.05]' : 'bg-white/60',
                                      )}
                                    />

                                    {isActive ? (
                                      <motion.div
                                        layoutId="nhatro-pro-active-item"
                                        className={cn(
                                          'absolute inset-0 rounded-2xl border backdrop-blur-xl',
                                          isDarkMode
                                            ? 'border-white/10 bg-white/[0.09] shadow-[0_18px_42px_rgba(0,0,0,0.28)]'
                                            : 'border-white/80 bg-white/80 shadow-[0_18px_42px_rgba(15,22,35,0.12)]',
                                        )}
                                        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                                      />
                                    ) : null}

                                    {isActive ? (
                                      <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[#f0a500]" />
                                    ) : null}

                                    <span
                                      className={cn(
                                        'relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                                        collapsed ? 'h-10 w-10' : 'mr-3 h-10 w-10',
                                        isActive
                                          ? 'text-[#f0a500]'
                                          : isDarkMode
                                            ? 'text-slate-400 group-hover:text-white'
                                            : 'text-slate-500 group-hover:text-[#131926]',
                                      )}
                                    >
                                      <item.icon className="h-4.5 w-4.5" />
                                    </span>

                                    {!collapsed ? (
                                      <span className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-3">
                                        <span className="truncate text-sm font-semibold" style={syneStyle}>
                                          {item.label}
                                        </span>

                                        <span className="flex shrink-0 items-center gap-2">
                                          {item.badge ? (
                                            <span
                                              className={cn(
                                                'rounded-full px-2 py-1 text-[11px] font-bold',
                                                isActive
                                                  ? 'bg-[#f0a500]/18 text-[#ffd27a]'
                                                  : isDarkMode
                                                    ? 'bg-white/[0.08] text-slate-300'
                                                    : 'bg-[#131926]/8 text-slate-600',
                                              )}
                                              style={sansStyle}
                                            >
                                              {item.badge}
                                            </span>
                                          ) : null}

                                          {item.alertDot ? (
                                            <span className="relative flex h-2.5 w-2.5">
                                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
                                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                                            </span>
                                          ) : null}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#111a27]/95 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                                        <span style={sansStyle}>{item.label}</span>
                                      </span>
                                    )}

                                    {collapsed && item.badge ? (
                                      <span className="absolute right-2 top-2 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f0a500] px-1 text-[9px] font-bold text-[#131926]">
                                        {item.badge}
                                      </span>
                                    ) : null}

                                    {collapsed && item.alertDot ? (
                                      <span className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(15,22,35,0.92)]" />
                                    ) : null}
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </LayoutGroup>
          </div>

          <div className="px-3 pb-4 pt-2">
            <div className={cn('mb-4 h-px bg-gradient-to-r', dividerClasses)} />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDarkMode((current) => !current)}
                className={cn(
                  'flex h-12 items-center justify-center rounded-2xl border transition-all',
                  subtleCardClasses,
                  collapsed ? 'w-full' : 'w-12',
                  isDarkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-white',
                )}
                aria-label="Bật hoặc tắt dark mode"
              >
                {isDarkMode ? <MoonStar className="h-4.5 w-4.5" /> : <SunMedium className="h-4.5 w-4.5" />}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className={cn(
                  'flex h-12 flex-1 items-center rounded-2xl border px-4 transition-all',
                  subtleCardClasses,
                  isDarkMode ? 'hover:bg-white/[0.08]' : 'hover:bg-white',
                  collapsed ? 'justify-center px-0' : 'justify-between',
                )}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-4.5 w-4.5 text-[#f0a500]" />
                  {!collapsed ? (
                    <span className="text-sm font-semibold" style={syneStyle}>
                      Đăng xuất
                    </span>
                  ) : null}
                </div>

                {!collapsed ? (
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500" style={sansStyle}>
                    Safe exit
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
