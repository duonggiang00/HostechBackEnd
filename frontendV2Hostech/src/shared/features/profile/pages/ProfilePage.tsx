import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import AvatarUploader from '../components/AvatarUploader';
import ProfileInfoForm from '../components/ProfileInfoForm';
import PasswordChangeForm from '../components/PasswordChangeForm';
import TwoFactorSettings from '../components/TwoFactorSettings';
import { User, Lock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

type Tab = 'info' | 'security';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'info', label: 'Thông tin cá nhân', icon: User },
    { key: 'security', label: 'Bảo mật', icon: Lock },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
          <User className="w-4 h-4" />
          <span className="text-xs uppercase tracking-widest">Hồ sơ cá nhân</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Tài khoản của tôi
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
          Quản lý thông tin cá nhân và cài đặt bảo mật
        </p>
      </div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <AvatarUploader currentUrl={profile.avatar_url} userName={profile.full_name} />
      </motion.div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        {activeTab === 'info' && <ProfileInfoForm profile={profile} />}

        {activeTab === 'security' && (
          <div className="space-y-10">
            {/* Password Section */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Đổi mật khẩu
                </h3>
              </div>
              <PasswordChangeForm />
            </div>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* 2FA Section */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Xác thực hai lớp
                </h3>
              </div>
              <TwoFactorSettings />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
