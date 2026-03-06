import React from 'react';

interface SidebarCategoryProps {
  label: string;
}

export const SidebarCategory: React.FC<SidebarCategoryProps> = ({ label }) => {
  return (
    <li className="sidebar-header px-6 py-4 text-[10.5px] font-bold text-[#64748b] uppercase tracking-[0.08em] whitespace-nowrap overflow-hidden transition-all duration-300">
      {label}
    </li>
  );
};
