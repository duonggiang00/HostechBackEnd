import { Table, Button, Tooltip, Popconfirm, Tag } from "antd";
import { Plus, Eye, Settings2, Trash2, Layers } from "lucide-react";
import { useNavigate } from "react-router";
import {
  useFloors,
  useDeleteFloor,
} from "../hooks/useProperties";
import { usePermission } from "../../../shared/hooks/usePermission";
import RoomListInline from "./RoomListInline";

interface FloorListInlineProps {
  propertyId: string;
}

const FloorListInline = ({ propertyId }: FloorListInlineProps) => {
  const navigate = useNavigate();
  const { can } = usePermission();

  // Queries
  const queryParams: Record<string, any> = {
    "filter[property_id]": propertyId,
    sort: "sort_order",
    // Typically inline tables might want to show all without pagination or a high per_page
    per_page: 100,
  };

  const { data: paginatedData, isLoading } = useFloors(queryParams);
  const floors = (paginatedData as any)?.data || (Array.isArray(paginatedData) ? paginatedData : []);

  const deleteMutation = useDeleteFloor();

  const handleCreate = () => {
    navigate("/manage/floors/createFloor", { state: { propertyId } });
  };

  const tableColumns = [
    {
      title: "Tên tầng",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-indigo-400" />
          <span className="font-semibold text-slate-700">{text}</span>
        </div>
      )
    },
    {
      title: 'Quy mô',
      key: 'rooms_count',
      render: (_: any, record: any) => (
        <Tag color="emerald" className="rounded-md">{record.rooms_count || 0} phòng</Tag>
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
              onClick={() => navigate(`/manage/floors/detailFloor/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          {can("update", "floors") && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                size="small"
                icon={<Settings2 size={14} />}
                onClick={() => navigate(`/manage/floors/editFloor/${record.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
          )}
          {can("delete", "floors") && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa tầng"
                description="Bạn có chắc chắn muốn xóa?"
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
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl my-2 mx-2">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Layers size={16} className="text-indigo-500" />
          Danh sách tầng
        </h4>
        {can("create", "floors") && (
          <Button
            size="small"
            type="primary"
            icon={<Plus size={14} />}
            onClick={handleCreate}
            className="bg-indigo-500 hover:bg-indigo-600 border-none shadow-sm flex items-center gap-1 text-xs px-3"
          >
            Thêm tầng
          </Button>
        )}
      </div>

      <Table
        columns={tableColumns}
        dataSource={floors}
        rowKey="id"
        pagination={false}
        loading={isLoading}
        size="small"
        className="nested-table-inline border border-slate-200 rounded-lg overflow-hidden bg-white"
        rowClassName="hover:bg-indigo-50/30 transition-colors"
        expandable={{
          expandedRowRender: (record) => <RoomListInline floorId={record.id} propertyId={propertyId} />,
          rowExpandable: () => true,
        }}
        locale={{
          emptyText: "Nhà này chưa có tầng nào.",
        }}
      />
    </div>
  );
};

export default FloorListInline;
