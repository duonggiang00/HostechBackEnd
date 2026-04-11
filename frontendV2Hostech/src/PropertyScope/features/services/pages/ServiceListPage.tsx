import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Search, Edit2, Trash2, Zap, Droplets } from 'lucide-react';
import { useServices, useUpdateService, useDeleteService } from '../hooks/useServices';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { Service } from '../types';

interface ServiceListPageProps {
  hideHeader?: boolean;
}

export default function ServiceListPage({ hideHeader = false }: ServiceListPageProps) {
  const { propertyId } = useParams<{ propertyId: string }>();
  const [search, setSearch] = useState('');
  
  const { data: response, isLoading } = useServices({ search, per_page: 50 });
  const services = response?.data || [];

  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();

  const handleToggleActive = async (service: Service) => {
    try {
      await updateServiceMutation.mutateAsync({
        id: service.id,
        data: { is_active: !service.is_active }
      });
      toast.success(service.is_active ? 'Đã tắt tính phí dịch vụ' : 'Đã bật tính phí dịch vụ');
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật dịch vụ');
    }
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`)) return;
    try {
      await deleteServiceMutation.mutateAsync(service.id);
      toast.success('Đã xóa dịch vụ');
    } catch {
      toast.error('Không thể xóa dịch vụ này');
    }
  };

  const getCalcModeLabel = (mode: string) => {
    switch (mode) {
      case 'PER_ROOM': return 'Theo phòng';
      case 'PER_PERSON': return 'Theo người';
      case 'PER_QUANTITY': return 'Theo số lượng';
      case 'PER_METER': return 'Theo đồng hồ (Chỉ số)';
      default: return mode;
    }
  };

  return (
    <div data-testid="services-page" className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#1E3A8A]" />
              Dịch vụ & Bảng giá
            </h1>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
              Quản lý các loại hình dịch vụ tính phí như Điện, Nước, Rác, Internet...
            </p>
          </div>

          <Link
            to={`/properties/${propertyId}/services/create`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] shadow-sm transition-all focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 w-full sm:w-auto font-semibold"
          >
            <Plus className="w-5 h-5" />
            Thêm dịch vụ mới
          </Link>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm dịch vụ..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all outline-none text-[#111827] dark:text-slate-300"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {hideHeader && (
          <Link
            to={`/properties/${propertyId}/services/create`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] shadow-sm transition-all focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 w-full sm:w-auto font-semibold"
          >
            <Plus className="w-5 h-5" />
            Thêm dịch vụ mới
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider">Mã / Tên dịch vụ</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider">Cách tính phí</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider">Đơn giá / Đơn vị</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider text-center">Tự động</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider text-center">Kích hoạt</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#4B5563] dark:text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#4B5563] dark:text-slate-400">
                    <Settings className="w-12 h-12 text-[#E5E7EB] dark:text-slate-600 mx-auto mb-3" />
                    Chưa có dịch vụ nào định nghĩa.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {services.map((service: Service) => (
                    <motion.tr
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                                {service.type === 'ELECTRIC' ? (
                                  <Zap className="w-5 h-5 text-amber-500" />
                                ) : service.type === 'WATER' ? (
                                  <Droplets className="w-5 h-5 text-blue-500" />
                                ) : (
                                  <Settings className="w-5 h-5 text-[#1E3A8A] dark:text-indigo-400" />
                                )}
                          </div>
                          <div>
                            <div className="font-bold text-[#111827] dark:text-white">
                              {service.name}
                            </div>
                            <div className="text-xs text-[#4B5563]">Mã: {service.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-[#4B5563] dark:bg-slate-700 dark:text-slate-300">
                          {getCalcModeLabel(service.calc_mode)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#111827] dark:text-slate-300">
                        {service.calc_mode === 'PER_METER' && service.rates?.[0]?.tiered_rates && service.rates[0].tiered_rates.length > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400">Giá bậc thang ({service.rates[0].tiered_rates.length} bậc)</span>
                        ) : (
                          <>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.current_price || 0)}
                            <span className="text-slate-400 font-normal"> / {service.unit}</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {service.is_recurring ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                            CÓ
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">KHÔNG</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            service.is_active ? 'bg-[#1E3A8A]' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              service.is_active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/properties/${propertyId}/services/${service.id}/edit`}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                            title="Sửa dịch vụ"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(service)}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
