import { Shield } from 'lucide-react';

export default function CompliancePlaceholderPage() {
  return (
    <div className="max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
        <Shield className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-black text-slate-900 dark:text-white">Tuân thủ & nhật ký</h1>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Khu vực dành cho chủ sở hữu: xuất báo cáo tuân thủ và xem nhật ký thao tác nhạy cảm sẽ được kết nối khi backend audit log
        sẵn sàng. Hiện tại không có dữ liệu live.
      </p>
    </div>
  );
}
