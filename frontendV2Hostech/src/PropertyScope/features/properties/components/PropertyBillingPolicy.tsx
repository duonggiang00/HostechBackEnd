import { Calendar, CreditCard, Clock, Info, ShieldCheck } from 'lucide-react';
import type { Property } from '@/OrgScope/features/properties/types';

interface PropertyBillingPolicyProps {
  property: Property;
}

export function PropertyBillingPolicy({ property }: PropertyBillingPolicyProps) {
  const billingCycleLabels: Record<string, string> = {
    monthly: 'Hàng tháng',
    quarterly: 'Hàng quý',
    yearly: 'Hàng năm',
  };

  const policies = [
    {
      label: 'Chu kỳ thanh toán',
      value: billingCycleLabels[property.default_billing_cycle] || property.default_billing_cycle,
      icon: CreditCard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Ngày chốt số',
      value: `Ngày ${property.default_cutoff_day}`,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Ngày hạn thanh toán',
      value: `Ngày ${property.default_due_day}`,
      icon: Calendar,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none mb-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-2xl">
          <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Chính sách thanh toán</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
            Thiết lập chu kỳ và thời hạn thu phí mặc định
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policies.map((policy, idx) => (
          <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${policy.bgColor} rounded-xl`}>
                <policy.icon className={`w-4 h-4 ${policy.color}`} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{policy.label}</span>
            </div>
            <div className="flex items-center justify-between">
               <span className="text-xl font-black text-slate-900 dark:text-white">{policy.value}</span>
               <div className="p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800">
                  <Info className="w-3 h-3 text-slate-300" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
