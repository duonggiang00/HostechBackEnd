import { Settings } from 'lucide-react';

export default function OrganizationSettingsPlaceholderPage() {
  return (
    <div className="max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
        <Settings className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-black text-slate-900 dark:text-white">Cấu hình tổ chức</h1>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Branding, ngưỡng nhắc nợ và mẫu tài liệu cấp org sẽ được bổ sung ở đây sau khi API cấu hình ổn định.
      </p>
    </div>
  );
}
