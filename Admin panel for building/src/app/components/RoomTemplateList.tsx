import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router";

// Mock data for room templates
const mockRoomTemplates = [
  {
    id: 1,
    name: "Phòng Studio",
    area: 25,
    capacity: 1,
    base_price: 3750000,
    description: "Phòng studio nhỏ gọn, phù hợp cho 1 người",
  },
  {
    id: 2,
    name: "Phòng 1 Phòng Ngủ",
    area: 35,
    capacity: 2,
    base_price: 5250000,
    description: "Phòng rộng rãi với 1 phòng ngủ riêng biệt",
  },
  {
    id: 3,
    name: "Phòng 2 Phòng Ngủ",
    area: 50,
    capacity: 4,
    base_price: 7500000,
    description: "Căn hộ rộng rãi với 2 phòng ngủ, phù hợp cho gia đình",
  },
  {
    id: 4,
    name: "Phòng VIP",
    area: 60,
    capacity: 4,
    base_price: 9000000,
    description: "Phòng cao cấp với nội thất đầy đủ",
  },
];

export default function RoomTemplateList() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Danh sách phòng mẫu</h2>
        <button
          onClick={() => navigate("/room-template/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm phòng mẫu
        </button>
      </div>

      {/* Room Templates List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên phòng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diện tích
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sức chứa
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá cơ bản
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockRoomTemplates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{template.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{template.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">{template.area} m²</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm text-gray-900">{template.capacity} người</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {template.base_price.toLocaleString("vi-VN")} VNĐ
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => navigate(`/room-template/${template.id}`)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {mockRoomTemplates.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có phòng mẫu nào</h3>
          <p className="text-gray-600 mb-4">Tạo phòng mẫu để quản lý các loại phòng trong tòa nhà</p>
          <button
            onClick={() => navigate("/room-template/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thêm phòng mẫu
          </button>
        </div>
      )}
    </div>
  );
}