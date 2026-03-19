import { Wrench, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ServiceManagerProps {
  data?: any[];
  roomId?: string;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function ServiceManager({ data = [], roomId: _roomId, isLoading, readOnly = false }: ServiceManagerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900">Dịch vụ Phòng</h3>
        {!readOnly && (
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Đăng ký dịch vụ
          </button>
        )}
      </div>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const servicePrice = item.service?.price ? Number(item.service.price) : 0;
            const unit = item.service?.unit || 'unit';
            
            return (
              <div key={item.id || idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.service?.name || 'Dịch vụ không xác định'}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {item.service?.calc_mode === 'PER_METER' ? 'Sử dụng công tơ' : `Số lượng: ${item.quantity || 1}`}
                    </p>
                  </div>
                </div>
                 <div className="text-right">
                   <p className="text-sm font-black text-indigo-600">
                     {servicePrice > 0 ? formatCurrency(servicePrice) : 'Miễn phí'}
                   </p>
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                     /{unit}
                   </p>
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Chưa có dịch vụ nào</p>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
            Đăng ký các dịch vụ định kỳ (như dọn dẹp hoặc internet) cho phòng này.
          </p>
        </div>
      )}
    </div>
  );
}
