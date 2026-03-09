import { Button, Tag, Skeleton, Popconfirm } from "antd";
import { useNavigate, useParams } from "react-router";
import { useRoom, useDeleteRoom } from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { DoorOpen, Home, Layers, Pencil, Trash2, X as XIcon, Hash, Maximize, Users, DollarSign, AlignLeft } from "lucide-react";
import { formatStatusRoom } from "../../../../Constants/Helper";

const DetailRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: room, isLoading } = useRoom(id || "");
  const deleteMutation = useDeleteRoom();

  const handleClose = () => navigate(-1); // Back up to Room list or Floor details

  const handleDelete = () => {
    deleteMutation.mutate(id as any, {
      onSuccess: () => navigate("/manage/rooms", { replace: true }),
    });
  };

  const statusConfig: any = {
    AVAILABLE: { label: "Phòng trống", color: "green" },
    OCCUPIED: { label: "Đã cho thuê", color: "blue" },
    MAINTENANCE: { label: "Bảo trì", color: "orange" },
    VACANT: { label: "Phòng trống", color: "green" },
    RENTED: { label: "Đã cho thuê", color: "blue" },
  };

  const currentStatus = room?.status ? (statusConfig[room.status.toUpperCase()] || { label: formatStatusRoom(room.status as any), color: "default" }) : { label: "Không xác định", color: "default" };

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-4xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <DoorOpen size={20} className="text-emerald-500" />
              Chi tiết phòng
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading ? "Đang tải..." : (room?.name || "—")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can("update", "rooms") && !isLoading && (
              <Button
                icon={<Pencil size={14} />}
                onClick={() => navigate(`/manage/rooms/editRoom/${id}`)}
                className="rounded-xl h-9 border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                Sửa
              </Button>
            )}
            {can("delete", "rooms") && !isLoading && (
              <Popconfirm
                title="Xóa phòng"
                description="Bạn có chắc chắn muốn xóa phòng này?"
                onConfirm={handleDelete}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<Trash2 size={14} />}
                  loading={deleteMutation.isPending}
                  className="rounded-xl h-9"
                >
                  Xóa
                </Button>
              </Popconfirm>
            )}
            <Button
              type="text"
              icon={<XIcon size={20} className="text-slate-500" />}
              onClick={handleClose}
              className="hover:bg-slate-200 rounded-full w-9 h-9 flex items-center justify-center p-0 ml-2"
            />
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 flex flex-col gap-6">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : !room ? (
            <div className="text-center py-10 text-slate-500">Phòng không tồn tại</div>
          ) : (
            <>
              {/* PRIMARY INFO */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                        <DoorOpen size={32} strokeWidth={2} />
                      </div>
                      <div className="pt-1">
                        <h1 className="text-2xl font-bold text-slate-800 leading-tight">{room.name}</h1>
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                          <Tag color={currentStatus.color} className="rounded-md px-2 py-0.5 text-xs m-0 font-medium uppercase border-none">
                            {currentStatus.label}
                          </Tag>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <Hash size={14} />
                            <span className="uppercase">{room.code || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LOCATION */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Vị trí phòng</h3>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Layers size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Thuộc tầng</span>
                    </div>
                    <span className="font-semibold text-slate-800">{(room as any)?.floor?.name || (room as any).floor_id || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Home size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Thuộc nhà trọ</span>
                    </div>
                    <span className="font-semibold text-slate-800">{(room as any)?.property?.name || (room as any).property_id || "—"}</span>
                  </div>
                </div>

                {/* SPECS */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Thông số phòng</h3>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <DollarSign size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">Giá thuê (VNĐ/tháng)</span>
                    </div>
                    <span className="font-bold text-emerald-600 text-lg">{room.base_price ? Number(room.base_price).toLocaleString('vi-VN') : "—"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center gap-1 text-center">
                      <Maximize size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-500">Diện tích</span>
                      <span className="font-semibold text-slate-800">{room.area ? `${room.area} m²` : "—"}</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center gap-1 text-center">
                      <Users size={16} className="text-slate-400" />
                      <span className="text-xs text-slate-500">Sức chứa</span>
                      <span className="font-semibold text-slate-800">{room.capacity ? `${room.capacity} người` : "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {room.description && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlignLeft size={16} className="text-slate-400" />
                    Mô tả phòng
                  </h3>
                  <div className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {room.description}
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailRoom;
