import { useState } from 'react';
import { useChangePassword } from '../hooks/useProfile';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';

export default function PasswordChangeForm() {
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const changePassword = useChangePassword();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword.mutate(form, {
      onSuccess: () => {
        setForm({ current_password: '', password: '', password_confirmation: '' });
      },
    });
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm pr-12';

  const labelClass = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  const ToggleEye = ({ field }: { field: 'current' | 'new' | 'confirm' }) => (
    <button
      type="button"
      onClick={() => setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
    >
      {showPasswords[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div>
        <label htmlFor="pwd-current" className={labelClass}>Mật khẩu hiện tại</label>
        <div className="relative">
          <input
            id="pwd-current"
            name="current_password"
            type={showPasswords.current ? 'text' : 'password'}
            value={form.current_password}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <ToggleEye field="current" />
        </div>
      </div>

      <div>
        <label htmlFor="pwd-new" className={labelClass}>Mật khẩu mới</label>
        <div className="relative">
          <input
            id="pwd-new"
            name="password"
            type={showPasswords.new ? 'text' : 'password'}
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className={inputClass}
          />
          <ToggleEye field="new" />
        </div>
        <p className="mt-1 text-xs text-slate-400">Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.</p>
      </div>

      <div>
        <label htmlFor="pwd-confirm" className={labelClass}>Xác nhận mật khẩu mới</label>
        <div className="relative">
          <input
            id="pwd-confirm"
            name="password_confirmation"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={form.password_confirmation}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <ToggleEye field="confirm" />
        </div>
      </div>

      <button
        type="submit"
        disabled={changePassword.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {changePassword.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        Đổi mật khẩu
      </button>
    </form>
  );
}
