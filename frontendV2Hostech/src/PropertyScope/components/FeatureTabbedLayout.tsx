import { type ReactNode, useState, useEffect } from 'react';
import { type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  content?: ReactNode;
}

interface FeatureTabbedLayoutProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  tabs: readonly TabItem[] | TabItem[];
  activeTab?: string;
  onTabChange?: (id: any) => void;
  children?: ReactNode;
  headerExtra?: ReactNode;
  propertyHeader?: ReactNode;
  maxWidth?: string;
  defaultTab?: string;
}

export function FeatureTabbedLayout({
  title,
  description,
  icon: Icon,
  tabs,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  children,
  headerExtra,
  propertyHeader,
  maxWidth = 'max-w-7xl',
  defaultTab
}: FeatureTabbedLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [internalActiveTab, setInternalActiveTab] = useState<string>(
    externalActiveTab || searchParams.get('tab') || defaultTab || tabs[0]?.id
  );

  const activeTab = externalActiveTab || internalActiveTab;

  useEffect(() => {
    if (!externalActiveTab) {
      const tabFromUrl = searchParams.get('tab');
      if (tabFromUrl && tabFromUrl !== internalActiveTab) {
        setInternalActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, externalActiveTab, internalActiveTab]);

  const handleTabChange = (id: string) => {
    if (externalOnTabChange) {
      externalOnTabChange(id);
    } else {
      setInternalActiveTab(id);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

  const activeTabItem = tabs.find(t => t.id === activeTab);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 md:p-8 space-y-8 ${maxWidth} mx-auto pb-20`}
    >
      {/* Tabs Navigation - Sticky at top */}
      <div className="flex justify-center sticky top-4 z-50">
        <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl w-fit border border-white/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300
                  ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-white dark:bg-indigo-600 shadow-sm rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 uppercase tracking-wider">
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Section */}
      {propertyHeader ? (
        propertyHeader
      ) : (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {Icon && (
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transform hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <h1 className="text-2xl font-black bg-linear-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {title}
              </h1>
            </div>
            {description && (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {headerExtra && (
            <div className="flex items-center gap-3">
              {headerExtra}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area with Animation */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            {activeTabItem?.content || children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
