import { useState } from "react";
import { Edit, Building2, MapPin, Square, Share2, Calendar, CreditCard, Gauge, Wallet, Key } from "lucide-react";
import EditBuilding from "./EditBuilding";

// Mock data for building
const mockBuildingData = {
  name: "Tòa nhà Sunrise Tower",
  address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  area: 2500,
  shared_area: 350,
  default_billing_cycle: "monthly",
  default_due_day: 15,
  default_cutoff_day: 25,
  bank_accounts: [
    {
      bank_name: "Vietcombank",
      account_number: "0123456789",
      account_holder: "CÔNG TY TNHH QUẢN LÝ TÒA NHÀ SUNRISE",
    },
    {
      bank_name: "Techcombank",
      account_number: "9876543210",
      account_holder: "CÔNG TY TNHH QUẢN LÝ TÒA NHÀ SUNRISE",
    },
  ],
  default_rent_price_per_m2: 150000,
  default_deposit_months: 2,
};

const billingCycleLabels: Record<string, string> = {
  monthly: "Hàng tháng",
  quarterly: "Hàng quý",
  yearly: "Hàng năm",
};

export default function BuildingDetails() {
  const [isEditMode, setIsEditMode] = useState(false);

  if (isEditMode) {
    return <EditBuilding onBack={() => setIsEditMode(false)} buildingData={mockBuildingData} />;
  }

  return (
    <div>
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Thông tin tòa nhà</h2>
        <button
          onClick={() => setIsEditMode(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Chỉnh sửa
        </button>
      </div>

      {/* Building Information Cards */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Tên tòa nhà</p>
                <p className="font-medium text-gray-900">{mockBuildingData.name}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Địa chỉ</p>
                <p className="font-medium text-gray-900">{mockBuildingData.address}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Square className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Diện tích</p>
                <p className="font-medium text-gray-900">{mockBuildingData.area.toLocaleString("vi-VN")} m²</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Diện tích lối đi chung</p>
                <p className="font-medium text-gray-900">{mockBuildingData.shared_area.toLocaleString("vi-VN")} m²</p>
              </div>
            </div>
          </div>
        </div>

        {/* Billing & Payment Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thanh toán</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Kỳ hạn thanh toán hóa đơn</p>
                <p className="font-medium text-gray-900">
                  {billingCycleLabels[mockBuildingData.default_billing_cycle]}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Hạn ngày thanh toán</p>
                <p className="font-medium text-gray-900">Ngày {mockBuildingData.default_due_day} hàng tháng</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Gauge className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Ngày chốt số đồng hồ</p>
                <p className="font-medium text-gray-900">Ngày {mockBuildingData.default_cutoff_day} hàng tháng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tài khoản ngân hàng</h3>
          <div className="space-y-4">
            {mockBuildingData.bank_accounts.map((account, index) => (
              <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 mb-1">{account.bank_name}</p>
                  <p className="text-sm text-gray-600">STK: {account.account_number}</p>
                  <p className="text-sm text-gray-600">{account.account_holder}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rental Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt cho thuê</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Giá thuê theo mét vuông</p>
                <p className="font-medium text-gray-900">
                  {mockBuildingData.default_rent_price_per_m2.toLocaleString("vi-VN")} VNĐ/m²
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">Số tháng cọc</p>
                <p className="font-medium text-gray-900">{mockBuildingData.default_deposit_months} tháng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
