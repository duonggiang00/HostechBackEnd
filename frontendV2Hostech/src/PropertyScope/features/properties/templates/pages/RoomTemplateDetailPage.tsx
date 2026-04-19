import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  ImageIcon,
  Archive,
  MapPin,
  Zap,
  Droplet,
  Tv,
  Wind,
  Bed,
  Wifi,
  Loader2,
  FileEdit,
} from 'lucide-react';
import { useRoomTemplate } from '../../hooks/useRoomTemplate';
import { formatCurrency } from '@/lib/utils';

// --- Helpers ---

type TabId = 'info' | 'images';

function getServiceIcon(name: string): React.ElementType {
  const key = name.toLowerCase();
  if (key.includes('wifi') || key.includes('mạng')) return Wifi;
  if (key.includes('điều hòa') || key.includes('ac')) return Wind;
  if (key.includes('nước')) return Droplet;
  if (key.includes('điện')) return Zap;
  if (key.includes('tv') || key.includes('tivi')) return Tv;
  if (key.includes('giường') || key.includes('bed')) return Bed;
  if (key.includes('tủ')) return Archive;
  return Zap;
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'Thông tin', icon: Info },
  { id: 'images', label: 'Hình ảnh', icon: ImageIcon },
];

export default function RoomTemplateDetailPage() {
  const { propertyId, templateId } = useParams<{ propertyId: string; templateId: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading, error } = useRoomTemplate(propertyId, templateId);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const handleBack = () => {
    navigate(`/properties/${propertyId}/rooms`); // Back to room list / templates tab
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="m-8 p-12 text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl">
        <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">Không tải được thông tin mẫu phòng</h3>
        <p className="text-rose-500 dark:text-rose-400/70 text-sm mb-4">
          {(error as any)?.message || 'Mẫu phòng không tồn tại hoặc có lỗi xảy ra.'}
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* --- Sticky Header --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={handleBack}
                className="shrink-0 flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Quay lại</span>
              </button>

              <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{template.name}</h1>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-md border border-indigo-200 dark:border-indigo-500/30">
                    Mẫu phòng
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{template.property_name || 'Tòa nhà'}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => navigate(`/properties/${propertyId}/templates/room/edit/${templateId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400 transition-all"
              >
                <FileEdit className="w-4 h-4" />
                Chỉnh sửa mẫu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Sticky Tab Bar --- */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-[73px] z-10">
        <div className="px-6 overflow-x-auto no-scrollbar">
          <div className="flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Tab Content --- */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* --- Thông tin --- */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thông tin cơ bản */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Tên mẫu:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Diện tích:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{template.area} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Giới hạn người:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{template.capacity} người</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">Giá thuê cơ bản:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(template.base_price || 0)}/tháng
                    </span>
                  </div>
                </div>
              </div>

              {/* Dịch vụ mặc định */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dịch vụ mặc định</h2>
                {template.services && template.services.length > 0 ? (
                  <div className="space-y-3">
                    {template.services.map((service) => {
                      const ServiceIcon = getServiceIcon(service.name ?? '');
                      const calcMode = service.calc_mode;
                      const isFixed = calcMode === 'fixed' || calcMode === 'FIXED';
                      return (
                        <div key={service.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg">
                              <ServiceIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <span className="text-sm text-gray-900 dark:text-white">{service.name}</span>
                              {service.unit && (
                                <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">({service.unit})</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-medium ${isFixed ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {isFixed 
                              ? 'Theo gói' 
                              : (service as any).calc_mode === 'PER_METER' && (service as any).tiered_rates?.length > 0
                                ? 'Lũy tiến'
                                : formatCurrency((service as any).price ?? (service as any).current_price ?? (service as any).unit_price ?? 0)
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-24 text-gray-300 dark:text-slate-600">
                    <Zap className="w-8 h-8 mb-1" />
                    <p className="text-xs text-gray-400 dark:text-slate-500">Chưa cấu hình dịch vụ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mô tả */}
            {template.description && (
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Mô tả mẫu</h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {template.description}
                </p>
              </div>
            )}

            {/* Danh sách tài sản - Merged into info tab */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Archive className="w-5 h-5 text-gray-400" />
                  Tài sản đi kèm
                </h2>
              </div>
              {template.assets && template.assets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-slate-300 w-20">STT</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-slate-300">Tên tài sản</th>
                        <th className="px-6 py-3 font-semibold text-gray-900 dark:text-slate-300 text-right">Tình trạng mẫu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {template.assets.map((asset: any, index: number) => (
                        <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-gray-400 dark:text-slate-500">{index + 1}</td>
                          <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{asset.name}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-slate-400 capitalize text-right">{asset.condition || 'Mới'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-slate-600">
                  <Archive className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">Chưa cấu hình tài sản cho mẫu này</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- Hình ảnh --- */}
        {activeTab === 'images' && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-8">
            {template.media && template.media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {template.media.map((item: any) => (
                  <div key={item.id} className="aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 group relative">
                    <img 
                      src={item.url} 
                      alt={template.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300 dark:text-slate-600">
                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-gray-500 dark:text-slate-400 font-medium">Chưa có hình ảnh minh họa</p>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
}
