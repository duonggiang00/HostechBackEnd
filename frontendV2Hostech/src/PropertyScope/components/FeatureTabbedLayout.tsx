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
      className={`p-4 md:px-8 md:py-0 space-y-2 ${maxWidth} mx-auto pb-20`}
    >
      {/* Header Section */}
      {propertyHeader ? (
        propertyHeader
      ) : (
        <div className="px-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {Icon && (
                  <div className="p-2.5 bg-blue-900 rounded-lg shadow-sm">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-none mt-1">
                  {title}
                </h1>
              </div>
              {description && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 font-medium">
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

          {/* New Integrated Header Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-8 -mb-px">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.icon;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative outline-none
                        ${isActive
                          ? 'text-blue-900 dark:text-blue-400'
                          : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300'}
                      `}
                    >
                      <TabIcon className="w-4 h-4" />
                      {tab.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900 dark:bg-blue-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area with Animation */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTabItem?.content || children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
