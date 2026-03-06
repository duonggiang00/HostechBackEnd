import { useState, useEffect } from "react";
import { Button, message, Modal, Tag } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Edit, Trash2, Gauge } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type { MeterDetail } from "../../../../Types/Meter.Type";

const DetailMeter = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<MeterDetail | null>(null);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    // TODO: gọi API để lấy chi tiết đồng hồ theo id
    const mockData: MeterDetail = {
      name: "Đồng hồ điện 101",
      room_id: { id: 1, name: "Phòng 101" },
      meter_type: "Điện",
      meter_number: "DL12345678",
      status: 1,
    };
    setData(mockData);
  }, [id]);

  const handleEdit = () => {
    closeForm(true);
    navigate(`/manage/properties/editMeter/${id}`);

  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa đồng hồ",
      content: "Bạn có chắc chắn muốn xóa đồng hồ này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk() {
        message.success("Xóa đồng hồ thành công!");
        closeForm(false);
        navigate(-1);
      },
    });
  };

  if (!data) return <div className="p-5">Đang tải...</div>;

  const meterTypeColors: Record<
    string,
    { bg: string; text: string; color: string }
  > = {
    Điện: {
      bg: "from-yellow-50 to-yellow-100",
      text: "text-yellow-600",
      color: "yellow",
    },
    Nước: {
      bg: "from-blue-50 to-blue-100",
      text: "text-blue-600",
      color: "blue",
    },
    Gas: {
      bg: "from-orange-50 to-orange-100",
      text: "text-orange-600",
      color: "orange",
    },
  };

  const typeConfig =
    meterTypeColors[data.meter_type] || meterTypeColors["Điện"];

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
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết đồng hồ</h1>
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

      {/* Tên đồng hồ - Header */}
      <div
        className={`bg-gradient-to-r ${typeConfig.bg} rounded-lg shadow-lg p-6 border-l-4 border-yellow-500`}
      >
        <div className="flex items-center gap-3">
          <Gauge className="w-8 h-8 text-yellow-600" />
          <h2 className="text-3xl font-bold text-gray-800">{data.name}</h2>
        </div>
      </div>

      {/* Thông tin chính */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin đồng hồ
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Phòng</label>
            <p className="text-lg text-gray-800 font-semibold mt-1">
              {data.room_id.name}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-2">Trạng thái</p>
            <Tag
              color={data.status === 1 ? "green" : "red"}
              className="text-base px-3 py-1"
            >
              {data.status === 1 ? "Hoạt động" : "Không hoạt động"}
            </Tag>
          </div>
        </div>
      </div>

      {/* Loại đồng hồ & Số hiệu */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">Loại đồng hồ</p>
          <p className="text-lg font-bold text-purple-800 mt-2">
            {data.meter_type}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-500">
          <p className="text-sm text-gray-600 font-medium">Số hiệu</p>
          <p className="text-lg font-bold text-pink-800 mt-2">
            {data.meter_number}
          </p>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Chỉ số hiện tại</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">0</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">Chỉ số trước</p>
          <p className="text-2xl font-bold text-green-900 mt-2">0</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <p className="text-sm text-orange-600 font-medium">Mức sử dụng</p>
          <p className="text-2xl font-bold text-orange-900 mt-2">0</p>
        </div>
      </div>

      {/* Thông tin bổ sung */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin bổ sung
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Mã đồng hồ:</span>
            <p className="text-gray-800 font-medium">#M{id}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Lần cập nhật:</span>
            <p className="text-gray-800 font-medium">28/02/2026</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Ngày tạo:</span>
            <p className="text-gray-800 font-medium">28/02/2026</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Người tạo:</span>
            <p className="text-gray-800 font-medium">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailMeter;
