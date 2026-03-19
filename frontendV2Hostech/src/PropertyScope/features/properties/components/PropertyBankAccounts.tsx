import { CreditCard, Copy, Landmark } from 'lucide-react';
import type { Property } from '../types';
import { toast } from 'react-hot-toast';

interface PropertyBankAccountsProps {
  property: Property;
}

export function PropertyBankAccounts({ property }: PropertyBankAccountsProps) {
  const accounts = Array.isArray(property.bank_accounts) ? property.bank_accounts : [];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép số tài khoản');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        Tài khoản ngân hàng
      </h3>

      {accounts.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có thông tin nhận thanh toán</p>
          <button className="mt-4 text-sm font-bold text-indigo-600 hover:underline">Thêm tài khoản</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account, idx) => (
            <div 
              key={idx} 
              className="relative group p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-xl overflow-hidden"
            >
              {/* Card texture/pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Ngân hàng</p>
                    <p className="text-sm font-black tracking-tight">{account.bank_name}</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-white/20" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Số tài khoản</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono font-bold tracking-widest">{account.account_number}</p>
                    <button 
                      onClick={() => handleCopy(account.account_number)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-white/40 group-hover:text-white/80" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Chủ tài khoản</p>
                  <p className="text-sm font-bold uppercase tracking-wide">{account.account_holder}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
