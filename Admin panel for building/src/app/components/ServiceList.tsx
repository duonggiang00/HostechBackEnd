import { Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

// Mock data for services
const mockServices = [
  {
    id: 1,
    name: "Điện",
    unit: "kWh",
    price: 3500,
    description: "Điện sinh hoạt",
  },
  {
    id: 2,
    name: "Nước",
    unit: "m³",
    price: 18000,
    description: "Nước sinh hoạt",
  },
  {
    id: 3,
    name: "Internet",
    unit: "tháng",
    price: 200000,
    description: "Internet cáp quang 100Mbps",
  },
  {
    id: 4,
    name: "Truyền hình",
    unit: "tháng",
    price: 150000,
    description: "Truyền hình cáp",
  },
];

export default function ServiceList() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Danh sách dịch vụ</h2>
        <button
          onClick={() => navigate("/service/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm dịch vụ
        </button>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên dịch vụ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đơn vị
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockServices.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{service.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">{service.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{service.unit}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {service.price.toLocaleString("vi-VN")} VNĐ
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/service/${service.id}/edit`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {mockServices.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có dịch vụ nào</h3>
          <p className="text-gray-600 mb-4">Thêm dịch vụ đầu tiên cho tòa nhà của bạn</p>
          <button
            onClick={() => navigate("/service/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thêm dịch vụ
          </button>
        </div>
      )}
    </div>
  );
}