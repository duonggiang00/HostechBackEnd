import { useForm } from "react-hook-form";
import { useOpenStore } from "../../../shared/stores/openStore";
import { Eye, EyeClosed, Loader, ShieldCheck, Building2, LayoutDashboard } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login, twoFactorChallenge } from "../api/authApi";
import type { ILogin } from "../types";
import { message } from "antd";
import { useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useTokenStore } from "../stores/authStore";
import { GlassCard } from "../../../shared/components/premium/GlassCard";
import { PremiumButton } from "../../../shared/components/premium/PremiumButton";

const AuthPage = () => {
  const { eyePassword, setEyePassword } = useOpenStore();
  const nav = useNavigate();
  const setToken = useTokenStore((state) => state.setToken);
  const { register, handleSubmit, reset } = useForm<ILogin>();
  const [pendingLogin, setPendingLogin] = useState<ILogin | null>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleAuthSuccess = (res: any) => {
    const { token, user } = res.data;
    const roles = user.roles || [];
    const permissions = user.permissions || [];
    const orgId = user.org_id || null;

    setToken(token, roles, permissions, orgId);
    message.success("Đăng nhập thành công! Chào bạn trở lại.");
    
    if (roles.some((r: string) => r.toLowerCase() === "tenant")) {
      nav("/manage/rooms");
    } else {
      nav("/manage");
    }

    reset({});
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      if (res.data.two_factor) {
        setShowTwoFactor(true);
        message.info("Vui lòng nhập mã xác thực 2 lớp");
        return;
      }
      handleAuthSuccess(res);
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422) {
        message.error("Thông tin đăng nhập không chính xác");
      } else if (status === 403) {
        message.error("Tài công đã bị khoá");
      } else if (status === 423) {
        message.warning(`Tài khoản bị khoá tạm thời đến ${data.locked_until}`);
      } else if (status === 409) {
        setOrgs(data.orgs);
      } else {
        message.error("Đã xảy ra lỗi, vui lòng thử lại sau");
      }
    },
  });

  const challengeMutation = useMutation({
    mutationFn: twoFactorChallenge,
    onSuccess: handleAuthSuccess,
    onError: () => message.error("Mã xác thực 2 lớp không hợp lệ"),
  });

  const handleLogin = (data: ILogin) => {
    setPendingLogin(data);
    loginMutation.mutate(data);
  };

  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    challengeMutation.mutate({ code: twoFactorCode });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center p-4">
      {/* Animated Abstract Background Bubbles */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-premium-indigo/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-premium-teal/20 blur-[120px] rounded-full animate-pulse" />

      <section className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Brand & Visuals */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col space-y-8 p-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 premium-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Hostech <span className="text-indigo-400">V2</span></h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Quản lý vận hành <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400 font-black">
                Thông minh & Tinh gọn
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Trải nghiệm hệ thống quản lý bất động sản cao cấp, tích hợp bảo mật 2 lớp và quản lý đa nền tảng cho chủ hộ và người thuê.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
              <ShieldCheck className="text-teal-400 mb-3" />
              <h4 className="text-white font-semibold">Bảo mật cao</h4>
              <p className="text-slate-500 text-sm">Xác thực OTP & 2FA chuẩn Enterprise</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
              <Building2 className="text-indigo-400 mb-3" />
              <h4 className="text-white font-semibold">Đa cơ sở</h4>
              <p className="text-slate-500 text-sm">Quản lý không giới hạn tổ chức & căn hộ</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Auth Container */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="w-full flex justify-center lg:justify-end"
        >
          <GlassCard className="w-full max-w-md bg-white/5 border-white/10 shadow-2xl p-10 relative overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
              {(loginMutation.isPending || challengeMutation.isPending) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4"
                >
                  <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
                  <span className="text-white font-medium">Đang xử lý...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-8 text-center lg:text-left">
              <h3 className="text-2xl font-bold text-white mb-2">Xin chào!</h3>
              <p className="text-slate-400">Vui lòng hoàn tất đăng nhập để truy cập hệ thống.</p>
            </div>

            <AnimatePresence mode="wait">
              {orgs.length > 0 ? (
                <motion.div 
                  key="org-selector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                     <p className="text-teal-400 text-sm font-semibold mb-4 bg-teal-400/10 py-2 rounded-xl">Bạn có nhiều tổ chức. Vui lòng chọn:</p>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {orgs.map((org) => (
                      <button
                        key={org.org_id}
                        onClick={() => {
                          if (!pendingLogin) return;
                          loginMutation.mutate({ ...pendingLogin, org_id: org.org_id });
                        }}
                        className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/50 transition-all group"
                      >
                         <div className="flex items-center justify-between">
                            <span className="text-white font-semibold">{org.org_name}</span>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                         </div>
                      </button>
                    ))}
                  </div>
                  <button 
                    className="w-full text-sm text-slate-500 hover:text-white transition-colors pt-4"
                    onClick={() => { setOrgs([]); setPendingLogin(null); }}
                  >
                    ← Trở lại
                  </button>
                </motion.div>
              ) : showTwoFactor ? (
                <motion.form 
                  key="2fa-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleTwoFactorSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <label className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Mã xác thực bảo mật</label>
                    <input
                      type="text"
                      placeholder="••••••"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-center text-3xl font-black text-white tracking-[0.5em] focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-800"
                      maxLength={6}
                      autoFocus
                    />
                     <p className="text-xs text-slate-500 italic">Mã 6 chữ số được gửi tới thiết bị cài đặt của bạn</p>
                  </div>
                  <PremiumButton type="submit" className="w-full py-4 text-lg">
                    Xác nhận truy cập
                  </PremiumButton>
                  <button type="button" onClick={() => setShowTwoFactor(false)} className="w-full text-sm text-slate-500 hover:text-white transition">Hủy xác thực</button>
                </motion.form>
              ) : (
                <motion.form 
                  key="login-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit(handleLogin)}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tài khoản</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Email hoặc số điện thoại"
                        {...register("email", { required: true })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                      />
                      <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={eyePassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...register("password", { required: true })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-white placeholder:text-slate-700 outline-none focus:border-indigo-500/50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setEyePassword(!eyePassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition"
                      >
                        {eyePassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center space-x-2">
                       <input type="checkbox" className="rounded-md bg-white/5 border-white/10 text-indigo-500" />
                       <span className="text-xs text-slate-400">Ghi nhớ tôi</span>
                    </div>
                    <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium">Quên mật khẩu?</a>
                  </div>

                  <div className="pt-4 space-y-4">
                    <PremiumButton type="submit" className="w-full py-4 text-lg">
                      Đăng nhập hệ thống
                    </PremiumButton>
                    <p className="text-center text-sm text-slate-500 font-medium">
                      Hostech V2 Professional Edition
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </section>

      {/* Footer Decoration */}
      <div className="absolute bottom-8 text-center w-full z-10">
         <p className="text-slate-700 text-xs font-mono uppercase tracking-[0.3em]">&copy; 2026 Hostech Solutions. Crafted for excellence.</p>
      </div>
    </div>
  );
};

export default AuthPage;
