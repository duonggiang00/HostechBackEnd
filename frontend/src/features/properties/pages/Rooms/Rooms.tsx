import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Modal, Input, Tag, Empty, Skeleton, Pagination } from "antd";
import { formatStatusRoom } from "../../../../Constants/Helper";
import { Plus, Eye, Trash2, RotateCcw, Search, DoorOpen, Home, Layers, Settings2 } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColumnsType } from "antd/es/table";
import {
  useRooms,
  useDeleteRoom,
  useDeletedRooms,
  useRestoreRoom,
  useForceDeleteRoom,
} from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { useDebounce } from "../../../../shared/hooks/useDebounce";

const Rooms = ({ propertyId, floorId }: { propertyId?: string; floorId?: string }) => {
  const navigate = useNavigate();
  const { can } = usePermission();

  // States
  const [searchText, setSearchText] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchText, 400);

  // Queries
  const queryParams: Record<string, any> = {};
  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (propertyId) queryParams["filter[property_id]"] = propertyId;
  if (floorId) queryParams["filter[floor_id]"] = floorId;
  queryParams.page = currentPage;
  queryParams.per_page = pageSize;

  const { data: paginatedData, isLoading } = useRooms(queryParams);
  // Support both paginated format and raw array format depending on API config
  const paginatedAny = paginatedData as any;
  const rooms = paginatedAny?.data || (Array.isArray(paginatedData) ? paginatedData : []);
  const meta = paginatedAny?.meta || { current_page: 1, last_page: 1, total: rooms.length, per_page: 10 };

  const { data: trashData, isLoading: trashLoading } = useDeletedRooms();
  const deleteMutation = useDeleteRoom();
  const restoreMutation = useRestoreRoom();
  const forceDeleteMutation = useForceDeleteRoom();

  // Handlers
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Tên phòng",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>
    },
    ...(floorId ? [] : [
      {
        title: "Tầng",
        dataIndex: ["floor", "name"],
        key: "floor",
        render: (text: string) => <span className="text-slate-600 font-medium">{text || "—"}</span>,
      }
    ]),
    ...(propertyId ? [] : [
      {
        title: "Nhà trọ",
        dataIndex: ["property", "name"],
        key: "property",
        render: (text: string) => <span className="text-slate-600 font-medium">{text || "—"}</span>,
      }
    ]),
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <Tag color={status === "AVAILABLE" || status === "VACANT" ? "green" : status === "OCCUPIED" || status === "RENTED" ? "blue" : "default"} className="font-medium rounded-md uppercase text-[11px]">
          {formatStatusRoom(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      align: 'right' as const,
      render: (_: any, record: any) => (
        <div className="flex justify-end gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => navigate(`/manage/rooms/detailRoom/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          {can("update", "rooms") && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Settings2 size={16} />}
                onClick={() => navigate(`/manage/rooms/editRoom/${record.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
          )}
          {can("delete", "rooms") && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa phòng"
                description="Bạn có chắc chắn muốn xóa phòng này?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={16} />}
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

  const isEmbedded = propertyId || floorId;

  return (
    <div className="relative w-full h-full animate-fade-in flex flex-col gap-6">

      {/* HEADER SECTION */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-gray-200/50 p-5 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <DoorOpen className="text-emerald-500" size={26} />
              Quản Lý Phòng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng số: <span className="font-semibold text-slate-700">{meta.total}</span> phòng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm kiếm phòng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 py-2 shadow-sm"
              allowClear
            />

            {can("delete", "rooms") && (
              <Button
                icon={<Trash2 size={16} />}
                onClick={() => setTrashOpen(true)}
                className="rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-500 transition-colors h-[40px]"
              >
                Thùng rác
              </Button>
            )}
            {can("create", "rooms") && (
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={() => navigate("/manage/rooms/createRoom")}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-[40px] px-5 shadow-md shadow-emerald-500/20 font-medium flex items-center gap-2 border-none"
              >
                Thêm phòng
              </Button>
            )}
          </div>
        </div>
      )}

      {/* EMBEDDED HEADER HEADER (Khi truyền propertyId/floorId) */}
      {isEmbedded && (
        <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <Input
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Tìm kiếm phòng..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-64 rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 py-2 shadow-sm"
            allowClear
          />
          <div className="flex gap-2">
            {can("delete", "rooms") && !propertyId && !floorId && (
              <Button
                icon={<Trash2 size={16} />}
                onClick={() => setTrashOpen(true)}
                className="rounded-xl border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-500 transition-colors h-[38px]"
              >
                Thùng rác
              </Button>
            )}
            {can("create", "rooms") && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={() => navigate("/manage/rooms/createRoom", { state: { propertyId, floorId } })}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-[38px] px-5 shadow-md shadow-emerald-500/20 font-medium flex items-center gap-2 border-none"
              >
                Thêm phòng
              </Button>
            )}
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 flex flex-col ${isEmbedded ? 'min-h-[400px]' : ''}`}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} className="p-4" />
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white flex-1">
            <Empty description={<span className="text-slate-500">Chưa có phòng nào</span>} />
            <Button type="primary" className="mt-4 bg-emerald-600 border-none hover:bg-emerald-500" onClick={() => navigate("/manage/rooms/createRoom", { state: { propertyId, floorId } })}>
              Tạo phòng đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <Table
              columns={columns}
              dataSource={rooms}
              rowKey="id"
              pagination={false}
              className="modern-table"
              rowClassName="hover:bg-slate-50 cursor-pointer transition-colors"
              onRow={(record) => ({
                onDoubleClick: () => navigate(`/manage/rooms/detailRoom/${record.id}`)
              })}
            />
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!isLoading && rooms.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-slate-500 text-sm">
              Hiển thị <span className="font-semibold text-slate-700">{(meta.current_page - 1) * meta.per_page + 1}</span> đến <span className="font-semibold text-slate-700">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> của <span className="font-semibold text-slate-700">{meta.total}</span> bản ghi
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={meta.total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['10', '25', '50', '100']}
              className="custom-pagination"
            />
          </div>
        )}
      </div>

      {/* TRASH MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Trash2 size={18} />
            </div>
            <span className="text-lg font-semibold text-slate-800">Thùng rác — Phòng</span>
          </div>
        }
        open={trashOpen}
        onCancel={() => setTrashOpen(false)}
        footer={null}
        width={750}
        className="trash-modal [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-6"
      >
        <div className="mt-6 flex flex-col gap-4">
          {trashLoading ? (
            <Skeleton active />
          ) : (trashData as any[])?.length === 0 ? (
            <Empty description={<span className="text-slate-400">Thùng rác trống</span>} />
          ) : (
            (trashData as any[])?.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center">
                    <DoorOpen size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">{record.name}</h4>
                    <span className="text-xs text-slate-400">
                      Đã xóa lúc: {record.deleted_at ? new Date(record.deleted_at).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {can("delete", "rooms") && (
                    <Tooltip title="Khôi phục">
                      <Popconfirm title="Khôi phục phòng?" onConfirm={() => restoreMutation.mutate(record.id)} okText="Khôi phục" cancelText="Hủy">
                        <Button
                          icon={<RotateCcw size={16} />}
                          className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors rounded-lg flex items-center justify-center"
                        />
                      </Popconfirm>
                    </Tooltip>
                  )}
                  {can("delete", "rooms") && (
                    <Tooltip title="Xóa vĩnh viễn">
                      <Popconfirm title="Xóa vĩnh viễn?" description="Hành động không thể hoàn tác!"
                        onConfirm={() => forceDeleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
                      >
                        <Button
                          icon={<Trash2 size={16} />}
                          danger
                          className="rounded-lg flex items-center justify-center bg-red-50 border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        />
                      </Popconfirm>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Rooms;
