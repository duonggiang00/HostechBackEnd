import { useState } from "react";
import { Button, Tag, Skeleton, Popconfirm, Tabs } from "antd";
import type { TabsProps } from "antd";
import { useNavigate, useParams } from "react-router";
import { useFloor, useDeleteFloor } from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { Layers, Home, Pencil, Trash2, X as XIcon, Hash, SortAsc, DoorOpen, Calendar } from "lucide-react";
import Rooms from "../Rooms/Rooms";

const DetailFloor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { data: floor, isLoading } = useFloor(id || "");
  const deleteMutation = useDeleteFloor();

  const [activeTab, setActiveTab] = useState("overview");

  const handleClose = () => navigate(-1); // Back up to Property or Floor list

  const handleDelete = () => {
    deleteMutation.mutate(id || "", {
      onSuccess: () => navigate("/manage/floors", { replace: true }),
    });
  };

  const rooms = floor?.rooms || [];
  const vacant = rooms.filter((r) => r.status === "available" || r.status === "vacant").length;
  const occupied = rooms.filter((r) => r.status === "occupied" || r.status === "rented").length;

  const propertyId = (floor as any)?.property?.id || floor?.property_id;

  const overviewContent = (
    <div className="p-6 flex flex-col gap-5 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Thông tin tầng</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tên tầng</span>
            <span className="text-slate-800 font-semibold text-lg flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              {floor?.name || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mã tầng</span>
            <span className="text-slate-700 font-mono flex items-center gap-2">
              <Hash size={14} className="text-slate-400" />
              {floor?.code || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Thứ tự</span>
            <span className="text-slate-700 flex items-center gap-2">
              <SortAsc size={14} className="text-slate-400" />
              {floor?.sort_order || "—"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nhà trọ</span>
            <span className="text-slate-700 flex items-center gap-2">
              <Home size={14} className="text-slate-400" />
              {(floor as any)?.property?.name || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col items-center gap-1">
          <DoorOpen size={22} className="text-indigo-500" />
          <span className="text-2xl font-bold text-indigo-800">{rooms.length}</span>
          <span className="text-xs text-indigo-500 font-medium">Tổng phòng</span>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col items-center gap-1">
          <DoorOpen size={22} className="text-emerald-500" />
          <span className="text-2xl font-bold text-emerald-800">{vacant}</span>
          <span className="text-xs text-emerald-500 font-medium">Phòng trống</span>
        </div>
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex flex-col items-center gap-1">
          <DoorOpen size={22} className="text-rose-500" />
          <span className="text-2xl font-bold text-rose-800">{occupied}</span>
          <span className="text-xs text-rose-500 font-medium">Đã cho thuê</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11} /> Ngày tạo</span>
          <span className="text-sm text-slate-600 font-medium">
            {floor?.created_at ? new Date(floor.created_at).toLocaleDateString("vi-VN") : "—"}
          </span>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={11} /> Cập nhật</span>
          <span className="text-sm text-slate-600 font-medium">
            {floor?.updated_at ? new Date(floor.updated_at).toLocaleDateString("vi-VN") : "—"}
          </span>
        </div>
      </div>
    </div>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: <span className="px-2 font-medium">TỔNG QUAN TẦNG</span>,
      children: overviewContent,
    },
    {
      key: 'rooms',
      label: <span className="px-2 font-medium">QUẢN LÝ PHÒNG</span>,
      children: <div className="animate-in fade-in duration-500 pt-2"><Rooms propertyId={propertyId} floorId={id} /></div>,
    },
  ];

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-5xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[80vh]">

        {/* HEADER */}
        <div className="px-6 py-5 bg-white flex justify-between items-center relative z-10 transition-shadow">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers size={20} className="text-indigo-500" />
              Chi tiết tầng
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading ? "Đang tải..." : (floor?.name || "—")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can("update", "floors") && !isLoading && (
              <Button
                icon={<Pencil size={14} />}
                onClick={() => navigate(`/manage/floors/editFloor/${id}`)}
                className="rounded-xl h-9 border-amber-300 text-amber-600 hover:bg-amber-50"
              >
                Sửa
              </Button>
            )}
            {can("delete", "floors") && !isLoading && (
              <Popconfirm
                title="Xóa tầng"
                description="Bạn có chắc chắn muốn xóa tầng này?"
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

        {/* BODY TABS */}
        <div className="flex-1 bg-slate-50/30">
          {isLoading ? (
            <div className="p-6"><Skeleton active paragraph={{ rows: 6 }} /></div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="custom-tabs px-6"
              size="large"
              tabBarStyle={{ marginBottom: 0, paddingLeft: "16px", paddingRight: "16px", borderBottom: "1px solid #f1f5f9" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailFloor;
