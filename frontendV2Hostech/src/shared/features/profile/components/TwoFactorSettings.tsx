import { useState } from 'react';
import { useMfaSetup, useDisableMfa } from '../hooks/useTwoFactor';
import { Shield, ShieldCheck, ShieldOff, Loader2, Smartphone, Mail, Eye, EyeOff } from 'lucide-react';
import TwoFactorSetupDialog from './TwoFactorSetupDialog';

type MethodKey = 'totp' | 'email';

const METHOD_META: Record<MethodKey, { label: string; description: string; Icon: typeof Shield }> = {
  totp: {
    label: 'Ứng dụng xác thực (TOTP)',
    description: 'Dùng Google Authenticator, Authy hoặc app tương tự để tạo mã 6 số.',
    Icon: Smartphone,
  },
  email: {
    label: 'Mã OTP qua Email',
    description: 'Nhận mã xác thực qua email đăng ký mỗi lần đăng nhập.',
    Icon: Mail,
  },
};

export default function TwoFactorSettings() {
  const { data: mfa, isLoading } = useMfaSetup();
  const disableMfa = useDisableMfa();

  const [setupMethod, setSetupMethod] = useState<MethodKey | null>(null);
  const [disablingMethod, setDisablingMethod] = useState<MethodKey | null>(null);
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

  const enabledMethods: MethodKey[] = (mfa?.enabled_methods ?? []) as MethodKey[];

  const handleDisableConfirm = () => {
    if (!disablingMethod) return;
    disableMfa.mutate({ password: disablePassword, method: disablingMethod }, {
      onSuccess: () => {
        setDisablingMethod(null);
        setDisablePassword('');
        setShowPassword(false);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Per-method status cards */}
      {(Object.keys(METHOD_META) as MethodKey[]).map((method) => {
        const { label, description, Icon } = METHOD_META[method];
        const isEnabled = enabledMethods.includes(method);
        const isDisabling = disablingMethod === method;

        return (
          <div key={method} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-start justify-between gap-6 p-5 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${isEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{label}</h4>
                    {isEnabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Đang bật
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
                </div>
              </div>

              {!isDisabling && (
                <button
                  type="button"
                  onClick={() => isEnabled ? setDisablingMethod(method) : setSetupMethod(method)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 font-bold rounded-xl transition-all text-xs ${isEnabled
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/25'}`}
                >
                  {isEnabled ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {isEnabled ? 'Tắt' : 'Bật'}
                </button>
              )}
            </div>

            {/* Inline disable confirmation */}
            {isDisabling && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-800 space-y-3">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                  Nhập mật khẩu để xác nhận tắt phương thức này:
                </p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Mật khẩu tài khoản"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-red-200 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisableConfirm}
                    disabled={!disablePassword || disableMfa.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 text-xs"
                  >
                    {disableMfa.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Xác nhận tắt
                  </button>
                  <button
                    onClick={() => { setDisablingMethod(null); setDisablePassword(''); setShowPassword(false); }}
                    className="px-4 py-2 font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Setup dialog for a specific method */}
      {setupMethod && (
        <TwoFactorSetupDialog
          initialMethod={setupMethod}
          onClose={() => setSetupMethod(null)}
        />
      )}
    </div>
  );
}
