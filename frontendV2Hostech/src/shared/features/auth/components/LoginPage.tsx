import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import OTPInput from './OTPInput';
import { authApi } from '@/shared/features/auth/api/auth';
import type { LoginStep } from '../types';
import { authUserFromLoginPayload, withProfileLoaded } from '../utils/sessionUser';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    setLoading,
    error,
    setError,
    otpCooldown,
    startOtpCooldown,
    decrementCooldown,
  } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<LoginStep>('LOGIN');
  const [availableMethods, setAvailableMethods] = useState<('totp' | 'email')[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'email' | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);

  // Cooldown timer for email OTP resend
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (otpCooldown > 0) {
      timer = setInterval(() => decrementCooldown(), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [otpCooldown, decrementCooldown]);
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!identifier) { setError('Email hoặc Số điện thoại là bắt buộc'); return; }
    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }

    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login({ email: identifier, password });

      if (data.two_factor) {
        const methods = data.available_methods ?? (data.method ? [data.method as 'totp' | 'email'] : ['totp']);
        setAvailableMethods(methods);
        setChallengeToken(data.challenge_token ?? null);

        // Skip picker if only one method
        if (methods.length === 1) {
          await activateMethod(methods[0], data.challenge_token ?? null);
        } else {
          setStep('METHOD_PICK');
        }
        setLoading(false);
        return;
      }

      await finishLogin(data.token!, data.user!);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
      setLoading(false);
    }
  };

  // ─── Activate chosen method ───────────────────────────────────────────────
  const activateMethod = async (method: 'totp' | 'email', token?: string | null) => {
    setSelectedMethod(method);
    const ct = token ?? challengeToken;
    if (method === 'email') {
      setRequestingOtp(true);
      try {
        if (ct) await authApi.requestChallengeOtp(ct);
        startOtpCooldown(60);
      } catch {
        setError('Không thể gửi OTP. Vui lòng thử lại.');
      } finally {
        setRequestingOtp(false);
      }
      setStep('OTP_EMAIL');
    } else {
      setStep('OTP_TOTP');
    }
  };

  // ─── OTP challenge submit ─────────────────────────────────────────────────
  const handleOtpComplete = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.loginChallenge({
        challenge_token: challengeToken ?? '',
        code,
        method: selectedMethod ?? undefined,
      });

      const { token, user } = data;
      if (!token) throw new Error('Không nhận được token.');
      if (!user) throw new Error('Không nhận được thông tin người dùng.');
      await finishLogin(token, user);
    } catch (err: any) {
      const msg = err.response?.data?.errors?.code?.[0]
        || err.response?.data?.message
        || err.message
        || 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setRequestingOtp(true);
    try {
      if (challengeToken) await authApi.requestChallengeOtp(challengeToken);
      startOtpCooldown(60);
    } catch {
      setError('Không thể gửi lại OTP. Vui lòng thử lại sau.');
    } finally {
      setRequestingOtp(false);
    }
  };

  // ─── Finalize auth ────────────────────────────────────────────────────────
  const finishLogin = async (token: string, user: any) => {
    useAuthStore.getState().setAuth(authUserFromLoginPayload(user), token);
    const fullUser = await authApi.getMe();
    useAuthStore.getState().setAuth(withProfileLoaded(fullUser), token);
    navigate('/');
  };

  // ─── UI helpers ──────────────────────────────────────────────────────────
  const isOtpStep = step === 'OTP_TOTP' || step === 'OTP_EMAIL' || step === 'OTP';

  return (
    <div
      lang="vi"
      className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-sans transition-colors [font-feature-settings:'kern'_1]"
    >
      <div className="w-full max-w-lg relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl shadow-indigo-100/50 dark:shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 p-10 relative overflow-hidden backdrop-blur-sm transition-colors">
          <div className="mb-10 flex flex-col items-center text-center gap-0">
            <div className="flex shrink-0 items-center justify-center leading-none">
              <img
                src="/hostech-logo.png"
                alt="Hostech"
                className="h-[6.5rem] w-[6.5rem] object-contain block"
                width={104}
                height={104}
              />
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Hostech <span className="text-indigo-600 dark:text-indigo-400">V2</span>
            </h1>
            {step === 'LOGIN' && (
              <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                Đăng nhập quản trị
              </h2>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Login ── */}
            {step === 'LOGIN' && (
              <motion.div key="login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Tài khoản"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-50 dark:border-slate-700 rounded-3xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-semibold text-slate-900 dark:text-white placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-normal"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                      placeholder="Mật khẩu"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-50 dark:border-slate-700 rounded-3xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-semibold text-slate-900 dark:text-white placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-normal"
                    />
                  </div>
                </div>

                {error && <ErrorBanner message={error} />}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Đăng nhập <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Method picker ── */}
            {step === 'METHOD_PICK' && (
              <motion.div key="method_pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <button onClick={() => setStep('LOGIN')} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Xác thực 2 lớp</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chọn phương thức xác thực để tiếp tục:</p>
                </div>

                <div className="space-y-3">
                  {availableMethods.includes('totp') && (
                    <button
                      onClick={() => activateMethod('totp', challengeToken)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-left"
                    >
                      <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Ứng dụng xác thực (TOTP)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nhập mã 6 số từ Google Authenticator hoặc Authy.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </button>
                  )}

                  {availableMethods.includes('email') && (
                    <button
                      onClick={() => activateMethod('email', challengeToken)}
                      disabled={requestingOtp}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all text-left disabled:opacity-60"
                    >
                      <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {requestingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Mã OTP qua Email</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Nhận mã 6 số qua email đăng ký của bạn.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                    </button>
                  )}
                </div>

                {error && <ErrorBanner message={error} />}
              </motion.div>
            )}

            {/* ── Step 3a: TOTP Input ── */}
            {step === 'OTP_TOTP' && (
              <motion.div key="otp_totp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <button
                  onClick={() => setStep(availableMethods.length > 1 ? 'METHOD_PICK' : 'LOGIN')}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mã xác thực TOTP</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Nhập mã 6 số từ ứng dụng xác thực của bạn.
                  </p>
                </div>

                <OTPInput onComplete={handleOtpComplete} disabled={isLoading} />

                {error && <ErrorBanner message={error} />}
              </motion.div>
            )}

            {/* ── Step 3b: Email OTP Input ── */}
            {(step === 'OTP_EMAIL' || step === 'OTP') && (
              <motion.div key="otp_email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <button
                  onClick={() => setStep(availableMethods.length > 1 ? 'METHOD_PICK' : 'LOGIN')}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mã xác thực Email</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Chúng tôi đã gửi mã 6 chữ số đến<br />
                    <span className="font-bold text-slate-900 dark:text-white">{identifier}</span>
                  </p>
                </div>

                <OTPInput onComplete={handleOtpComplete} disabled={isLoading} />

                {error && <ErrorBanner message={error} />}

                <div className="text-center pt-2">
                  <button
                    disabled={otpCooldown > 0 || requestingOtp}
                    onClick={handleResendOtp}
                    className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto disabled:text-slate-300 dark:disabled:text-slate-600 text-indigo-600 dark:text-indigo-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {requestingOtp
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <RefreshCw className="w-4 h-4" />}
                    {otpCooldown > 0 ? `Gửi lại sau ${otpCooldown}s` : 'Gửi lại mã'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold">{message}</span>
    </div>
  );
}
