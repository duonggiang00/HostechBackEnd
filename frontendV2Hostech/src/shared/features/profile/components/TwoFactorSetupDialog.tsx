import { useState, useEffect } from 'react';
import { useInitializeMfa, useEnableMfa } from '../hooks/useTwoFactor';
import { X, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface TwoFactorSetupDialogProps {
  onClose: () => void;
}

type Step = 'qr' | 'confirm';

export default function TwoFactorSetupDialog({ onClose }: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<Step>('qr');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const initializeMfa = useInitializeMfa();
  const enableMfa = useEnableMfa();

  // Auto-initialize TOTP on mount
  useEffect(() => {
    initializeMfa.mutate('totp');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    enableMfa.mutate(
      { method: 'totp', code, password },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {step === 'qr' && 'Quét mã QR'}
            {step === 'confirm' && 'Xác nhận kích hoạt'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Step: QR Code */}
        {step === 'qr' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mở ứng dụng xác thực (Google Authenticator, Authy...) và quét mã QR bên dưới.
            </p>

            <div className="flex justify-center p-6 bg-white rounded-2xl border border-slate-200">
              {initializeMfa.isPending ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              ) : initializeMfa.data?.qr_code_svg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: initializeMfa.data.qr_code_svg }}
                  className="[&_svg]:w-48 [&_svg]:h-48"
                />
              ) : initializeMfa.isError ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-500">Không thể tải mã QR.</p>
                  <button
                    onClick={() => initializeMfa.mutate('totp')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Đang tải...</p>
              )}
            </div>

            {initializeMfa.data?.secret_key && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Hoặc nhập mã thủ công:
                </p>
                <p className="font-mono text-sm text-slate-900 dark:text-white break-all select-all">
                  {initializeMfa.data.secret_key}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('confirm')}
              disabled={!initializeMfa.data?.qr_code_svg}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {/* Step: Confirm Code + Password */}
        {step === 'confirm' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nhập mã 6 chữ số từ ứng dụng xác thực và mật khẩu tài khoản để hoàn tất.
            </p>

            {/* TOTP Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mã xác thực (6 chữ số)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full text-center text-3xl tracking-[0.5em] px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mật khẩu tài khoản
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu để xác nhận"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={code.length !== 6 || !password || enableMfa.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enableMfa.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Kích hoạt 2FA
            </button>

            <button
              onClick={() => setStep('qr')}
              className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              ← Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
