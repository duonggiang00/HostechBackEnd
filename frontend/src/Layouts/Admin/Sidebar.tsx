import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown, ChevronRight, UserPen, House } from "lucide-react";
import { useOpenStore } from "../../shared/stores/openStore";
import { useTokenStore } from "../../features/auth/stores/authStore";
import Register from "../../features/auth/components/Register";
import Authorization from "../../features/auth/components/verifyLogin";
import { sidebarFlatItems, infrasItems, financeItems, userGroups } from "../../app/sidebar-config";
import type { SidebarItem } from "../../shared/types/navigation";
import { SidebarCategory } from "../../shared/components/SidebarCategory";

/**
 * SidebarAdmin — Fixed Icon Stability & Premium Navy Theme.
 * Icons are locked to the center of the collapsed width for zero shifting.
 */
const SidebarAdmin = () => {
  const { open, openRegister, setOpen, setOpenRegister } = useOpenStore();
  const location = useLocation();
  const role = useTokenStore((state) => state.roles)?.[0] ?? null;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    infras: true,
    finance: true,
    users: false,
  });

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (path?: string) => path && location.pathname === path;

  // Stable layout: mx-3 (12px) + w-[52px] icon zone = Center at 38px (half of 76px sidebar).
  // This ensures the icon NEVER moves horizontally during transition.
  const linkClass = (path?: string) =>
    `flex items-center mx-3 my-1 py-3 transition-all duration-300 rounded-xl group ${isActive(path)
      ? "bg-[#2563eb] text-white font-semibold shadow-lg shadow-blue-600/20"
      : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
    }`;

  const textTransitionClass = `transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${open ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[200px] ml-1"
    }`;

  const renderItem = (item: SidebarItem) => (
    <li key={item.key} className="sidebar-item list-none">
      <Link to={item.path ?? "#"} className={linkClass(item.path)}>
        <div className="shrink-0 flex items-center justify-center w-[52px]">
          <span className={`transition-colors duration-300 ${isActive(item.path) ? "text-white" : "text-[#94a3b8] group-hover:text-white"}`}>
            {item.icon}
          </span>
        </div>
        <span className={textTransitionClass + " text-[14px]"}>{item.label}</span>
      </Link>
    </li>
  );

  const renderStaticGroup = (label: string, items: SidebarItem[], key: string) => (
    <div key={key} className="sidebar-group">
      <div
        onClick={() => toggleGroup(key)}
        className={`flex items-center py-3 px-6 cursor-pointer text-[#64748b] hover:text-[#94a3b8] transition-all`}
      >
        <div className="flex items-center overflow-hidden flex-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] whitespace-nowrap">
            {open ? "..." : label}
          </span>
        </div>
        {!open && (
          <div className={`transition-transform duration-300 ${openGroups[key] ? 'rotate-0' : '-rotate-90'}`}>
            <ChevronDown size={14} />
          </div>
        )}
      </div>
      <div className={`transition-all duration-300 overflow-hidden ${openGroups[key] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
        {items.map(renderItem)}
      </div>
    </div>
  );

  const renderCollapsibleGroup = (group: any) => (
    <div key={group.key} className="sidebar-group">
      <div
        onClick={() => toggleGroup(group.key)}
        className={`flex items-center my-1 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${open ? "mx-3" : "mx-3 px-0"
          } ${openGroups[group.key] ? "text-white bg-[#1e293b]/50" : "text-[#94a3b8] hover:text-white hover:bg-[#1e293b]"
          }`}
      >
        <div className="shrink-0 flex items-center justify-center w-[52px]">
          <span className="shrink-0 opacity-80 group-hover:opacity-100">{group.icon}</span>
        </div>
        <div className="flex items-center overflow-hidden flex-1 text-[14px]">
          <span className={textTransitionClass}>{group.label}</span>
        </div>
        {!open && (
          <div className={`transition-all duration-300 pr-3 ${openGroups[group.key] ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown size={14} />
          </div>
        )}
      </div>
      <ul className={`sidebar-dropdown list-none p-0 m-0 transition-all duration-300 overflow-hidden ${open || !openGroups[group.key] ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 pb-2'
        }`}>
        {group.items.map((subItem: any) => (
          <li key={subItem.key}>
            <Link
              to={subItem.path}
              className={`flex items-center mx-3 my-0.5 py-2.5 pl-12 pr-3 rounded-xl text-[13px] transition-all duration-200 whitespace-nowrap ${isActive(subItem.path) ? "text-white bg-[#1e293b]" : "text-[#64748b] hover:text-white hover:bg-[#1e293b]"
                }`}
            >
              {subItem.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`h-screen bg-[#0f172a] flex flex-col transition-all duration-300 shadow-2xl overflow-hidden shrink-0 ${open ? "w-[76px]" : "w-[260px]"}`}>
      {/* Brand - Logic similar to icons for stability */}
      <div className="py-7 flex items-center shrink-0 overflow-hidden">
        <div className="shrink-0 flex items-center justify-center w-[76px]">
          <div className="bg-blue-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <House className="text-white" size={20} />
          </div>
        </div>
        <span className={`${textTransitionClass} text-white text-xl font-bold tracking-tight`}>
          Hostech<span className="text-blue-500">.</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto sidebar-nav custom-scrollbar hide-scrollbar overflow-x-hidden pt-2">
        <ul className="list-none p-0 m-0 pb-6">
          <SidebarCategory label={open ? "..." : "TỔNG QUAN"} />
          {sidebarFlatItems.map(renderItem)}

          {(() => {
            const filteredInfrasItems = infrasItems.filter(item => {
              if (role === "Owner" || role === "Admin") return !["floors", "rooms"].includes(item.key);
              if (role === "Manager" || role === "Staff") return !["property-list", "orgs"].includes(item.key);
              return true;
            });
            return renderStaticGroup("QUẢN LÝ HẠ TẦNG", filteredInfrasItems, "infras");
          })()}

          {renderStaticGroup("DỊCH VỤ & TÀI CHÍNH", financeItems, "finance")}

          <SidebarCategory label={open ? "..." : "CÀI ĐẶT"} />
          {userGroups.map(renderCollapsibleGroup)}
        </ul>
      </div>

      {/* Bottom Action & Toggle */}
      <div className={`p-4 border-t border-[#1e293b]/50 shrink-0 space-y-3 bg-[#0f172a]`}>
        {role && (
          <Authorization allowRole={["Admin", "Owner", "Manager"]}>
            <Register open={openRegister}>
              <button
                className={`flex items-center w-full py-3 rounded-xl bg-[#1e293b] hover:bg-[#2d3a4f] transition-all text-[#94a3b8] hover:text-white font-medium text-[13.5px] overflow-hidden group shadow-sm ${open ? "px-0" : "px-4"}`}
                onClick={() => setOpenRegister(true)}
              >
                <div className={`${open ? "w-full flex justify-center" : "shrink-0 mr-3"}`}>
                  <UserPen size={18} className="text-blue-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <span className={`transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${open ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}`}>
                  Thêm người thuê
                </span>
              </button>
            </Register>
          </Authorization>
        )}

        <button
          onClick={() => setOpen(!open)}
          className="w-full py-2.5 rounded-xl border border-[#1e293b] text-[#64748b] hover:text-white hover:bg-[#1e293b] transition-all flex items-center justify-center"
        >
          {open ? (
            <ChevronRight size={18} />
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap">
              <ChevronDown size={14} className="rotate-90" />
              Thu gọn
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default SidebarAdmin;
