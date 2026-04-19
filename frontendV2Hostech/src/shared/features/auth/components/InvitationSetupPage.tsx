import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvitationActions } from '@/shared/features/auth/hooks/useInvitations';
import type { InvitationValidation } from '@/shared/features/management/types';
import { organizationsApi } from '@/shared/features/management/api/organizations';
import {
  Loader2, ShieldCheck, Mail, Phone, User, Lock, Building2,
  ArrowRight, CheckCircle2, XCircle, Eye, EyeOff, LogIn,
  CreditCard, Calendar, MapPin, Car, Info
} from 'lucide-react';

export default function InvitationSetupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { registerFromInvitation } = useInvitationActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyUsed, setIsAlreadyUsed] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationValidation | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const hasFetched = useRef(false);

  const [formData, setFormData] = useState({
    // Account Info
    full_name: '',
    phone: '',
    password: '',
    password_confirmation: '',
    org_name: '',
    // Identity Info
    identity_number: '',
    identity_issued_date: '',
    identity_issued_place: '',
    date_of_birth: '',
    // Additional Info
    address: '',
    license_plate: '',
  });

  // Stable fetch — use ref to prevent double-call in React 18 StrictMode dev
  useEffect(() => {
    if (!token || hasFetched.current) return;
    hasFetched.current = true;

    organizationsApi.validateToken(token)
      .then((data) => {
        setInvitationData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        const message: string = err.response?.data?.message ?? 'This invitation link is invalid or has expired.';
        const alreadyUsed = message.toLowerCase().includes('đã được sử dụng') || message.toLowerCase().includes('already used');
        setIsAlreadyUsed(alreadyUsed);
        setError(message);
        setIsLoading(false);
      });
  }, [token]);

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (invitationData?.requires_org_creation && !formData.org_name.trim()) {
      setError('Vui lòng nhập tên tổ chức để hoàn tất đăng ký.');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (!token || !invitationData) return;

    setError(null);

    // Call Fortify /auth/register — the ONLY path that backfills ContractMember
    registerFromInvitation.mutate(
      {
        invite_token: token,
        email: invitationData.email,
        full_name: formData.full_name,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        phone: formData.phone || undefined,
        org_name: formData.org_name || undefined,
        // New identity fields
        identity_number: formData.identity_number || undefined,
        identity_issued_date: formData.identity_issued_date || undefined,
        identity_issued_place: formData.identity_issued_place || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        address: formData.address || undefined,
        license_plate: formData.license_plate || undefined,
      },
      {
        onSuccess: () => setIsSuccess(true),
        onError: (err: any) => {
          const validationErrors = err.response?.data?.errors;
          if (validationErrors) {
            const firstError = Object.values(validationErrors).flat()[0] as string;
            setError(firstError);
          } else {
            setError(err.response?.data?.message ?? 'Đã xảy ra lỗi, vui lòng thử lại.');
          }
        },
      }
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-slate-400 text-sm">Đang xác thực lời mời...</p>
        </div>
      </div>
    );
  }

  // ── Error / invalid token state ────────────────────────────────────────────
  if (error && !invitationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm text-center">
          <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-rose-500/20">
            <XCircle className="h-10 w-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            {isAlreadyUsed ? 'Tài khoản đã được tạo' : 'Liên kết không hợp lệ'}
          </h1>
          <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>

          {isAlreadyUsed ? (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập ngay
            </button>
          ) : (
            <Link to="/login">
              <button className="w-full border border-slate-700 hover:bg-slate-800 h-11 rounded-lg text-slate-300 font-medium transition-colors">
                Quay về trang đăng nhập
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 bg-emerald-500/10 rounded-full items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Tài khoản đã sẵn sàng!</h1>
          <p className="text-slate-400 text-base mb-2 leading-relaxed">
            Tài khoản của bạn đã được thiết lập thành công.
          </p>
          {invitationData?.role_name === 'Tenant' && (
            <p className="text-indigo-400 text-sm mb-8">
              Vui lòng đăng nhập để xem và ký hợp đồng thuê của bạn.
            </p>
          )}
          <button
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base font-medium rounded-lg text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="text-center pb-8 border-b border-slate-800 bg-slate-900/50 pt-10 px-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-indigo-500/20 rotate-3">
            <ShieldCheck className="w-10 h-10 text-white -rotate-3" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Thiết lập tài khoản</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto">
            Vui lòng hoàn tất các thông tin bên dưới để kích hoạt tài khoản của bạn.
          </p>
        </div>

        <div className="p-8">
          {/* Invitation info card */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between mb-8 group transition-all hover:border-indigo-500/30">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Email được mời</span>
              <div className="flex items-center gap-2.5 text-slate-200">
                <Mail className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                <span className="font-semibold text-base">{invitationData?.email}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider text-right">Vai trò của bạn</span>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wide">
                  {invitationData?.role_name}
                </span>
              </div>
            </div>
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-3.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-rose-300 text-sm font-medium">Lỗi đăng ký</p>
                <p className="text-rose-400/80 text-xs leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* --- SECTION 1: ACCOUNT --- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                <h3 className="text-lg font-bold text-white">Thông tin tài khoản</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Org name — only for Owner with new Org */}
                {invitationData?.requires_org_creation && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      Tên tổ chức <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      placeholder="Nhập tên tổ chức/công ty của bạn"
                      value={formData.org_name}
                      onChange={handleChange('org_name')}
                      className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    Họ và tên <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.full_name}
                    onChange={handleChange('full_name')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-400" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0901 234 567"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Tối thiểu 8 ký tự"
                      value={formData.password}
                      onChange={handleChange('password')}
                      className="bg-slate-950 border border-slate-700 text-white h-12 px-4 pr-12 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Xác nhận mật khẩu <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu"
                      value={formData.password_confirmation}
                      onChange={handleChange('password_confirmation')}
                      className="bg-slate-950 border border-slate-700 text-white h-12 px-4 pr-12 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: IDENTITY --- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-sky-500 rounded-full" />
                <h3 className="text-lg font-bold text-white">Thông tin định danh</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-400" />
                    Số CCCD / Hộ chiếu
                  </label>
                  <input
                    placeholder="Nhập số định danh"
                    value={formData.identity_number}
                    onChange={handleChange('identity_number')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange('date_of_birth')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    Ngày cấp
                  </label>
                  <input
                    type="date"
                    value={formData.identity_issued_date}
                    onChange={handleChange('identity_issued_date')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all [color-scheme:dark]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    Nơi cấp
                  </label>
                  <input
                    placeholder="Cục CS Quản lý hành chính..."
                    value={formData.identity_issued_place}
                    onChange={handleChange('identity_issued_place')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* --- SECTION 3: ADDITIONAL --- */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-lg font-bold text-white">Thông tin bổ sung</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Địa chỉ thường trú
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nhập địa chỉ đầy đủ của bạn"
                    value={formData.address}
                    onChange={handleChange('address')}
                    className="bg-slate-950 border border-slate-700 text-white p-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-slate-600 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-400" />
                    Biển số xe
                  </label>
                  <input
                    placeholder="Vd: 51G-12345"
                    value={formData.license_plate}
                    onChange={handleChange('license_plate')}
                    className="bg-slate-950 border border-slate-700 text-white h-12 px-4 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thông tin này giúp quản lý tòa nhà xác thực cư dân và hỗ trợ các dịch vụ gửi xe, nhận tin thông báo chính xác hơn.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={registerFromInvitation.isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed h-14 text-lg font-bold rounded-2xl text-white flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] border border-indigo-400/20"
              >
                {registerFromInvitation.isPending ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Đang xử lý dữ liệu...
                  </>
                ) : (
                  <>
                    Hoàn tất thiết lập
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <p className="text-center text-slate-500 text-xs mt-6">
                Bằng cách hoàn tất, bạn đồng ý với các Điều khoản & Chính sách của chúng tôi.
              </p>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors ml-1 underline underline-offset-4">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

