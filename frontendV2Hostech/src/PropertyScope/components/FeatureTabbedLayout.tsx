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
      className={`p-4 md:p-8 space-y-6 ${maxWidth} mx-auto pb-20`}
    >
      {/* Tabs Navigation - Sticky at top */}
      <div className="flex justify-center sticky top-4 z-50">
        <div className="flex items-center gap-1 p-1 bg-white rounded-lg w-fit shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-gray-100">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-6 py-2 rounded-md text-[14px] font-medium transition-colors duration-200 outline-none
                  ${isActive ? 'text-blue-900 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
                `}
              >
                <span className="relative z-10 flex items-center gap-2 tracking-wide font-semibold">
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
                <div className="p-2.5 bg-blue-900 rounded-lg shadow-sm">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-none mt-1">
                {title}
              </h1>
            </div>
            {description && (
              <p className="text-sm text-gray-500 mt-2 font-medium">
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
