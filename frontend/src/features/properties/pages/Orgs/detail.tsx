import { useState, useEffect } from "react";
import { Button, message, Modal } from "antd";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface OrgDetail {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const DetailOrg = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<OrgDetail | null>(null);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    const mockData: OrgDetail = {
      name: "Công ty ABC",
      email: "info@abc.com",
      phone: "0912345678",
      address: "123 Đường XYZ, Quận 1, TP.HCM",
    };
    setData(mockData);
  }, [id]);

  const handleEdit = () => {
    closeForm(true);
    navigate(`/manage/properties/editOrg/${id}`);

  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa tổ chức",
      content: "Bạn có chắc chắn muốn xóa tổ chức này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk() {
        message.success("Xóa tổ chức thành công!");
        closeForm(false);
        navigate(-1);
      },
    });
  };

  if (!data) return <div className="p-5">Đang tải...</div>;

  return (
    <div className="flex flex-col gap-6 p-5 max-w-4xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết tổ chức</h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<Edit className="w-4 h-4" />}
            onClick={handleEdit}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
          >
            Xóa
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Building className="w-8 h-8" />
          <h2 className="text-3xl font-bold">{data.name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-700">Email</h3>
          </div>
          <p className="text-lg text-gray-800 font-medium break-all">
            {data.email}
          </p>
          <a
            href={`mailto:${data.email}`}
            className="text-blue-500 hover:text-blue-700 text-sm mt-2 inline-block"
          >
            Gửi email →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center gap-3 mb-3">
            <Phone className="w-6 h-6 text-green-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              Số điện thoại
            </h3>
          </div>
          <p className="text-lg text-gray-800 font-medium">{data.phone}</p>
          <a
            href={`tel:${data.phone}`}
            className="text-blue-500 hover:text-blue-700 text-sm mt-2 inline-block"
          >
            Gọi điện →
          </a>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-700">Địa chỉ</h3>
        </div>
        <p className="text-base text-gray-800 leading-relaxed">
          {data.address}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Phòng thuê</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">8</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">
            Hợp đồng hoạt động
          </p>
          <p className="text-3xl font-bold text-purple-900 mt-2">1</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
          <p className="text-sm text-pink-600 font-medium">Thanh toán</p>
          <p className="text-3xl font-bold text-pink-900 mt-2">Đúng hạn</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin bổ sung
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Mã tổ chức:</span>
            <p className="text-gray-800 font-medium">#ORG{id}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Trạng thái:</span>
            <p className="text-green-600 font-medium">✓ Hoạt động</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Ngày tạo:</span>
            <p className="text-gray-800 font-medium">24/02/2026</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Lần cập nhật:</span>
            <p className="text-gray-800 font-medium">24/02/2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailOrg;
