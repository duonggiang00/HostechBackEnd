import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Layers, DoorOpen } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
}

const BaseModal = ({ isOpen, onClose, title, icon: Icon, children }: React.PropsWithChildren<BaseModalProps>) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-tight">Quản lý cơ sở hạ tầng của bạn</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {children}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 font-bold text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
              >
                Hủy
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddFloorModal = ({ isOpen, onClose, propertyName }: { isOpen: boolean; onClose: () => void; propertyName: string }) => (
  <BaseModal isOpen={isOpen} onClose={onClose} title="Thêm tầng mới" icon={Layers}>
    <div className="space-y-4">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-2">
        <p className="text-xs text-indigo-700 font-medium">Thêm tầng cho <span className="font-black">{propertyName}</span></p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tên tầng / Số tầng</label>
        <input 
          type="text" 
          placeholder="VD: Tầng 01, Sảnh, Sân thượng"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:font-medium placeholder:text-slate-300"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả (Tùy chọn)</label>
        <textarea 
          placeholder="Mô tả các đặc điểm cụ thể của tầng này"
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium h-24 resize-none"
        />
      </div>
    </div>
  </BaseModal>
);

export const AddRoomModal = ({ isOpen, onClose, floorName }: { isOpen: boolean; onClose: () => void; floorName: string }) => (
  <BaseModal isOpen={isOpen} onClose={onClose} title="Thêm phòng mới" icon={DoorOpen}>
    <div className="space-y-4">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-2">
        <p className="text-xs text-indigo-700 font-medium">Thêm phòng vào <span className="font-black">{floorName}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Số phòng</label>
          <input 
            type="text" 
            placeholder="VD: 101"
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Loại phòng</label>
          <select className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold appearance-none bg-white">
            <option>Phòng đơn (Studio)</option>
            <option>Phòng 1 ngủ</option>
            <option>Phòng 2 ngủ</option>
            <option>Phòng cao cấp (Suite)</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Giá thuê cơ bản / Tháng</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
          <input 
            type="number" 
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold"
          />
        </div>
      </div>
    </div>
  </BaseModal>
);
