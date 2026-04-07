import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Info, 
  Image, 
  Users, 
  FileText, 
  Gauge,
  Receipt,
  Wifi,
  Droplet,
  Zap,
  Trash2,
  Wind,
  Bed,
  Archive,
  Tv,
  Eye
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  moveInDate: string;
}

interface Contract {
  id: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  status: 'active' | 'expired' | 'pending';
}

interface MeterReading {
  id: string;
  date: string;
  electricReading: number;
  waterReading: number;
  electricUsage: number;
  waterUsage: number;
}

interface Invoice {
  id: string;
  month: string;
  roomRent: number;
  electric: number;
  water: number;
  services: number;
  total: number;
  status: 'paid' | 'unpaid' | 'overdue';
  dueDate: string;
}

export function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'images' | 'tenants' | 'contracts' | 'meters' | 'invoices'>('info');

  // Mock data - in real app, this would come from API/database
  const roomData = {
    id: roomId,
    name: `Phòng ${roomId}`,
    area: 25,
    maxOccupants: 2,
    price: 3500000,
    status: 'occupied' as const,
    description: 'Phòng rộng rãi, thoáng mát, đầy đủ tiện nghi. Vị trí thuận lợi gần trung tâm thành phố.',
    services: [
      { id: '1', name: 'Wifi miễn phí', icon: Wifi, included: true },
      { id: '2', name: 'Vệ sinh', icon: Trash2, included: true },
      { id: '3', name: 'Điện', icon: Zap, included: false },
      { id: '4', name: 'Nước', icon: Droplet, included: false },
    ],
    assets: [
      { id: '1', name: 'TV', icon: Tv, quantity: 1 },
      { id: '2', name: 'Điều hòa', icon: Wind, quantity: 1 },
      { id: '3', name: 'Giường', icon: Bed, quantity: 2 },
      { id: '4', name: 'Tủ quần áo', icon: Archive, quantity: 1 },
    ],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260066-6bc2c0923c44?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
    ],
  };

  const tenants: Tenant[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'nguyenvana@email.com',
      moveInDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Trần Thị B',
      phone: '0907654321',
      email: 'tranthib@email.com',
      moveInDate: '2024-01-15',
    },
  ];

  const contracts: Contract[] = [
    {
      id: '1',
      startDate: '2024-01-15',
      endDate: '2025-01-14',
      monthlyRent: 3500000,
      deposit: 7000000,
      status: 'active',
    },
    {
      id: '2',
      startDate: '2023-01-15',
      endDate: '2024-01-14',
      monthlyRent: 3200000,
      deposit: 6400000,
      status: 'expired',
    },
  ];

  const currentElectric = 1250;
  const currentWater = 45;
  const electricUsageThisMonth = 120;
  const waterUsageThisMonth = 8;

  const meterReadings: MeterReading[] = [
    {
      id: '1',
      date: '2026-03-01',
      electricReading: 1250,
      waterReading: 45,
      electricUsage: 120,
      waterUsage: 8,
    },
    {
      id: '2',
      date: '2026-02-01',
      electricReading: 1130,
      waterReading: 37,
      electricUsage: 115,
      waterUsage: 7,
    },
    {
      id: '3',
      date: '2026-01-01',
      electricReading: 1015,
      waterReading: 30,
      electricUsage: 130,
      waterUsage: 9,
    },
    {
      id: '4',
      date: '2025-12-01',
      electricReading: 885,
      waterReading: 21,
      electricUsage: 125,
      waterUsage: 8,
    },
  ];

  const invoices: Invoice[] = [
    {
      id: '1',
      month: '03/2026',
      roomRent: 3500000,
      electric: 480000,
      water: 120000,
      services: 200000,
      total: 4300000,
      status: 'unpaid',
      dueDate: '2026-04-05',
    },
    {
      id: '2',
      month: '02/2026',
      roomRent: 3500000,
      electric: 450000,
      water: 110000,
      services: 200000,
      total: 4260000,
      status: 'paid',
      dueDate: '2026-03-05',
    },
    {
      id: '3',
      month: '01/2026',
      roomRent: 3500000,
      electric: 520000,
      water: 130000,
      services: 200000,
      total: 4350000,
      status: 'paid',
      dueDate: '2026-02-05',
    },
  ];

  const tabs = [
    { id: 'info' as const, label: 'Thông tin', icon: Info },
    { id: 'images' as const, label: 'Hình ảnh', icon: Image },
    { id: 'tenants' as const, label: 'Người thuê', icon: Users },
    { id: 'contracts' as const, label: 'Hợp đồng', icon: FileText },
    { id: 'meters' as const, label: 'Đồng hồ', icon: Gauge },
    { id: 'invoices' as const, label: 'Hóa đơn', icon: Receipt },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
      case 'active':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'available':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
      case 'expired':
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'overdue':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      occupied: 'Đang cho thuê',
      available: 'Trống',
      maintenance: 'Bảo trì',
      active: 'Đang hiệu lực',
      expired: 'Hết hạn',
      pending: 'Chờ xử lý',
      paid: 'Đã thanh toán',
      unpaid: 'Chưa thanh toán',
      overdue: 'Quá hạn',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Quay lại</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{roomData.name}</h1>
                <p className="text-sm text-gray-500">Tầng {roomId?.charAt(0)}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getStatusColor(roomData.status)}`}>
              {getStatusText(roomData.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên phòng:</span>
                    <span className="font-medium text-gray-900">{roomData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diện tích:</span>
                    <span className="font-medium text-gray-900">{roomData.area} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giới hạn người:</span>
                    <span className="font-medium text-gray-900">{roomData.maxOccupants} người</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giá thuê:</span>
                    <span className="font-medium text-blue-600">
                      {roomData.price.toLocaleString('vi-VN')} đ/tháng
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(roomData.status)}`}>
                      {getStatusText(roomData.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Services Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Dịch vụ đi kèm</h2>
                <div className="space-y-3">
                  {roomData.services.map((service) => {
                    const ServiceIcon = service.icon;
                    return (
                      <div key={service.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <ServiceIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-gray-900">{service.name}</span>
                        </div>
                        <span className={`text-sm ${service.included ? 'text-green-600' : 'text-orange-600'}`}>
                          {service.included ? 'Miễn phí' : 'Tính phí'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Mô tả phòng</h2>
              <p className="text-gray-700 leading-relaxed">{roomData.description}</p>
            </div>

            {/* Assets */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Tài sản trong phòng</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">STT</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tên tài sản</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {roomData.assets.map((asset, index) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-gray-900">{asset.name}</td>
                        <td className="px-6 py-4 text-center text-gray-900">{asset.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roomData.images.map((image, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <img
                  src={image}
                  alt={`Phòng ${roomId} - Ảnh ${index + 1}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Họ tên</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Số điện thoại</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ngày vào ở</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{tenant.name}</td>
                      <td className="px-6 py-4 text-gray-900">{tenant.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{tenant.email}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(tenant.moveInDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hợp đồng #{contract.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(contract.startDate).toLocaleDateString('vi-VN')} - {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tiền thuê/tháng</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {contract.monthlyRent.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tin cọc</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {contract.deposit.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày kết thúc</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meters Tab */}
        {activeTab === 'meters' && (
          <div className="space-y-6">
            {/* Current Readings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Electric Meter */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Đồng hồ điện</h3>
                    <p className="text-sm text-gray-500">Cập nhật hàng tháng</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chỉ số hiện tại:</span>
                    <span className="font-semibold text-gray-900">{currentElectric} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điện dùng tháng này:</span>
                    <span className="font-semibold text-yellow-600">{electricUsageThisMonth} kWh</span>
                  </div>
                </div>
              </div>

              {/* Water Meter */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Droplet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Đồng hồ nước</h3>
                    <p className="text-sm text-gray-500">Cập nhật hàng tháng</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chỉ số hiện tại:</span>
                    <span className="font-semibold text-gray-900">{currentWater} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nước dùng tháng này:</span>
                    <span className="font-semibold text-blue-600">{waterUsageThisMonth} m³</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meter Readings History */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Lịch sử chốt số đồng hồ</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ngày chốt</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Điện (kWh)</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tiêu thụ điện</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Nước (m³)</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tiêu thụ nước</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {meterReadings.map((reading) => (
                      <tr key={reading.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {new Date(reading.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {reading.electricReading}
                        </td>
                        <td className="px-6 py-4 text-right text-yellow-600">
                          {reading.electricUsage} kWh
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900">
                          {reading.waterReading}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600">
                          {reading.waterUsage} m³
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Danh sách hóa đơn</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tháng</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tiền phòng</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tiền điện</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tiền nước</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Dịch vụ</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Tổng cộng</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Hạn thanh toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{invoice.month}</td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {invoice.roomRent.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {invoice.electric.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {invoice.water.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        {invoice.services.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {invoice.total.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}