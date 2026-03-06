import { useState, useEffect } from "react";
import { Button, message, Modal } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Edit, Trash2, Home } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface FloorDetail {
  name: string;
  rooms_count?: number;
}

const DetailFloor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<FloorDetail | null>(null);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    const mockData: FloorDetail = {
      name: "Tầng 1",
      rooms_count: 6,
    };
    setData(mockData);
  }, [id]);

  const handleEdit = () => {
    closeForm(true);
    navigate(`/manage/properties/editFloor/${id}`);

  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa tầng",
      content: "Bạn có chắc chắn muốn xóa tầng này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk() {
        message.success("Xóa tầng thành công!");
        closeForm(false);
        navigate(-1);
      },
    });
  };

  if (!data) return <div className="p-5">Đang tải...</div>;

  return (
    <div className="flex flex-col gap-6 p-5 max-w-3xl mx-auto">
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
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết tầng</h1>
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

      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin tầng
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Tên tầng
            </label>
            <p className="text-2xl text-gray-800 font-bold mt-1">{data.name}</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Home className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-sm text-orange-600 font-medium">
                Tổng phòng trên tầng
              </p>
              <p className="text-xl font-bold text-orange-800">
                {data.rooms_count} phòng
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Phòng trống</p>
          <p className="text-2xl font-bold text-green-900 mt-2">2</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 font-medium">Phòng đã cho thuê</p>
          <p className="text-2xl font-bold text-red-900 mt-2">4</p>
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

export default DetailFloor;
