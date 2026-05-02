import { Shield } from 'lucide-react';

export default function CompliancePlaceholderPage() {
  return (
    <div className="max-w-2xl space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
        <Shield className="h-6 w-6" />
      </div>
      <h1 className="text-xl font-black text-white">Tuân thủ & nhật ký</h1>
      <p className="text-sm leading-relaxed text-slate-500">
        Khu vực dành cho chủ sở hữu: xuất báo cáo tuân thủ và xem nhật ký thao tác nhạy cảm sẽ được kết nối khi backend audit log
        sẵn sàng. Hiện tại không có dữ liệu live.
      </p>
    </div>
  );
}
