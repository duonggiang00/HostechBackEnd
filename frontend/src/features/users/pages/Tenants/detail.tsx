import { useState, useEffect } from "react";
import { Button, message, Tag } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Lock, LockOpen, User, Mail, Phone } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface TenantDetail {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: string;
  is_active?: boolean;
}

const DetailTenant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<TenantDetail | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    // TODO: gọi API để lấy chi tiết người thuê theo id
    const mockData: TenantDetail = {
      id: "111e8400-e29b-41d4-a716-446655440005",
      full_name: "Vũ Thanh Huyền",
      email: "tenant@digitalhub.vn",
      phone: "0901000005",
      role: "TENANT",
      is_active: true,
    };
    setData(mockData);
    setIsLocked(!mockData.is_active);
  }, [id]);

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      // TODO: gọi API để khoá/mở khoá người thuê
      if (isLocked) {
        message.success("Mở khoá người thuê thành công");
      } else {
        message.success("Khoá người thuê thành công");
      }
      setIsLocked(!isLocked);
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center p-5 min-h-screen">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigate(-1);
              closeForm(false);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Chi tiết người thuê
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            type={isLocked ? "primary" : "default"}
            icon={
              isLocked ? (
                <LockOpen className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )
            }
            onClick={handleToggleLock}
            loading={loading}
          >
            {isLocked ? "Mở khoá" : "Khoá"}
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {data.full_name}
            </h2>
            {data.role && (
              <Tag color="cyan" className="mt-2">
                {data.role}
              </Tag>
            )}
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Email</h3>
          </div>
          <p className="text-gray-800 font-medium">{data.email}</p>
        </div>

        {/* Phone Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">
              Số Điện Thoại
            </h3>
          </div>
          <p className="text-gray-800 font-medium">{data.phone}</p>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-lg p-6 border ${
          isLocked ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isLocked ? "bg-red-200" : "bg-green-200"
            }`}
          >
            {isLocked ? (
              <Lock className="w-5 h-5 text-red-600" />
            ) : (
              <LockOpen className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <p
              className={`text-sm font-medium ${
                isLocked ? "text-red-600" : "text-green-600"
              }`}
            >
              Trạng thái tài khoản
            </p>
            <p
              className={`text-lg font-bold ${
                isLocked ? "text-red-900" : "text-green-900"
              }`}
            >
              {isLocked ? "Đã bị khoá" : "Đang hoạt động"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailTenant;
