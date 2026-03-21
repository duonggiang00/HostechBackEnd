import { Settings2, Coins, ShieldCheck, Zap } from 'lucide-react';
import type { Property } from '@/OrgScope/features/properties/types';
import { motion } from 'framer-motion';
import { RoomTemplateList } from '@/PropertyScope/features/rooms/components/templates/RoomTemplateList';

interface PropertyTemplateConfigProps {
  property: Property;
}

export function PropertyTemplateConfig({ property }: PropertyTemplateConfigProps) {
  const configItems = [
    {
      label: 'Đơn giá thuê mặc định',
      value: property.default_rent_price_per_m2?.toLocaleString() ?? 'Chưa thiết lập',
      suffix: 'VNĐ/m²',
      icon: Coins,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10'
    },
    {
      label: 'Số tháng cọc mặc định',
      value: property.default_deposit_months ?? 'Chưa thiết lập',
      suffix: 'tháng',
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  const services = property.default_services ?? [];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Cards */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <Settings2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Cấu hình mẫu (Template)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configItems.map((item, idx) => (
              <div key={idx} className="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 group hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-2.5 ${item.bgColor} rounded-xl group-hover:scale-110 transition-transform`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{item.value}</span>
                  <span className="text-xs font-bold text-slate-400">{item.suffix}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Default Services */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-violet-500/10 rounded-2xl">
              <Zap className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Dịch vụ mặc định</h3>
          </div>

          <div className="flex flex-col gap-3 flex-1 overflow-auto max-h-[240px] pr-2 custom-scrollbar">
            {services.length > 0 ? (
              services.map((service: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{service.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{service.price?.toLocaleString()} đ</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <p className="text-xs font-bold italic">Chưa có dịch vụ mặc định</p>
              </div>
            )}
          </div>
          
          {services.length > 0 && (
            <p className="mt-4 text-[10px] font-bold text-slate-400 italic">
              * Các dịch vụ này sẽ tự động được thêm vào hợp đồng mới.
            </p>
          )}
        </motion.div>
      </div>

      {/* Room Templates Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <RoomTemplateList propertyId={property.id} />
      </motion.div>
    </div>
  );
}
