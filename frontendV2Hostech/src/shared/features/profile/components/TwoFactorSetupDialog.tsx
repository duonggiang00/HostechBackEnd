import { useState, useEffect, useRef } from 'react';
import { useInitializeMfa, useEnableMfa } from '../hooks/useTwoFactor';
import { X, Loader2, ShieldCheck, Eye, EyeOff, Smartphone, Mail, RefreshCw } from 'lucide-react';

interface TwoFactorSetupDialogProps {
  /** Pre-select a method instead of showing the picker */
  initialMethod?: 'totp' | 'email';
  onClose: () => void;
}

type Step = 'pick' | 'totp_qr' | 'totp_confirm' | 'email_otp';

export default function TwoFactorSetupDialog({ initialMethod, onClose }: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<Step>(initialMethod ? (initialMethod === 'email' ? 'email_otp' : 'totp_qr') : 'pick');
  const [method, setMethod] = useState<'totp' | 'email'>(initialMethod ?? 'totp');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initializeMfa = useInitializeMfa();
  const enableMfa = useEnableMfa();

  // Trigger initialization when entering a method step
  useEffect(() => {
    if (step === 'totp_qr') {
      initializeMfa.mutate('totp');
    } else if (step === 'email_otp') {
      initializeMfa.mutate('email');
      startCooldown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = (seconds = 60) => {
    setEmailCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setEmailCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = () => {
    initializeMfa.mutate('email');
    startCooldown();
  };

  const handlePickMethod = (picked: 'totp' | 'email') => {
    setMethod(picked);
    setCode('');
    setPassword('');
    setStep(picked === 'email' ? 'email_otp' : 'totp_qr');
  };

  const handleConfirm = () => {
    enableMfa.mutate(
      { method, code, password },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {step === 'pick' && 'Chọn phương thức 2FA'}
            {step === 'totp_qr' && 'Quét mã QR'}
            {step === 'totp_confirm' && 'Xác nhận kích hoạt TOTP'}
            {step === 'email_otp' && 'Xác nhận qua Email'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Step: Pick method */}
        {step === 'pick' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chọn cách xác thực bạn muốn thêm vào tài khoản:
            </p>
            {([
              { key: 'totp' as const, Icon: Smartphone, label: 'Ứng dụng xác thực (TOTP)', desc: 'Google Authenticator, Authy...' },
              { key: 'email' as const, Icon: Mail, label: 'Mã OTP qua Email', desc: 'Nhận mã 6 số qua email mỗi lần đăng nhập.' },
            ]).map(({ key, Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => handlePickMethod(key)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-left"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: TOTP QR */}
        {step === 'totp_qr' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mở ứng dụng xác thực và quét mã QR bên dưới.
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
                  <button onClick={() => initializeMfa.mutate('totp')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                    Thử lại
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Đang tải...</p>
              )}
            </div>

            {initializeMfa.data?.secret_key && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Hoặc nhập mã thủ công:</p>
                <p className="font-mono text-sm text-slate-900 dark:text-white break-all select-all">
                  {initializeMfa.data.secret_key}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('pick')}
                className="px-4 py-2.5 font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep('totp_confirm')}
                disabled={!initializeMfa.data?.qr_code_svg}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step: TOTP Confirm */}
        {step === 'totp_confirm' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nhập mã 6 chữ số từ ứng dụng xác thực và mật khẩu để hoàn tất.
            </p>

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

            <PasswordField value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('totp_qr')}
                className="px-4 py-2.5 font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirm}
                disabled={code.length !== 6 || !password || enableMfa.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {enableMfa.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Kích hoạt TOTP
              </button>
            </div>
          </div>
        )}

        {/* Step: Email OTP */}
        {step === 'email_otp' && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nhập mã OTP đã gửi đến email đăng ký của bạn và mật khẩu tài khoản để hoàn tất.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Mã OTP (6 chữ số)
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

            <div className="text-center">
              <button
                onClick={handleResendOtp}
                disabled={emailCooldown > 0 || initializeMfa.isPending}
                className="flex items-center justify-center gap-1.5 mx-auto text-xs font-bold text-indigo-600 dark:text-indigo-400 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {emailCooldown > 0 ? `Gửi lại sau ${emailCooldown}s` : 'Gửi lại OTP'}
              </button>
            </div>

            <PasswordField value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />

            <div className="flex gap-3">
              {!initialMethod && (
                <button
                  onClick={() => { setStep('pick'); setCode(''); setPassword(''); }}
                  className="px-4 py-2.5 font-bold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                >
                  Quay lại
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={code.length !== 6 || !password || enableMfa.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
              >
                {enableMfa.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Kích hoạt Email OTP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Mật khẩu tài khoản
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập mật khẩu để xác nhận"
          className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
