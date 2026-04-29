import { Calendar, Users, RotateCcw } from 'lucide-react';
import type { TerminationWizardState } from './types';
import { format } from 'date-fns';

interface Step1InfoFormProps {
  contract: any;
  value: Pick<
    TerminationWizardState,
    'terminationDate' | 'cancellationParty' | 'reason' | 'waivePenalty' | 'refundRemainingRent' | 'damageFeeTotal'
  >;
  onChange: (v: Partial<TerminationWizardState>) => void;
  onNext: () => void;
}

export function Step1InfoForm({ contract, value, onChange, onNext }: Step1InfoFormProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const isValid = value.terminationDate && value.cancellationParty && value.reason.trim().length >= 5;

  return (
    <div className="flex flex-col gap-5">
      {/* Contract summary */}
      <div className="flex items-center gap-3 p-3 rounded-[10px] bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
        <div className="w-9 h-9 rounded-[8px] bg-[#1E3A8A]/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-[#1E3A8A] dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Hợp đồng
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            Phòng {contract?.room?.name ?? contract?.room_id}
            {contract?.tenant_full_name && ` — ${contract.tenant_full_name}`}
          </p>
        </div>
      </div>

      {/* Ngày thanh lý */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
          Ngày thanh lý <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            value={value.terminationDate}
            max={today}
            onChange={(e) => onChange({ terminationDate: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          />
        </div>
      </div>

      {/* Bên khởi xướng */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
          Bên khởi xướng <span className="text-rose-500">*</span>
        </label>
        <select
          value={value.cancellationParty}
          onChange={(e) => onChange({ cancellationParty: e.target.value as any })}
          className="w-full px-4 py-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
        >
          <option value="TENANT">Khách thuê yêu cầu trả phòng</option>
          <option value="LANDLORD">Chủ nhà yêu cầu lấy lại phòng</option>
          <option value="MUTUAL">Hết hạn / Thỏa thuận 2 bên</option>
        </select>
      </div>

      {/* Lý do */}
      <div>
        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
          Lý do chi tiết <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={value.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          rows={3}
          placeholder="Ví dụ: Hợp đồng hết hạn, khách chuyển công tác..."
          className="w-full px-4 py-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors resize-none"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {value.cancellationParty === 'TENANT' && (
          <label className="flex items-start gap-3 p-3.5 border border-emerald-100 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-500/5 rounded-[10px] cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
            <input
              type="checkbox"
              checked={value.waivePenalty}
              onChange={(e) => onChange({ waivePenalty: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-emerald-600 flex-shrink-0"
            />
            <div>
              <span className="block text-sm font-bold text-slate-900 dark:text-white">Miễn phạt cọc</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {value.waivePenalty
                  ? 'Sẽ hoàn trả tiền cọc cho khách thuê.'
                  : 'Hệ thống sẽ thu giữ tiền cọc do khách dời trước hạn.'}
              </span>
            </div>
          </label>
        )}

        <label className="flex items-start gap-3 p-3.5 border border-slate-200 dark:border-slate-700 rounded-[10px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <input
            type="checkbox"
            checked={value.refundRemainingRent}
            onChange={(e) => onChange({ refundRemainingRent: e.target.checked })}
            className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
          />
          <div>
            <span className="block text-sm font-bold text-slate-900 dark:text-white">Hoàn tiền thuê còn lại</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tính và hoàn lại tiền phòng chưa sử dụng (nếu đã thanh toán trước).
            </span>
          </div>
        </label>

        <div>
          <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            Phí hư hỏng / bồi thường (ước tính, VND)
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={value.damageFeeTotal ?? 0}
            onChange={(e) => onChange({ damageFeeTotal: Number(e.target.value) || 0 })}
            className="w-full px-4 py-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-colors"
          />
          <p className="text-[11px] text-slate-400 mt-1">Dùng cho xem trước quyết toán và hóa đơn thanh lý (nếu có).</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-[8px] transition-colors"
        >
          Tiếp theo
          <RotateCcw className="w-4 h-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
