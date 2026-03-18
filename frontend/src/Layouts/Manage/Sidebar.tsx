import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, ChevronRight, UserPen, House } from "lucide-react";
import { useOpenStore } from "../../shared/stores/openStore";
import { useTokenStore } from "../../features/auth/stores/authStore";
import Register from "../../features/auth/components/Register";
import { RoleGuard } from "../../shared/components/RoleGuard";
import { sidebarFlatItems, infrasItems, financeItems, userGroups } from "../../app/sidebar-config";
import type { SidebarItem } from "../../shared/types/navigation";
import { motion } from "framer-motion";

/**
 * SidebarAdmin — Refined Premium Navy Theme.
 * Focuses on high-craft spacing, subtle gradients, and sophisticated typography.
 */
const SidebarAdmin = () => {
  const { open, openRegister, setOpen, setOpenRegister } = useOpenStore();
  const location = useLocation();
  const roles = useTokenStore((state) => state.roles);
  const role = roles?.[0] ?? null;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    infras: true,
    finance: true,
    users: false,
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (path?: string) => path && location.pathname === path;

  const linkClass = (path?: string) =>
    `flex items-center mx-3 my-0.5 py-3 transition-all duration-300 rounded-xl group relative ${
      isActive(path)
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-900/40 translate-x-1"
        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    }`;

  const textClass = `transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
    open ? "opacity-0 max-w-0 ml-0" : "opacity-100 max-w-[200px] ml-2"
  }`;

  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles || itemRoles.length === 0) return true;
    if (!roles) return false;
    return roles.some((r) => itemRoles.includes(r));
  };

  const renderItem = (item: SidebarItem) => {
    if (!hasAccess(item.roles)) return null;
    return (
      <li key={item.key} className="sidebar-item list-none">
        <Link to={item.path ?? "#"} className={linkClass(item.path)}>
          <div className="shrink-0 flex items-center justify-center w-[52px]">
            <span className={`transition-all duration-300 ${isActive(item.path) ? "text-white scale-110" : "text-slate-500 group-hover:text-blue-400 group-hover:scale-110"}`}>
              {item.icon}
            </span>
          </div>
          <span className={textClass + " text-[13.5px] tracking-wide"}>
            {role === "Tenant" && item.key === "room-list" ? "Phòng của tôi" : item.label}
          </span>
          {isActive(item.path) && !open && (
             <motion.div 
               layoutId="active-pill"
               className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
             />
          )}
        </Link>
      </li>
    );
  };

  const renderStaticGroup = (label: string, items: SidebarItem[], key: string) => {
    const visibleItems = items.filter((item) => hasAccess(item.roles));
    if (visibleItems.length === 0) return null;

    return (
      <div key={key} className="sidebar-group mt-6">
        <div 
          onClick={() => toggleGroup(key)}
          className="flex items-center py-2 px-6 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <div className="flex items-center overflow-hidden flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">
                {open ? "•••" : label}
            </span>
          </div>
          {!open && (
             <div className={`transition-transform duration-300 ${openGroups[key] ? 'rotate-0' : '-rotate-90'}`}>
               <ChevronDown size={12} strokeWidth={3} />
             </div>
          )}
        </div>
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
          openGroups[key] ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}>
          {visibleItems.map(renderItem)}
        </div>
      </div>
    );
  };

  const renderCollapsibleGroup = (group: any) => {
    if (!hasAccess(group.roles)) return null;
    const visibleItems = group.items.filter((item: any) => hasAccess(item.roles));
    if (visibleItems.length === 0) return null;

    return (
      <div key={group.key} className="sidebar-group">
        <div 
          onClick={() => toggleGroup(group.key)}
          className={`flex items-center mx-3 my-1 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
            openGroups[group.key] ? "text-white bg-slate-800/40" : "text-slate-400 hover:text-white hover:bg-slate-800/30"
          }`}
        >
          <div className="shrink-0 flex items-center justify-center w-[52px]">
            <span className={`transition-all ${openGroups[group.key] ? 'text-blue-400' : 'opacity-70 group-hover:opacity-100'}`}>
              {group.icon}
            </span>
          </div>
          <div className="flex items-center overflow-hidden flex-1 text-[13.5px] font-medium">
            <span className={textClass}>{group.label}</span>
          </div>
          {!open && (
             <div className={`transition-all duration-300 pr-3 ${openGroups[group.key] ? 'rotate-180 text-blue-400' : 'rotate-0 opacity-50'}`}>
               <ChevronDown size={14} />
             </div>
          )}
        </div>
        <ul className={`sidebar-dropdown list-none p-0 m-0 transition-all duration-300 overflow-hidden ${
          open || !openGroups[group.key] ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 pb-2'
        }`}>
          {visibleItems.map((subItem: any) => (
             <li key={subItem.key}>
               <Link 
                 to={subItem.path} 
                 className={`flex items-center mx-3 my-0.5 py-2.5 pl-12 pr-3 rounded-xl text-[13px] transition-all duration-200 whitespace-nowrap group ${
                    isActive(subItem.path) ? "text-white bg-blue-600/10 font-medium" : "text-slate-500 hover:text-blue-300 hover:bg-slate-800/30"
                 }`}
               >
                 <span className={`w-1.5 h-1.5 rounded-full mr-3 transition-all ${isActive(subItem.path) ? "bg-blue-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-slate-700 group-hover:bg-slate-500"}`} />
                 {subItem.label}
               </Link>
             </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={`h-screen bg-[#020617] border-r border-slate-800/50 flex flex-col transition-all duration-500 shadow-2xl overflow-hidden shrink-0 ${open ? "w-[80px]" : "w-[280px]"}`}>
      {/* Brand */}
      <div className="py-8 flex items-center shrink-0 overflow-hidden">
        <div className="shrink-0 flex items-center justify-center w-[80px]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-slate-900 p-2.5 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-xl">
              <House className="text-blue-500 group-hover:text-blue-400 transition-colors" size={24} />
            </div>
          </div>
        </div>
        <div className={textClass}>
           <h1 className="text-white text-2xl font-black tracking-tight flex items-center">
             Hostech<span className="text-blue-500">.</span>
             { (role === 'Admin' || role === 'Owner') && (
               <div className="ml-2 px-1.5 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded text-[8px] text-white font-bold shadow-lg shadow-orange-950/20">
                 PRO
               </div>
             )}
           </h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto sidebar-nav custom-scrollbar hide-scrollbar overflow-x-hidden pt-4 px-1">
        <ul className="list-none p-0 m-0 pb-10">
          {sidebarFlatItems.some((item) => hasAccess(item.roles)) && (
            <div className="px-6 mb-2">
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                 {open ? "•••" : "Tổng quan"}
               </span>
            </div>
          )}
          {sidebarFlatItems.map(renderItem)}

          {renderStaticGroup("Cơ sở hạ tầng", infrasItems, "infras")}
          
          {renderStaticGroup("Tài chính & Dịch vụ", financeItems, "finance")}

          {userGroups.some((group) => hasAccess(group.roles)) && (
            <div className="px-6 mb-2 mt-8">
               <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                 {open ? "•••" : "Hệ thống"}
               </span>
            </div>
          )}
          {userGroups.map(renderCollapsibleGroup)}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-950/50 border-t border-slate-900/50 shrink-0 space-y-3">
          {role && (
            <RoleGuard allowedRoles={["Admin", "Owner", "Manager"]}>
                <Register open={openRegister}>
                  <button
                    className={`flex items-center w-full py-3.5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-blue-500/50 transition-all text-slate-300 hover:text-white font-semibold text-[13px] overflow-hidden group shadow-xl ${open ? "justify-center" : "px-4"}`}
                    onClick={() => setOpenRegister(true)}
                  >
                    <div className={`${open ? "" : "mr-3"}`}>
                        <UserPen size={18} className="text-blue-500 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                    </div>
                    {!open && <span>Thêm khách hàng</span>}
                  </button>
                </Register>
            </RoleGuard>
          )}

          <button 
            onClick={() => setOpen(!open)}
            className="w-full py-3 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 text-slate-500 hover:text-slate-200 border border-slate-800/50 transition-all flex items-center justify-center group"
          >
            {open ? (
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]"> 
                 <ChevronLeft size={14} className="opacity-50" /> 
                 Thu gọn 
              </div>
            )}
          </button>
      </div>
    </div>
  );
};

// Simple ChevronLeft for inner use
const ChevronLeft = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m15 18-6-6 6-6"/>
    </svg>
);

export default SidebarAdmin;
