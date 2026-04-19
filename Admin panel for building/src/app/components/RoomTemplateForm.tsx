import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";

// Mock services data
const mockServices = [
  { id: 1, name: "Điện", price: 3500, unit: "kWh" },
  { id: 2, name: "Nước", price: 18000, unit: "m³" },
  { id: 3, name: "Internet", price: 200000, unit: "tháng" },
  { id: 4, name: "Truyền hình", price: 150000, unit: "tháng" },
];

interface Asset {
  name: string;
  serial: string;
  condition: string;
  purchased_at: string;
  warranty_end: string;
  note: string;
}

interface FormData {
  name: string;
  area: number;
  capacity: number;
  base_price: number;
  description: string;
  service_ids: number[];
  assets: Asset[];
}

export default function RoomTemplateForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = id !== "new";
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    area: 0,
    capacity: 1,
    base_price: 0,
    description: "",
    service_ids: [],
    assets: [],
  });

  const steps = [
    { number: 1, title: "Thông tin cơ bản" },
    { number: 2, title: "Dịch vụ" },
    { number: 3, title: "Tài sản" },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData((prev) => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId],
    }));
  };

  const handleAddAsset = () => {
    setFormData((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        {
          name: "",
          serial: "",
          condition: "",
          purchased_at: "",
          warranty_end: "",
          note: "",
        },
      ],
    }));
  };

  const handleRemoveAsset = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index),
    }));
  };

  const handleAssetChange = (index: number, field: keyof Asset, value: string) => {
    setFormData((prev) => ({
      ...prev,
      assets: prev.assets.map((asset, i) =>
        i === index ? { ...asset, [field]: value } : asset
      ),
    }));
  };

  const handleSubmit = () => {
    console.log("Form data:", formData);
    alert("Lưu thành công!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEdit ? "Chỉnh sửa phòng mẫu" : "Thêm phòng mẫu mới"}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentStep >= step.number
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      currentStep >= step.number ? "text-blue-600" : "text-gray-600"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 mt-[-24px] transition-colors ${
                      currentStep > step.number ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên phòng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diện tích (m²) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.area || ""}
                    onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sức chứa (người) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.capacity || ""}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá cơ bản (VNĐ/tháng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.base_price || ""}
                  onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả về phòng"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Chọn dịch vụ đi kèm</h3>
              <p className="text-sm text-gray-600">Chọn các dịch vụ mà phòng này sẽ sử dụng</p>
              
              <div className="space-y-3">
                {mockServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">
                          {service.price.toLocaleString("vi-VN")} VNĐ/{service.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tài sản trong phòng</h3>
                  <p className="text-sm text-gray-600 mt-1">Thêm các tài sản, thiết bị trong phòng</p>
                </div>
                <button
                  onClick={handleAddAsset}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Thêm tài sản
                </button>
              </div>

              {formData.assets.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">Chưa có tài sản nào</p>
                  <button
                    onClick={handleAddAsset}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thêm tài sản đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.assets.map((asset, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Tài sản #{index + 1}</h4>
                        <button
                          onClick={() => handleRemoveAsset(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên tài sản <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={asset.name}
                            onChange={(e) => handleAssetChange(index, "name", e.target.value)}
                            placeholder="Ví dụ: Giường ngủ"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Số serial
                          </label>
                          <input
                            type="text"
                            value={asset.serial}
                            onChange={(e) => handleAssetChange(index, "serial", e.target.value)}
                            placeholder="Ví dụ: BED-001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tình trạng
                          </label>
                          <select
                            value={asset.condition}
                            onChange={(e) => handleAssetChange(index, "condition", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Chọn tình trạng</option>
                            <option value="Mới">Mới</option>
                            <option value="Tốt">Tốt</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Cần sửa chữa">Cần sửa chữa</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ngày mua
                          </label>
                          <input
                            type="date"
                            value={asset.purchased_at}
                            onChange={(e) => handleAssetChange(index, "purchased_at", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hết bảo hành
                          </label>
                          <input
                            type="date"
                            value={asset.warranty_end}
                            onChange={(e) => handleAssetChange(index, "warranty_end", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú
                          </label>
                          <textarea
                            value={asset.note}
                            onChange={(e) => handleAssetChange(index, "note", e.target.value)}
                            placeholder="Thêm ghi chú về tài sản"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tiếp theo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Hoàn tất
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
