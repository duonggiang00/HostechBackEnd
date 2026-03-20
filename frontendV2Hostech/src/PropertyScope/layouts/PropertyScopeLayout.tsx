import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { useParams } from 'react-router-dom';
import { 
  Building2, 
  DoorOpen, 
  Layers,
  LayoutDashboard,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Home,
  Gauge,
  User,
  FileText
} from 'lucide-react';
import PropertySwitcher from '@/OrgScope/features/properties/components/PropertySwitcher';
import PropertyTreeView from '@/OrgScope/features/properties/components/PropertyTreeView';
import { useDashboardHomePath } from '@/shared/hooks/useDashboardHomePath';
import { motion, AnimatePresence } from 'framer-motion';

interface PropertyScopeLayoutProps {
  children: ReactNode;
}

export default function PropertyScopeLayout({ children }: PropertyScopeLayoutProps) {
  const { user, logout } = useAuthStore();
  const { propertyId } = useParams<{ propertyId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dashboardPath = useDashboardHomePath(propertyId);

  const menuItems = [
    { id: 'home', icon: Home, label: 'Trang chủ', path: dashboardPath, exact: true },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: `/properties/${propertyId}/dashboard`, exact: true },
    { id: 'meters', icon: Gauge, label: 'Đồng hồ', path: `/properties/${propertyId}/meters` },
    { id: 'floors', icon: Layers, label: 'Floors', path: `/properties/${propertyId}/floors` },
    { id: 'rooms', icon: DoorOpen, label: 'Rooms', path: `/properties/${propertyId}/rooms` },
    { id: 'contracts', icon: FileText, label: 'Contracts', path: `/properties/${propertyId}/contracts` },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Hostech V2
          </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        <PropertySwitcher />
      </div>

      <nav className="px-4 py-2 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 mt-2 px-3">
           Property Scope
        </div>
        
        {propertyId ? menuItems.map((item) => (
          <NavLink 
            key={item.id}
            to={item.path}
            end={item.exact ?? false}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all ${
              isActive && item.id !== 'back-to-props'
                ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        )) : (
          <div className="px-3 py-2 text-sm text-slate-400 italic">No property selected</div>
        )}
      </nav>

      {/* Put Tree View under menus */}
      <div className="flex-1 px-2 py-4 border-t border-slate-100 overflow-y-auto custom-scrollbar">
         {propertyId && <PropertyTreeView />}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner uppercase">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.full_name || 'Guest'}</p>
            <p className="text-[10px] font-medium text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'No Role'}</p>
          </div>
          <NavLink 
            to={`/properties/${propertyId}/profile`}
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
            title="Hồ sơ cá nhân"
          >
            <User className="w-4 h-4" />
          </NavLink>
          <button 
            onClick={() => {
              logout();
              setIsMobileMenuOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3 md:gap-6 min-w-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-black text-slate-900 tracking-tight hidden xl:block">Property Management</h2>
            <div className="h-8 w-px bg-slate-100 hidden xl:block" />
            <div className="min-w-0">
              {/* Optional: we already have property switcher in the sidebar for property scope. But we can keep it here for mobile or consistency */}
              <div className="lg:hidden">
                <PropertySwitcher />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Global search..."
                className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-50 rounded-2xl outline-none focus:border-indigo-100 focus:bg-white transition-all text-sm font-bold w-48 lg:w-64 shadow-inner"
              />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer border border-slate-100 relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
