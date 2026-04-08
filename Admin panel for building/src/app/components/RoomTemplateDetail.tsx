import { useState } from "react";
import { ArrowLeft, Edit, Trash2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

// Mock data
const mockRoomTemplate = {
  id: 1,
  name: "Phòng Studio",
  area: 25,
  capacity: 1,
  base_price: 3750000,
  description: "Phòng studio nhỏ gọn, phù hợp cho 1 người. Đầy đủ tiện nghi cơ bản, thiết kế hiện đại.",
  services: [
    { id: 1, name: "Điện", price: 3500, unit: "kWh" },
    { id: 2, name: "Nước", price: 18000, unit: "m³" },
    { id: 3, name: "Internet", price: 200000, unit: "tháng" },
  ],
  assets: [
    {
      id: 1,
      name: "Giường ngủ",
      serial: "BED-001",
      condition: "Tốt",
      purchased_at: "2024-01-15",
      warranty_end: "2025-01-15",
      note: "Giường 1m6, có ngăn kéo",
    },
    {
      id: 2,
      name: "Tủ lạnh",
      serial: "REF-002",
      condition: "Mới",
      purchased_at: "2024-03-20",
      warranty_end: "2026-03-20",
      note: "Tủ lạnh Electrolux 180L",
    },
    {
      id: 3,
      name: "Điều hòa",
      serial: "AC-003",
      condition: "Tốt",
      purchased_at: "2024-02-10",
      warranty_end: "2026-02-10",
      note: "Điều hòa Daikin 1.5HP",
    },
  ],
  images: [
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "https://images.unsplash.com/photo-1502672260066-6bc35f0a1611?w=800",
  ],
};

type TabType = "details" | "images";

export default function RoomTemplateDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>("details");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">{mockRoomTemplate.name}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/room-template/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-1 py-4 border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span className="font-medium">Thông tin chi tiết</span>
            </button>
            <button
              onClick={() => setActiveTab("images")}
              className={`px-1 py-4 border-b-2 transition-colors ${
                activeTab === "images"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <span className="font-medium">Hình ảnh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tên phòng</label>
                  <p className="font-medium text-gray-900">{mockRoomTemplate.name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Diện tích</label>
                  <p className="font-medium text-gray-900">{mockRoomTemplate.area} m²</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sức chứa</label>
                  <p className="font-medium text-gray-900">{mockRoomTemplate.capacity} người</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Giá cơ bản</label>
                  <p className="font-medium text-gray-900">
                    {mockRoomTemplate.base_price.toLocaleString("vi-VN")} VNĐ/tháng
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
                  <p className="text-gray-900">{mockRoomTemplate.description}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ đi kèm</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {mockRoomTemplate.services.map((service) => (
                  <div key={service.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                        <p className="text-sm text-gray-600">
                          {service.price.toLocaleString("vi-VN")} VNĐ/{service.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Assets */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tài sản trong phòng</h3>
              <div className="space-y-4">
                {mockRoomTemplate.assets.map((asset) => (
                  <div key={asset.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tên tài sản</label>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Số serial</label>
                        <p className="text-gray-900">{asset.serial}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tình trạng</label>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {asset.condition}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Ngày mua</label>
                        <p className="text-gray-900">{asset.purchased_at}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Hết bảo hành</label>
                        <p className="text-gray-900">{asset.warranty_end}</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Ghi chú</label>
                        <p className="text-gray-900">{asset.note}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "images" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hình ảnh phòng</h3>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Thêm hình ảnh
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {mockRoomTemplate.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Room ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
