import { Button, Tag, Skeleton, Popconfirm, Tabs, Card, Empty } from "antd";
import { useNavigate, useParams, Link } from "react-router";
import { useRoom, useDeleteRoom } from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { 
  DoorOpen, Home, Pencil, Trash2, Hash, Maximize, 
  Users, DollarSign, AlignLeft, Image as ImageIcon, Package, 
  ChevronRight, Calendar, Info, History as HistoryIcon, ArrowLeft
} from "lucide-react";
import { formatStatusRoom } from "../../../../Constants/Helper";
import { useTokenStore } from "../../../../features/auth/stores/authStore";

const DetailRoom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: room, isLoading } = useRoom(id || "");
  const deleteMutation = useDeleteRoom();
  const { role } = useTokenStore();

  const handleClose = () => navigate(-1);

  const handleDelete = () => {
    deleteMutation.mutate(id as any, {
      onSuccess: () => navigate("/manage/rooms", { replace: true }),
    });
  };

  const statusConfig: any = {
    AVAILABLE: { label: "Phòng trống", color: "green", bg: "bg-green-50", text: "text-green-600" },
    VACANT: { label: "Phòng trống", color: "green", bg: "bg-green-50", text: "text-green-600" },
    OCCUPIED: { label: "Đã thuê", color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
    RENTED: { label: "Đã thuê", color: "blue", bg: "bg-blue-50", text: "text-blue-600" },
    MAINTENANCE: { label: "Bảo trì", color: "orange", bg: "bg-orange-50", text: "text-orange-600" },
  };

  const currentStatus = room?.status ? (statusConfig[room.status.toUpperCase()] || { label: formatStatusRoom(room.status as any), color: "default", bg: "bg-slate-50", text: "text-slate-600" }) : { label: "Không xác định", color: "default", bg: "bg-slate-50", text: "text-slate-600" };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Empty description="Không tìm thấy thông tin phòng" />
        <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} className="mt-4">Quay lại</Button>
      </div>
    );
  }

  const items = [
    {
      key: "overview",
      label: (
        <span className="flex items-center gap-2">
          <Info size={16} />
          Tổng quan
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 m-0">
                  <AlignLeft size={18} className="text-emerald-500" />
                  Mô tả chi tiết
                </h3>
              </div>
              <div className="p-6">
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                  {room.description || "Chưa có mô tả cho phòng này."}
                </div>
              </div>
            </Card>

            {/* Config Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:border-emerald-200 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Maximize size={20} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Diện tích</div>
                  <div className="font-bold text-slate-700">{room.area ? `${room.area} m²` : "—"}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:border-blue-200 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Sức chứa</div>
                  <div className="font-bold text-slate-700">{room.capacity ? `${room.capacity} người` : "—"}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 hover:border-amber-200 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <DollarSign size={20} />
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">Giá cơ bản</div>
                  <div className="font-bold text-slate-700">{room.base_price ? Number(room.base_price).toLocaleString('vi-VN') : "0"}đ</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Side Info */}
            <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden" bodyStyle={{ padding: '24px' }}>
              <h3 className="font-bold text-slate-700 mb-4 block flex justify-between">
                Hành chính
                {role === "Owner" && <Tag color="gold" className="m-0 text-[10px]">Owner View</Tag>}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-400">Mã phòng</span>
                  <span className="font-bold text-slate-700 uppercase">{room.code || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-400">Dãy/Tầng</span>
                  <span className="font-medium text-slate-700">{(room as any)?.floor?.name || "—"}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2">
                  <span className="text-slate-400">Thuộc nhà</span>
                  <span className="font-medium text-slate-700 truncate max-w-[150px]" title={(room as any)?.property?.name}>
                    {(room as any)?.property?.name || "—"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white" bodyStyle={{ padding: '24px' }}>
               <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} className="text-emerald-400" />
                  <span className="font-bold">Thời gian cập nhật</span>
               </div>
               <div className="text-slate-300 text-sm">
                  Cập nhật lần cuối vào lúc:<br/>
                  <span className="text-white font-medium">{room.updated_at ? new Date(room.updated_at).toLocaleString('vi-VN') : "—"}</span>
               </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: "assets",
      label: (
        <span className="flex items-center gap-2">
          <Package size={16} />
          Tài sản ({room.assets?.length || 0})
        </span>
      ),
      children: (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {!room.assets || room.assets.length === 0 ? (
            <Empty description="Không có tài sản nào được gán cho phòng này" className="py-12 bg-white rounded-2xl border border-dashed border-slate-200" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {room.assets.map((asset: any) => (
                <Card key={asset.id} className="rounded-2xl border-slate-100 hover:border-emerald-200 transition-all shadow-sm group">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                      <Package size={20} className="text-slate-400 group-hover:text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-700">{asset.name}</div>
                      <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">SN: {asset.serial || "N/A"}</div>
                      <Tag color={asset.condition?.toLowerCase() === 'good' ? 'green' : 'orange'} className="mt-2 text-[10px] rounded-full border-none px-2 uppercase">
                        {asset.condition || 'Bình thường'}
                      </Tag>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "media",
      label: (
        <span className="flex items-center gap-2">
          <ImageIcon size={16} />
          Hình ảnh ({room.images?.length || 0})
        </span>
      ),
      children: (
        <div className="animate-in zoom-in-95 duration-500">
           {!room.images || room.images.length === 0 ? (
            <Empty description="Chưa có hình ảnh nào cho phòng này" className="py-12 bg-white rounded-2xl border border-dashed border-slate-200" />
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {room.images.map((img: any) => (
                <div key={img.id} className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-sm break-inside-avoid">
                  <img 
                    src={img.url} 
                    alt="room config" 
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="primary" shape="circle" icon={<Maximize size={18} />} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
       key: "history",
       label: (
         <span className="flex items-center gap-2">
           <HistoryIcon size={16} />
           Lịch sử
         </span>
       ),
       children: (
         <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 animate-in fade-in duration-500">
            <HistoryIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-slate-400 font-medium">Tính năng lịch sử thuê phòng đang được cập nhật</h3>
            <p className="text-slate-300 text-sm mt-1">Hệ thống sẽ ghi lại các lần thay đổi khách thuê và thanh toán tại đây.</p>
         </div>
       )
    }
  ];

  return (
    <div className="w-full min-h-full bg-[#f8fafc]">
      {/* BREADCRUMB & HEADER AREA */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link to="/manage/properties" className="hover:text-emerald-500 transition-colors flex items-center gap-1">
              <Home size={14} /> Nhà trọ
            </Link>
            <ChevronRight size={14} />
            <span className="text-slate-400 truncate max-w-[150px]">{(room as any)?.property?.name}</span>
            <ChevronRight size={14} />
            <Link to="/manage/rooms" className="hover:text-emerald-500 transition-colors">Phòng</Link>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-medium">{room.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <DoorOpen size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-slate-800 m-0">{room.name}</h1>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}>
                    {currentStatus.label}
                  </div>
                </div>
                <div className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono flex items-center gap-1">
                    <Hash size={10} />
                    {room.code || "No Code"}
                  </span>
                  <span className="text-slate-200">|</span>
                  <span>Tầng: {(room as any)?.floor?.name || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {can("update", "rooms") && (
                <Button
                  type="primary"
                  icon={<Pencil size={16} />}
                  onClick={() => navigate(`/manage/rooms/editRoom/${id}`)}
                  className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl h-10 px-6 font-medium shadow-md shadow-emerald-500/20"
                >
                  Chỉnh sửa
                </Button>
              )}
              {can("delete", "rooms") && (
                <Popconfirm
                  title="Xóa phòng này?"
                  description="Dữ liệu sẽ được chuyển vào thùng rác."
                  onConfirm={handleDelete}
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    icon={<Trash2 size={16} />}
                    loading={deleteMutation.isPending}
                    className="rounded-xl h-10 px-4 border-red-100 hover:bg-red-50"
                  />
                </Popconfirm>
              )}
              <Button
                icon={<ArrowLeft size={16} />}
                onClick={handleClose}
                className="rounded-xl h-10 px-4 border-slate-200 text-slate-500 hover:text-slate-700"
              >
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs 
          defaultActiveKey="overview" 
          items={items} 
          className="custom-tabs [&_.ant-tabs-nav]:mb-8 [&_.ant-tabs-ink-bar]:bg-emerald-500 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-emerald-500 [&_.ant-tabs-tab:hover]:text-emerald-400"
        />
      </div>
    </div>
  );
};

export default DetailRoom;
