import { useState } from 'react';
import { useMfaStatus, useDisableMfa } from '../hooks/useTwoFactor';

import { Shield, ShieldCheck, ShieldOff, Loader2, Eye, EyeOff } from 'lucide-react';
import TwoFactorSetupDialog from './TwoFactorSetupDialog';

export default function TwoFactorSettings() {
  const { data: mfa, isLoading } = useMfaStatus();
  const disableMfa = useDisableMfa();
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  const isEnabled = mfa?.two_factor_enabled || mfa?.mfa_enabled;

  const handleEnable = () => {
    setShowSetupDialog(true);
  };

  const handleDisableClick = () => {
    setShowDisableForm(true);
  };

  const handleDisableConfirm = () => {
    disableMfa.mutate(disablePassword, {
      onSuccess: () => {
        setShowDisableForm(false);
        setDisablePassword('');
      },
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              isEnabled
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            {isEnabled ? <ShieldCheck className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Xác thực hai lớp (2FA)</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isEnabled
                ? 'Tài khoản được bảo vệ bởi ứng dụng xác thực (TOTP).'
                : 'Thêm một lớp bảo mật cho tài khoản bằng ứng dụng xác thực như Google Authenticator.'}
            </p>

            {isEnabled && mfa?.mfa_method && (
              <span className="inline-flex items-center mt-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Đang bật — {mfa.mfa_method.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {!showDisableForm && (
          <button
            type="button"
            onClick={isEnabled ? handleDisableClick : handleEnable}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl transition-all text-sm ${
              isEnabled
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/25'
            }`}
          >
            {isEnabled ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {isEnabled ? 'Tắt 2FA' : 'Bật 2FA'}
          </button>
        )}
      </div>

      {/* Disable form — requires password */}
      {showDisableForm && (
        <div className="mt-4 p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 space-y-4">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            Nhập mật khẩu tài khoản để xác nhận tắt xác thực 2 lớp:
          </p>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Mật khẩu"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-red-200 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDisableConfirm}
              disabled={!disablePassword || disableMfa.isPending}
              className="flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
            >
              {disableMfa.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận tắt
            </button>
            <button
              onClick={() => { setShowDisableForm(false); setDisablePassword(''); }}
              className="px-5 py-2.5 font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {showSetupDialog && (
        <TwoFactorSetupDialog onClose={() => setShowSetupDialog(false)} />
      )}
    </>
  );
}
