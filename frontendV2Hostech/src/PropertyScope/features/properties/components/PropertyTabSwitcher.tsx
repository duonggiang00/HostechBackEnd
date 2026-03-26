import { motion } from 'framer-motion';
import { LayoutDashboard, Info } from 'lucide-react';

interface PropertyTabSwitcherProps {
  activeTab: 'dashboard' | 'info';
  onTabChange: (tab: 'dashboard' | 'info') => void;
}

export function PropertyTabSwitcher({ activeTab, onTabChange }: PropertyTabSwitcherProps) {
  const tabs = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'info', label: 'Thông báo & Cài đặt', icon: Info },
  ] as const;

  return (
    <div className="flex items-center p-1 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl w-fit border border-white/50 dark:border-slate-700/50 shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
              ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white dark:bg-indigo-600 shadow-sm rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
