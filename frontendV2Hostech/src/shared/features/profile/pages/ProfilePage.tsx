import { useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  const { pathname } = useLocation();
  const orgConsole = pathname.startsWith('/org/');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div
          className={`h-12 w-12 animate-spin rounded-full border-4 border-t-transparent ${
            pathname.startsWith('/org/') ? 'border-emerald-500' : 'border-indigo-600'
          }`}
        />
      </div>
    );
  }

  if (!profile) return null;

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'info', label: 'Thông tin cá nhân', icon: User },
    { key: 'security', label: 'Bảo mật', icon: Lock },
  ];

  const kicker = orgConsole ? 'text-emerald-400' : 'text-indigo-600 dark:text-indigo-400';
  const title = orgConsole ? 'text-white' : 'text-slate-900 dark:text-white';
  const desc = orgConsole ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400';
  const panel = orgConsole
    ? 'rounded-3xl border border-white/10 bg-white/5'
    : 'rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
  const tabBar = orgConsole ? 'rounded-2xl bg-white/5 p-1 ring-1 ring-white/10' : 'rounded-2xl bg-slate-100 p-1 dark:bg-slate-800';
  const tabActive = orgConsole
    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
    : 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white';
  const tabIdle = orgConsole
    ? 'text-slate-500 hover:bg-white/10 hover:text-slate-300'
    : 'text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-slate-700/50';
  const sectionHeading = orgConsole ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400';
  const divider = orgConsole ? 'border-white/10' : 'border-slate-200 dark:border-slate-700';

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className={`mb-1 flex items-center gap-2 font-bold ${kicker}`}>
          <User className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Hồ sơ cá nhân</span>
        </div>
        <h1 className={`text-3xl font-black tracking-tight ${title}`}>Tài khoản của tôi</h1>
        <p className={`font-medium tracking-tight ${desc}`}>Quản lý thông tin cá nhân và cài đặt bảo mật</p>
      </div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 ${panel}`}>
        <AvatarUploader currentUrl={profile.avatar_url} userName={profile.full_name} />
      </motion.div>

      {/* Tab Bar */}
      <div className={`flex w-fit items-center gap-1 ${tabBar}`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                isActive ? tabActive : tabIdle
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
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
        className={`p-8 ${panel}`}
      >
        {activeTab === 'info' && <ProfileInfoForm profile={profile} />}

        {activeTab === 'security' && (
          <div className="space-y-10">
            {/* Password Section */}
            <div>
              <div className="mb-5 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-500" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${sectionHeading}`}>Đổi mật khẩu</h3>
              </div>
              <PasswordChangeForm />
            </div>

            <hr className={divider} />

            {/* 2FA Section */}
            <div>
              <div className="mb-5 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${sectionHeading}`}>Xác thực hai lớp</h3>
              </div>
              <TwoFactorSettings />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
