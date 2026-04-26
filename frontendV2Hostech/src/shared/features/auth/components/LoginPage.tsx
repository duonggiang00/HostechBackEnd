import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import OTPInput from './OTPInput';
import { authApi } from '@/shared/features/auth/api/auth';
import type { LoginStep } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { 
    // setAuth, // Removed unused
    isLoading, 
    setLoading, 
    error, 
    setError,
    otpCooldown,
    startOtpCooldown,
    decrementCooldown
  } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<LoginStep>('LOGIN');

  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        decrementCooldown();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown, decrementCooldown]);

  const handleLogin = async () => {
    if (!identifier) {
      setError('Vui lòng nhập Email hoặc Số điện thoại.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login({
        email: identifier,
        password: password,
      });

      // Check if MFA is required
      if (data.two_factor) {
        setStep('OTP');
        setLoading(false);
        startOtpCooldown(60);
        return;
      }

      const { token, user } = data;
      if (!token) throw new Error('No token returned from login');

      // Set initial auth so subsequent requests (like getMe) have the token in headers
      useAuthStore.getState().setAuth({ ...user!, properties: [] } as any, token);

      // Fetch full user context with all relations (Manager -> properties, etc.)
      const fullUser = await authApi.getMe();
      
      // Update with consolidated user data
      useAuthStore.getState().setAuth(fullUser, token);

      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      
      if (err.response?.status === 401 || err.response?.status === 422) {
        errorMessage = 'Email, số điện thoại hoặc mật khẩu không chính xác.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOtpComplete = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call standard Fortify 2FA challenge endpoint
      const data = await authApi.loginChallenge({ code });
      
      const { token, user } = data;
      if (!token) throw new Error('No token returned from MFA');

      // Set initial auth for interceptor
      useAuthStore.getState().setAuth({ ...user!, properties: [] } as any, token);

      // Fetch full user context and set auth
      const fullUser = await authApi.getMe();
      useAuthStore.getState().setAuth(fullUser, token);
      
      navigate('/');
    } catch (err: any) {
      console.error('MFA error:', err);
      let errorMessage = 'Mã xác thực không hợp lệ hoặc đã hết hạn.';
      
      if (err.response?.status === 422) {
        errorMessage = 'Mã xác thực không chính xác.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 font-sans transition-colors">
      <div className="w-full max-w-lg relative">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl shadow-indigo-100/50 dark:shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 p-10 relative overflow-hidden backdrop-blur-sm transition-colors">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-700">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: step === 'LOGIN' ? '50%' : '100%' }}
               className="h-full bg-indigo-600 dark:bg-indigo-500"
             />
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hostech <span className="text-indigo-600 dark:text-indigo-400">V2</span></h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Smart Living Architecture</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'LOGIN' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Đăng nhập hệ thống</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Truy cập bảng điều khiển quản trị</p>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Email hoặc Số điện thoại"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-50 dark:border-slate-700 rounded-3xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleLogin();
                        }
                      }}
                      placeholder="Mật khẩu bảo mật"
                      className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-50 dark:border-slate-700 rounded-3xl outline-none focus:border-indigo-200 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ĐĂNG NHẬP<ArrowRight className="w-5 h-5" /></>}
                </button>
              </motion.div>
            )}

            {step === 'OTP' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <button 
                  onClick={() => setStep('LOGIN')}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mã xác thực</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Chúng tôi đã gửi mã gồm 6 chữ số đến <br/>
                    <span className="font-bold text-slate-900 dark:text-white">{identifier}</span>
                  </p>
                </div>

                <OTPInput onComplete={handleOtpComplete} disabled={isLoading} />

                {error && (
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <div className="text-center space-y-4 pt-4">
                   <button 
                     disabled={otpCooldown > 0}
                     onClick={() => startOtpCooldown(60)}
                     className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto disabled:text-slate-300 dark:disabled:text-slate-600 text-indigo-600 dark:text-indigo-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                   >
                     <RefreshCw className={`w-4 h-4 ${otpCooldown > 0 ? '' : 'animate-spin-slow'}`} />
                     {otpCooldown > 0 ? `Gửi lại mã sau ${otpCooldown}s` : 'Gửi lại mã xác thực'}
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 space-y-1 transition-colors">
          <p>Bank-Level Security Protocols</p>
          <p>© 2026 Hostech Solutions Inc.</p>
        </div>
      </div>
    </div>
  );
}
