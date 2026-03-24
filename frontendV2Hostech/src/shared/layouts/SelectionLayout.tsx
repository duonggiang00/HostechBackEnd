import type { ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { LogOut, LayoutGrid, Building2 } from 'lucide-react';
import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
import { motion } from 'framer-motion';

interface SelectionLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function SelectionLayout({ children, title = 'Select Workspace', subtitle = 'Choose a context to start your work' }: SelectionLayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-910 flex flex-col">
      {/* Selection Header */}
      <header className="h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Hostech V2</h1>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.full_name}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="flex-1 flex flex-col items-center p-6 md:p-16 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-4 border border-indigo-100 dark:border-indigo-800/30">
              <LayoutGrid className="w-3.5 h-3.5" />
              WORKSPACE SELECTION
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">
              {title}
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
              {subtitle}
            </p>
          </motion.div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="p-8 text-center border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          &copy; 2026 Hostech Systems. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
