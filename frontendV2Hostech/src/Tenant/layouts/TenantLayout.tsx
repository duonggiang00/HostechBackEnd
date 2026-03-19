import type { ReactNode } from 'react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { Bell } from 'lucide-react';
import TenantNav from '@/shared/features/navigation/components/TenantNav';

interface TenantLayoutProps {
  children: ReactNode;
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans sm:max-w-md sm:mx-auto sm:border-x sm:border-slate-200 shadow-xl overflow-hidden relative">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-lg font-black text-slate-900 tracking-tight">
          {user?.name?.split(' ')[0] || 'My Home'}
        </h1>
        <button className="relative w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
           <Bell className="w-5 h-5" />
           <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 pb-24">
          {children}
        </div>
      </main>

      <TenantNav />
    </div>
  );
}
