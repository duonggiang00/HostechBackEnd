import React, { useState, useEffect, useRef } from 'react';
import { useUsers, type User } from '@/shared/features/auth/hooks/useUsers';
import { Search, User as UserIcon, Check, Loader2, X } from 'lucide-react';

interface UserSearchComboboxProps {
  onSelect: (user: User | null) => void;
  selectedUserId?: string | null;
  placeholder?: string;
  className?: string;
}

export function UserSearchCombobox({ onSelect, selectedUserId, placeholder = 'Tìm kiếm SĐT, Tên, Email...', className = '' }: UserSearchComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useUsers(undefined, 1, 10, debouncedSearch);
  const users = data?.data || [];

  const selectedUser = users.find(u => u.id === selectedUserId) || null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div 
        className={`flex items-center gap-2 border-b-2 border-dashed border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 px-2 py-1 cursor-text transition-colors rounded-sm focus-within:border-indigo-600 focus-within:bg-indigo-50 dark:focus-within:bg-indigo-800/30 ${selectedUserId ? 'border-emerald-400 bg-emerald-50/60' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-3.5 h-3.5 text-indigo-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (selectedUserId) onSelect(null);
          }}
          placeholder={selectedUserId ? 'Đã liên kết tài khoản (nhập để đổi)' : placeholder}
          className="bg-transparent outline-none text-sm text-indigo-900 dark:text-indigo-200 placeholder:text-indigo-300 w-full"
        />
        {selectedUserId && (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm('');
              onSelect(null);
            }}
            className="p-0.5 hover:bg-indigo-200/50 rounded-full text-indigo-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[250px] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center italic">
              Không tìm thấy tài khoản nào.
            </div>
          ) : (
            <div className="py-1">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelect(user);
                    setSearchTerm(user.email || user.phone || user.full_name);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.phone} • {user.email}
                    </p>
                  </div>
                  {selectedUserId === user.id && (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
