import React from 'react';
import { Input, Select, Button, Tooltip } from 'antd';
import { Search, X, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string | number;
}

export interface FilterConfig {
  key: string;
  placeholder: string;
  type: 'select';
  options?: FilterOption[];
  loading?: boolean;
  allowClear?: boolean;
  width?: number | string;
}

interface FilterBarProps {
  searchText?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onClearAll?: () => void;
  extra?: React.ReactNode;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchText,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearAll,
  extra,
}) => {
  const hasFilters = Object.values(filterValues).some(v => v !== undefined && v !== null && v !== '');
  const hasSearch = !!searchText;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-gray-200/50 p-4 rounded-2xl shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {onSearchChange && (
          <Input
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full md:w-64 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 py-2 shadow-sm"
            allowClear
          />
        )}

        {filters.map((filter) => (
          <Select
            key={filter.key}
            placeholder={filter.placeholder}
            value={filterValues[filter.key]}
            onChange={(val) => onFilterChange?.(filter.key, val)}
            options={filter.options}
            loading={filter.loading}
            allowClear={filter.allowClear !== false}
            className="min-w-[150px]"
            style={{ width: filter.width }}
            variant="filled"
            suffixIcon={<Filter size={14} className="text-slate-400" />}
          />
        ))}

        {(hasFilters || hasSearch) && onClearAll && (
          <Tooltip title="Xóa tất cả bộ lọc">
            <Button
              type="text"
              icon={<X size={16} />}
              onClick={onClearAll}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1"
            >
              <span className="hidden sm:inline">Xóa lọc</span>
            </Button>
          </Tooltip>
        )}
      </div>

      {extra && (
        <div className="flex items-center gap-3">
          {extra}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
