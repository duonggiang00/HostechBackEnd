import { Calendar, CreditCard, Clock } from 'lucide-react';
import type { Property } from '../types';

interface PropertyBillingPolicyProps {
  property: Property;
}

export function PropertyBillingPolicy({ property }: PropertyBillingPolicyProps) {
  const policies = [
    { 
      label: 'Chu kỳ thanh toán', 
      value: property.default_billing_cycle === 'monthly' ? 'Hàng tháng' : property.default_billing_cycle, 
      icon: Calendar,
      description: 'Chu kỳ mặc định cho các hóa đơn mới'
    },
    { 
      label: 'Ngày chốt sổ', 
      value: `Ngày ${property.default_cutoff_day}`, 
      icon: Clock,
      description: 'Ngày hệ thống chốt chỉ số điện nước'
    },
    { 
      label: 'Hạn thanh toán', 
      value: `Ngày ${property.default_due_day}`, 
      icon: CreditCard,
      description: 'Hạn cuối để thanh toán hóa đơn không bị trễ'
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm mb-8">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        Chính sách hóa đơn
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {policies.map((policy, idx) => (
          <div key={idx} className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                <policy.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200">{policy.label}</p>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{policy.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {policy.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
