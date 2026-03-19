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
    setAuth, 
    setLoginMode, 
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
  const [step, setStep] = useState<LoginStep>('IDENTIFY');

  useEffect(() => {
    let timer: any;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        decrementCooldown();
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown, decrementCooldown]);

  const validateIdentifier = () => {
    if (!identifier) {
      setError('Email or Phone is required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleIdentify = () => {
    if (!validateIdentifier()) return;
    
    setLoading(true);
    // Simulate API call to check user type
    setTimeout(() => {
      setLoading(false);
      // Admin/Owner/Manager/Staff -> Password
      // Tenant -> OTP (Default behavior for demo)
      const isStaffOrAdmin = identifier.includes('admin') || 
                            identifier.includes('owner') || 
                            identifier.includes('manager') || 
                            identifier.includes('staff') ||
                            identifier === 'admin@example.com';

      if (isStaffOrAdmin) {
        setLoginMode('password');
        setStep('PASSWORD');
      } else {
        setLoginMode('otp');
        setStep('OTP');
        startOtpCooldown(60);
      }
    }, 800);
  };

  const handlePasswordLogin = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Login — get lean user + token
      const data = await authApi.login({
        email: identifier,
        password: password,
      });

      const { token } = data;
      if (!token) throw new Error('No token returned from login');

      // Step 2: Store token temporarily so axios interceptor can use it for /auth/me
      useAuthStore.getState().setAuth(
        {
          id: data.user.id,
          full_name: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role,
          org_id: data.user.org_id,
          properties: [], // will be filled by fetchMe
          roles: data.user.roles ?? [],
        },
        token,
      );

      // Step 3: Fetch full user context (role, org_id, properties[] for Manager/Staff)
      const fullUser = await authApi.getMe();

      // Step 4: Replace store with full user data
      useAuthStore.getState().setAuth(fullUser, token);

      // Step 6: Navigate to root, where RootRedirect will dynamically route user based on their specific role
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOtpComplete = (otp: string) => {
    setLoading(true);
    setTimeout(() => {
      if (otp === '123456') { // Mock valid OTP
        const user = {
          id: 'tenant-01',
          full_name: 'Alex Johnson',
          email: identifier,
          role: 'Tenant' as const,
          org_id: null,
          properties: [],
          permissions: [],
        };
        setAuth(user, 'mock-tenant-token');
        navigate('/app');
      } else {
        setError('Invalid OTP code. Please try again.');
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md relative">
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-slate-100 p-10 relative overflow-hidden backdrop-blur-sm">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-50">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: step === 'IDENTIFY' ? '33%' : step === 'PASSWORD' || step === 'OTP' ? '100%' : '66%' }}
               className="h-full bg-indigo-600"
             />
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hostech <span className="text-indigo-600">V2</span></h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Smart Living Architecture</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'IDENTIFY' && (
              <motion.div
                key="identify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Enter your email or phone to continue</p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or Phone Number"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:border-indigo-100 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleIdentify}
                  disabled={isLoading}
                  className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                </button>
              </motion.div>
            )}

            {step === 'PASSWORD' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => setStep('IDENTIFY')}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Account
                </button>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-800">Administrative Login</h2>
                  <p className="text-sm text-slate-500">Account: <span className="font-bold text-slate-900">{identifier}</span></p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Security Password"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-3xl outline-none focus:border-indigo-100 focus:bg-white transition-all font-bold placeholder:text-slate-300"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <button
                  onClick={handlePasswordLogin}
                  disabled={isLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In Securely'}
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
                  onClick={() => setStep('IDENTIFY')}
                  className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Details
                </button>

                <div className="space-y-2 text-center">
                  <h2 className="text-xl font-bold text-slate-800">Verification Code</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We've sent a 6-digit code to <br/>
                    <span className="font-bold text-slate-900">{identifier}</span>
                  </p>
                </div>

                <OTPInput onComplete={handleOtpComplete} disabled={isLoading} />

                {error && (
                  <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <div className="text-center space-y-4 pt-4">
                   <button 
                     disabled={otpCooldown > 0}
                     onClick={() => startOtpCooldown(60)}
                     className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto disabled:text-slate-300 text-indigo-600 hover:text-slate-900 transition-colors"
                   >
                     <RefreshCw className={`w-4 h-4 ${otpCooldown > 0 ? '' : 'animate-spin-slow'}`} />
                     {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend Code Now'}
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 space-y-1">
          <p>Bank-Level Security Protocols</p>
          <p>© 2026 Hostech Solutions Inc.</p>
        </div>
      </div>
    </div>
  );
}
