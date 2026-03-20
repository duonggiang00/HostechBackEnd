import { useState } from 'react';
import { useUpdateProfile } from '../hooks/useProfile';
import type { ProfileUser, ProfileUpdatePayload } from '../types';
import { Save, Loader2 } from 'lucide-react';

interface ProfileInfoFormProps {
  profile: ProfileUser;
}

export default function ProfileInfoForm({ profile }: ProfileInfoFormProps) {
  const [form, setForm] = useState<ProfileUpdatePayload>({
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? '',
    identity_number: profile.identity_number ?? '',
    identity_issued_date: profile.identity_issued_date ?? '',
    identity_issued_place: profile.identity_issued_place ?? '',
    date_of_birth: profile.date_of_birth ?? '',
    address: profile.address ?? '',
  });

  const updateProfile = useUpdateProfile();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form);
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm';

  const labelClass = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div>
          <label htmlFor="profile-full_name" className={labelClass}>Họ và tên *</label>
          <input
            id="profile-full_name"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="profile-email" className={labelClass}>Email *</label>
          <input
            id="profile-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="profile-phone" className={labelClass}>Số điện thoại</label>
          <input
            id="profile-phone"
            name="phone"
            value={form.phone ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="profile-date_of_birth" className={labelClass}>Ngày sinh</label>
          <input
            id="profile-date_of_birth"
            name="date_of_birth"
            type="date"
            value={form.date_of_birth ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Identity Number */}
        <div>
          <label htmlFor="profile-identity_number" className={labelClass}>CCCD / CMND</label>
          <input
            id="profile-identity_number"
            name="identity_number"
            value={form.identity_number ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Identity Issued Date */}
        <div>
          <label htmlFor="profile-identity_issued_date" className={labelClass}>Ngày cấp</label>
          <input
            id="profile-identity_issued_date"
            name="identity_issued_date"
            type="date"
            value={form.identity_issued_date ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Identity Issued Place */}
        <div className="md:col-span-2">
          <label htmlFor="profile-identity_issued_place" className={labelClass}>Nơi cấp</label>
          <input
            id="profile-identity_issued_place"
            name="identity_issued_place"
            value={form.identity_issued_place ?? ''}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label htmlFor="profile-address" className={labelClass}>Địa chỉ</label>
          <textarea
            id="profile-address"
            name="address"
            value={form.address ?? ''}
            onChange={handleChange}
            rows={2}
            className={inputClass + ' resize-none'}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateProfile.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}
