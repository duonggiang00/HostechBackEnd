import React, { useState, useEffect } from 'react';
import { ChevronDown, Building2, Home, Check } from 'lucide-react';
import { useOrgs } from '../../organizations/hooks/useOrg';
import { useOrgStore } from '../../organizations/stores/orgStore';
import { useProperties } from '../hooks/useProperties';
import { usePropertyStore } from '../stores/propertyStore';
import { useTokenStore } from '../../auth/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { PropertyDTO } from '../types';

export const PremiumContextSwitcher: React.FC = () => {
    const orgId = useTokenStore((state) => state.org_id);
    const { data: orgs } = useOrgs(orgId);
    const { activeOrg, setActiveOrg } = useOrgStore();
    const { activeProperty, setActiveProperty } = usePropertyStore();
    
    // Properties are typically paginated, we need the .data array
    const { data: propertiesResponse } = useProperties({ filter: { org_id: activeOrg?.id } });
    const properties = (propertiesResponse as any)?.data as PropertyDTO[] | undefined;

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'org' | 'prop'>('org');

    // Auto-select first org if none
    useEffect(() => {
        if (!activeOrg && orgs && orgs.length > 0) {
            setActiveOrg(orgs[0]);
        }
    }, [orgs, activeOrg, setActiveOrg]);

    // Auto-select first property when org changes
    useEffect(() => {
        if (properties && properties.length > 0) {
            if (!activeProperty || !properties.find((p: PropertyDTO) => p.id === activeProperty.id)) {
                setActiveProperty(properties[0]);
            }
        } else if (properties && properties.length === 0) {
            setActiveProperty(null);
        }
    }, [properties, activeOrg, activeProperty, setActiveProperty]);

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-3 px-4 py-2 bg-gray-100/50 hover:bg-white border border-gray-200 rounded-2xl cursor-pointer transition-all group shadow-sm"
            >
                <div className="flex flex-col items-start min-w-[120px]">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                        {activeOrg?.name || "Chọn Tổ chức"}
                    </span>
                    <span className="text-sm text-gray-900 font-medium truncate max-w-[150px]">
                        {activeProperty?.name || "Chọn Nhà trọ"}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-[280px] bg-white border border-gray-200 rounded-2xl shadow-2xl p-2 z-[100]"
                    >
                        <div className="flex gap-1 p-1 mb-2 bg-gray-50 rounded-xl border border-gray-100">
                            <button
                                onClick={() => setView('org')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'org' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                            >
                                Tổ chức
                            </button>
                            <button
                                onClick={() => setView('prop')}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'prop' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                            >
                                Nhà trọ
                            </button>
                        </div>

                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                            {view === 'org' ? (
                                orgs?.map((org) => (
                                    <button
                                        key={org.id}
                                        onClick={() => {
                                            setActiveOrg(org);
                                            setView('prop');
                                        }}
                                        className="w-full flex items-center justify-between p-3 mb-1 rounded-xl hover:bg-gray-50 transition-all text-left group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <Building2 size={16} />
                                            </div>
                                            <span className={`text-[13.5px] font-medium ${activeOrg?.id === org.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {org.name}
                                            </span>
                                        </div>
                                        {activeOrg?.id === org.id && <Check size={14} className="text-blue-600" />}
                                    </button>
                                ))
                            ) : (
                                properties?.map((prop) => (
                                    <button
                                        key={prop.id}
                                        onClick={() => {
                                            setActiveProperty(prop);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 mb-1 rounded-xl hover:bg-gray-50 transition-all text-left group border border-transparent hover:border-gray-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Home size={16} />
                                            </div>
                                            <span className={`text-[13.5px] font-medium ${activeProperty?.id === prop.id ? 'text-indigo-600' : 'text-gray-700'}`}>
                                                {prop.name}
                                            </span>
                                        </div>
                                        {activeProperty?.id === prop.id && <Check size={14} className="text-indigo-600" />}
                                    </button>
                                ))
                            )}
                            {view === 'prop' && (!properties || properties.length === 0) && (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-xs text-gray-500 font-medium">Chưa có nhà trọ nào</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
