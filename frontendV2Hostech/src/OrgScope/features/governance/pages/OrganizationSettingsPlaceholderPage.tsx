import { Settings } from 'lucide-react';

export default function OrganizationSettingsPlaceholderPage() {
  return (
    <div className="max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-300">
        <Settings className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-black text-white">Cấu hình tổ chức</h1>
      <p className="text-sm leading-relaxed text-slate-500">
        Branding, ngưỡng nhắc nợ và mẫu tài liệu cấp org sẽ được bổ sung ở đây sau khi API cấu hình ổn định.
      </p>
    </div>
  );
}
