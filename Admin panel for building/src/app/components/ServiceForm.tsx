import { useState } from "react";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

const SERVICE_TYPES = {
  ELECTRIC: 'ELECTRIC',
  WATER: 'WATER',
  OTHER: 'OTHER',
} as const;

const CALC_MODES = {
  FLAT: 'FLAT',
  TIERED: 'TIERED',
} as const;

interface ElectricTier {
  tier_from: number;
  tier_to: number;
  price: number;
}

interface FormData {
  code: string;
  name: string;
  type: string;
  calc_mode: string;
  unit: string;
  is_recurring: boolean;
  is_active: boolean;
  meta: {
    flat_price?: number;
    tiers?: ElectricTier[];
  };
}

export default function ServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id !== "new";

  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    type: SERVICE_TYPES.OTHER,
    calc_mode: CALC_MODES.FLAT,
    unit: "",
    is_recurring: false,
    is_active: true,
    meta: {},
  });

  const [electricPriceMode, setElectricPriceMode] = useState<'tiered' | 'flat'>('flat');

  const handleAddTier = () => {
    const newTiers = formData.meta.tiers || [];
    const lastTier = newTiers[newTiers.length - 1];
    const newTierFrom = lastTier ? lastTier.tier_to + 1 : 0;

    setFormData({
      ...formData,
      meta: {
        ...formData.meta,
        tiers: [
          ...newTiers,
          {
            tier_from: newTierFrom,
            tier_to: newTierFrom + 50,
            price: 0,
          },
        ],
      },
    });
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = formData.meta.tiers?.filter((_, i) => i !== index) || [];
    setFormData({
      ...formData,
      meta: {
        ...formData.meta,
        tiers: newTiers,
      },
    });
  };

  const handleTierChange = (index: number, field: keyof ElectricTier, value: number) => {
    const newTiers = formData.meta.tiers?.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    ) || [];
    
    setFormData({
      ...formData,
      meta: {
        ...formData.meta,
        tiers: newTiers,
      },
    });
  };

  const handleElectricPriceModeChange = (mode: 'tiered' | 'flat') => {
    setElectricPriceMode(mode);
    if (mode === 'tiered') {
      setFormData({
        ...formData,
        calc_mode: CALC_MODES.TIERED,
        meta: {
          tiers: formData.meta.tiers || [
            { tier_from: 0, tier_to: 50, price: 1806 },
            { tier_from: 51, tier_to: 100, price: 1866 },
            { tier_from: 101, tier_to: 200, price: 2167 },
          ],
        },
      });
    } else {
      setFormData({
        ...formData,
        calc_mode: CALC_MODES.FLAT,
        meta: {
          flat_price: formData.meta.flat_price || 3500,
        },
      });
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type,
      unit: type === SERVICE_TYPES.ELECTRIC ? 'kWh' : type === SERVICE_TYPES.WATER ? 'm³' : '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    alert("Lưu thành công!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ví dụ: SV001"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Điện"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại dịch vụ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={SERVICE_TYPES.OTHER}>Khác</option>
                    <option value={SERVICE_TYPES.ELECTRIC}>Điện</option>
                    <option value={SERVICE_TYPES.WATER}>Nước</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đơn vị tính <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ví dụ: kWh, m³, tháng"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Dịch vụ định kỳ</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Configuration - Only for ELECTRIC */}
          {formData.type === SERVICE_TYPES.ELECTRIC && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình giá điện</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="electricPriceMode"
                      checked={electricPriceMode === 'flat'}
                      onChange={() => handleElectricPriceModeChange('flat')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Giá bán lẻ</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="electricPriceMode"
                      checked={electricPriceMode === 'tiered'}
                      onChange={() => handleElectricPriceModeChange('tiered')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Giá bậc thang</span>
                  </label>
                </div>

                {electricPriceMode === 'flat' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá bán lẻ (VNĐ/kWh) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.meta.flat_price || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        meta: { ...formData.meta, flat_price: Number(e.target.value) }
                      })}
                      placeholder="Ví dụ: 3500"
                      required
                      className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Bậc thang giá điện
                      </label>
                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm bậc
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.meta.tiers && formData.meta.tiers.length > 0 ? (
                        formData.meta.tiers.map((tier, index) => (
                          <div key={index} className="flex items-end gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Từ (kWh)
                              </label>
                              <input
                                type="number"
                                value={tier.tier_from}
                                onChange={(e) => handleTierChange(index, 'tier_from', Number(e.target.value))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>

                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Đến (kWh)
                              </label>
                              <input
                                type="number"
                                value={tier.tier_to}
                                onChange={(e) => handleTierChange(index, 'tier_to', Number(e.target.value))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>

                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Giá (VNĐ/kWh)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={tier.price}
                                onChange={(e) => handleTierChange(index, 'price', Number(e.target.value))}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveTier(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-600 mb-3">Chưa có bậc thang nào</p>
                          <button
                            type="button"
                            onClick={handleAddTier}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Thêm bậc đầu tiên
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Configuration - For OTHER services */}
          {formData.type === SERVICE_TYPES.OTHER && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình giá</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá dịch vụ (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.meta.flat_price || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    meta: { ...formData.meta, flat_price: Number(e.target.value) }
                  })}
                  placeholder="Nhập giá dịch vụ"
                  required
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Pricing Configuration - For WATER */}
          {formData.type === SERVICE_TYPES.WATER && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cấu hình giá nước</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá nước (VNĐ/m³) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.meta.flat_price || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    meta: { ...formData.meta, flat_price: Number(e.target.value) }
                  })}
                  placeholder="Ví dụ: 18000"
                  required
                  className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Lưu dịch vụ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
