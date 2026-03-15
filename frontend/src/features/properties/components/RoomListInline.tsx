import { Table, Button, Tooltip, Popconfirm, Tag } from "antd";
import { Plus, Eye, Settings2, Trash2, DoorOpen } from "lucide-react";
import { useNavigate } from "react-router";
import {
  useRooms,
  useDeleteRoom,
} from "../hooks/useProperties";
import { usePermission } from "../../../shared/hooks/usePermission";
import { formatStatusRoom } from "../../../Constants/Helper";

interface RoomListInlineProps {
  floorId: string;
  propertyId: string;
}

const RoomListInline = ({ floorId, propertyId }: RoomListInlineProps) => {
  const navigate = useNavigate();
  const { can } = usePermission();

  // Queries
  const queryParams: Record<string, any> = {
    "filter[floor_id]": floorId,
    sort: "code",
    // Typically inline tables might want to show all without pagination or a high per_page
    per_page: 100,
  };

  const { data: paginatedData, isLoading } = useRooms(queryParams);
  const rooms = (paginatedData as any)?.data || (Array.isArray(paginatedData) ? paginatedData : []);

  const deleteMutation = useDeleteRoom();

  const handleCreate = () => {
    navigate("/manage/rooms/createRoom", { state: { floorId, propertyId } });
  };

  const tableColumns = [
    {
      title: "Tên phòng",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <DoorOpen size={14} className="text-emerald-500" />
          <span className="font-semibold text-slate-700">{text}</span>
        </div>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <Tag color={status === "AVAILABLE" || status === "VACANT" ? "green" : status === "OCCUPIED" || status === "RENTED" ? "blue" : "default"} className="font-medium rounded-md uppercase text-[10px]">
          {formatStatusRoom(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: 'right' as const,
      width: 150,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-1">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} />}
              onClick={() => navigate(`/manage/rooms/detailRoom/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          {can("update", "rooms") && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<Settings2 size={14} />}
                onClick={() => navigate(`/manage/rooms/editRoom/${record.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
          )}
          {can("delete", "rooms") && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa phòng"
                description="Bạn có chắm chắn muốn xóa?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  className="text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50"
                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-lg ml-6 mr-2 my-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-600 flex items-center gap-2 uppercase tracking-wide">
          <DoorOpen size={14} className="text-emerald-500" />
          Danh sách phòng
        </h4>
        {can("create", "rooms") && (
          <Button
            size="small"
            type="primary"
            icon={<Plus size={12} />}
            onClick={handleCreate}
            className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-sm flex items-center gap-1 text-[11px] px-2 h-7"
          >
            Thêm phòng
          </Button>
        )}
      </div>

      <Table
        columns={tableColumns}
        dataSource={rooms}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        size="small"
        className="nested-table-inline text-sm border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm"
        rowClassName="hover:bg-emerald-50/30 transition-colors"
        locale={{
          emptyText: "Tầng này chưa có phòng nào.",
        }}
      />
    </div>
  );
};

export default RoomListInline;
