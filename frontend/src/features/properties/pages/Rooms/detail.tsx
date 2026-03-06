import { useState, useEffect } from "react";
import { Button, message, Modal, Tag } from "antd";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Image,
  DollarSign,
} from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type {
  RoomDetail,
  RoomPhoto,
  RoomPrice,
} from "../../../../Types/Room.type";

const DetailRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [data, setData] = useState<RoomDetail | null>(null);
  const [photos, setPhotos] = useState<RoomPhoto[]>([]);
  const [prices, setPrices] = useState<RoomPrice[]>([]);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    // TODO: gọi API để lấy chi tiết phòng theo id
    const mockData: RoomDetail = {
      name: "Phòng 101",
      floor_id: { id: 1, name: "Tầng 1" },
      zone_id: { id: 1, name: "Khu A" },
      status: 1,
    };
    setData(mockData);

    // TODO: gọi API để lấy hình ảnh phòng
    const mockPhotos: RoomPhoto[] = [
      {
        id: 1,
        room_id: 1,
        photo_url: "https://via.placeholder.com/300x200?text=Phòng+1",
        photo_name: "Phòng chính",
        description: "Hình ảnh toàn cảnh phòng",
        created_at: "2026-02-28",
      },
      {
        id: 2,
        room_id: 1,
        photo_url: "https://via.placeholder.com/300x200?text=Phòng+2",
        photo_name: "Phòng tắm",
        description: "Hình ảnh phòng tắm",
        created_at: "2026-02-28",
      },
      {
        id: 3,
        room_id: 1,
        photo_url: "https://via.placeholder.com/300x200?text=Phòng+3",
        photo_name: "Bếp",
        description: "Hình ảnh khu bếp",
        created_at: "2026-02-28",
      },
    ];
    setPhotos(mockPhotos);

    // TODO: gọi API để lấy bảng giá phòng
    const mockPrices: RoomPrice[] = [
      {
        id: 1,
        room_id: 1,
        price: 5000000,
        currency: "VND",
        price_type: "monthly",
        effective_date: "2026-01-01",
        is_active: true,
      },
      {
        id: 2,
        room_id: 1,
        price: 14000000,
        currency: "VND",
        price_type: "quarterly",
        effective_date: "2026-01-01",
        is_active: true,
      },
      {
        id: 3,
        room_id: 1,
        price: 54000000,
        currency: "VND",
        price_type: "yearly",
        effective_date: "2026-01-01",
        is_active: true,
      },
    ];
    setPrices(mockPrices);
  }, [id]);

  const handleEdit = () => {
    closeForm(true);
    navigate(`/manage/properties/editRoom/${id}`);

  };

  const handleDelete = () => {
    Modal.confirm({
      title: "Xóa phòng",
      content: "Bạn có chắc chắn muốn xóa phòng này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk() {
        message.success("Xóa phòng thành công!");
        closeForm(false);
        navigate(-1);
      },
    });
  };

  if (!data) return <div className="p-5">Đang tải...</div>;

  const statusConfig = {
    1: { label: "Trống", color: "green" },
    2: { label: "Đã cho thuê", color: "blue" },
    3: { label: "Bảo trì", color: "orange" },
  };

  const currentStatus = statusConfig[
    data.status as keyof typeof statusConfig
  ] || { label: "Không xác định", color: "default" };

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
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết phòng</h1>
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

      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin phòng
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Tên phòng</p>
              <p className="text-2xl font-bold text-gray-800">{data.name}</p>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-2">Trạng thái</p>
            <Tag color={currentStatus.color} className="text-base px-3 py-1">
              {currentStatus.label}
            </Tag>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 font-medium">Tầng</p>
          <p className="text-lg font-bold text-purple-800 mt-2">
            {data.floor_id.name}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-500">
          <p className="text-sm text-gray-600 font-medium">Khu vực</p>
          <p className="text-lg font-bold text-pink-800 mt-2">
            {data.zone_id.name}
          </p>
        </div>
      </div>

      {/* Hình ảnh phòng */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-700">
            Hình ảnh phòng
          </h2>
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex flex-col rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.photo_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50">
                  <p className="font-semibold text-sm text-gray-800">
                    {photo.photo_name}
                  </p>
                  {photo.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {photo.description}
                    </p>
                  )}
                  {photo.created_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {photo.created_at}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Không có hình ảnh</p>
        )}
      </div>

      {/* Bảng giá phòng */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-700">Bảng giá</h2>
        </div>
        {prices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Loại giá
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Giá tiền
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Loại tiền
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Ngày hiệu lực
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, index) => (
                  <tr
                    key={price.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-gray-800 font-medium">
                      {price.price_type === "monthly"
                        ? "Hàng tháng"
                        : price.price_type === "quarterly"
                          ? "Hàng quý"
                          : "Hàng năm"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-semibold text-green-600">
                      {price.price.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {price.currency}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {price.effective_date}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Tag color={price.is_active ? "green" : "red"}>
                        {price.is_active ? "Hoạt động" : "Không hoạt động"}
                      </Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Không có bảng giá</p>
        )}
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Thông tin bổ sung
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Mã phòng:</span>
            <p className="text-gray-800 font-medium">#RM{id}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Lần cập nhật:</span>
            <p className="text-gray-800 font-medium">24/02/2026</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Ngày tạo:</span>
            <p className="text-gray-800 font-medium">24/02/2026</p>
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

export default DetailRoom;
