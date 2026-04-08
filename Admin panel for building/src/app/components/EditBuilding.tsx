import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface BuildingData {
  name: string;
  address: string;
  area: number;
  shared_area: number;
  default_billing_cycle: string;
  default_due_day: number;
  default_cutoff_day: number;
  bank_accounts: BankAccount[];
  default_rent_price_per_m2: number;
  default_deposit_months: number;
}

interface EditBuildingProps {
  onBack: () => void;
  buildingData: BuildingData;
}

export default function EditBuilding({ onBack, buildingData }: EditBuildingProps) {
  const [formData, setFormData] = useState(buildingData);

  const handleSave = () => {
    // Mock save functionality
    console.log("Saving building data:", formData);
    alert("Đã lưu thành công!");
    onBack();
  };

  const handleBankAccountChange = (index: number, field: keyof BankAccount, value: string) => {
    const updatedAccounts = [...formData.bank_accounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setFormData({ ...formData, bank_accounts: updatedAccounts });
  };

  const addBankAccount = () => {
    setFormData({
      ...formData,
      bank_accounts: [
        ...formData.bank_accounts,
        { bank_name: "", account_number: "", account_holder: "" },
      ],
    });
  };

  const removeBankAccount = (index: number) => {
    const updatedAccounts = formData.bank_accounts.filter((_, i) => i !== index);
    setFormData({ ...formData, bank_accounts: updatedAccounts });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa thông tin tòa nhà</h2>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Lưu thay đổi
        </button>
      </div>

      {/* Edit Form */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên tòa nhà</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích (m²)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích lối đi chung (m²)</label>
              <input
                type="number"
                value={formData.shared_area}
                onChange={(e) => setFormData({ ...formData, shared_area: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Billing & Payment Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thanh toán</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kỳ hạn thanh toán hóa đơn</label>
              <select
                value={formData.default_billing_cycle}
                onChange={(e) => setFormData({ ...formData, default_billing_cycle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Hàng tháng</option>
                <option value="quarterly">Hàng quý</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hạn ngày thanh toán</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.default_due_day}
                onChange={(e) => setFormData({ ...formData, default_due_day: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày chốt số đồng hồ</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.default_cutoff_day}
                onChange={(e) => setFormData({ ...formData, default_cutoff_day: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tài khoản ngân hàng</h3>
            <button
              onClick={addBankAccount}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Thêm tài khoản
            </button>
          </div>
          <div className="space-y-4">
            {formData.bank_accounts.map((account, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên ngân hàng</label>
                    <input
                      type="text"
                      value={account.bank_name}
                      onChange={(e) => handleBankAccountChange(index, "bank_name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản</label>
                    <input
                      type="text"
                      value={account.account_number}
                      onChange={(e) => handleBankAccountChange(index, "account_number", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chủ tài khoản</label>
                    <input
                      type="text"
                      value={account.account_holder}
                      onChange={(e) => handleBankAccountChange(index, "account_holder", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {formData.bank_accounts.length > 1 && (
                  <button
                    onClick={() => removeBankAccount(index)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700"
                  >
                    Xóa tài khoản
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Rental Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt cho thuê</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá thuê theo mét vuông (VNĐ/m²)</label>
              <input
                type="number"
                value={formData.default_rent_price_per_m2}
                onChange={(e) => setFormData({ ...formData, default_rent_price_per_m2: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số tháng cọc</label>
              <input
                type="number"
                min="0"
                value={formData.default_deposit_months}
                onChange={(e) => setFormData({ ...formData, default_deposit_months: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
