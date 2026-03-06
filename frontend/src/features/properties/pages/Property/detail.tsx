import { useState, useEffect } from "react";
import { Button, message, Modal } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface PropertyDetail {
  name: string;
  owner: string;
  address: string;
}

const DetailProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<PropertyDetail | null>(null);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    const mockData: PropertyDetail = {
      name: "Nhà 01",
      owner: "Anh A",
      address: "123 Đường ABC, Quận 1, TP.HCM",
    };
    setData(mockData);
  }, [id]);

  const handleEdit = () => {
    closeForm(true);
    navigate(`/manage/properties/editProperty/${id}`);

  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa nhà",
      content: "Bạn có chắc chắn muốn xóa nhà này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk() {
        message.success("Xóa nhà thành công!");
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
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết nhà</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Thông tin cơ bản
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Tên nhà
              </label>
              <p className="text-lg text-gray-800 font-semibold mt-1">
                {data.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Chủ nhà
              </label>
              <p className="text-lg text-gray-800 font-semibold mt-1">
                {data.owner}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Địa chỉ</h2>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Địa chỉ chi tiết
            </label>
            <p className="text-base text-gray-800 mt-1 leading-relaxed">
              {data.address}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Tổng tầng</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">5</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Tổng phòng</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">24</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Phòng trống</p>
          <p className="text-2xl font-bold text-green-900 mt-2">8</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin bổ sung
        </h2>
        <div className="grid grid-cols-2 gap-4">
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

export default DetailProperty;
