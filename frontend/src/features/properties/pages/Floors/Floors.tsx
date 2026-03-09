import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Modal, Input, Empty, Skeleton, Pagination } from "antd";
import { Plus, Eye, Trash2, RotateCcw, Search, Layers, Settings2 } from "lucide-react";
import { useNavigate } from "react-router";
import {
  useFloors,
  useDeleteFloor,
  useDeletedFloors,
  useRestoreFloor,
  useForceDeleteFloor,
} from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { useDebounce } from "../../../../shared/hooks/useDebounce";

const Floors = ({ propertyId }: { propertyId?: string }) => {
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
  queryParams.page = currentPage;
  queryParams.per_page = pageSize;

  const { data: paginatedData, isLoading } = useFloors(queryParams);
  // Support both paginated format and raw array format depending on API config
  const paginatedAny = paginatedData as any;
  const floors = paginatedAny?.data || (Array.isArray(paginatedData) ? paginatedData : []);
  const meta = paginatedAny?.meta || { current_page: 1, last_page: 1, total: floors.length, per_page: 10 };

  const { data: trashData, isLoading: trashLoading } = useDeletedFloors();
  const deleteMutation = useDeleteFloor();
  const restoreMutation = useRestoreFloor();
  const forceDeleteMutation = useForceDeleteFloor();

  // Handlers
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };

  const floorColumns = [
    {
      title: "Tên tầng",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>
    },
    ...(propertyId ? [] : [
      {
        title: "Nhà trọ",
        dataIndex: ["property", "name"],
        key: "property",
        render: (text: string) => <span className="text-slate-600 font-medium">{text || "—"}</span>,
      }
    ]),
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
              onClick={() => navigate(`/manage/floors/detailFloor/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          {can("update", "floors") && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Settings2 size={16} />}
                onClick={() => navigate(`/manage/floors/editFloor/${record.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
          )}
          {can("delete", "floors") && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa tầng"
                description="Bạn có chắc chắn muốn xóa tầng này?"
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

  return (
    <div className="relative w-full h-full animate-fade-in flex flex-col gap-6">

      {/* HEADER SECTION */}
      {!propertyId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-gray-200/50 p-5 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              <Layers className="text-indigo-500" size={26} />
              Quản Lý Tầng
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tổng số: <span className="font-semibold text-slate-700">{meta.total}</span> tầng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm kiếm tầng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 py-2 shadow-sm"
              allowClear
            />

            {can("delete", "floors") && (
              <Button
                icon={<Trash2 size={16} />}
                onClick={() => setTrashOpen(true)}
                className="rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-500 transition-colors h-[40px]"
              >
                Thùng rác
              </Button>
            )}
            {can("create", "floors") && (
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={() => navigate("/manage/floors/createFloor")}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-[40px] px-5 shadow-md shadow-indigo-500/20 font-medium flex items-center gap-2"
              >
                Thêm tầng
              </Button>
            )}
          </div>
        </div>
      )}

      {/* EMBEDDED HEADER HEADER (Khi truyền propertyId - Không làm thẻ header to) */}
      {propertyId && (
        <div className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
          <Input
            prefix={<Search size={16} className="text-slate-400" />}
            placeholder="Tìm kiếm tầng..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-64 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 py-2 shadow-sm"
            allowClear
          />
          {can("create", "floors") && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => navigate("/manage/floors/createFloor", { state: { propertyId } })}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-[38px] px-5 shadow-md shadow-indigo-500/20 font-medium flex items-center gap-2"
            >
              Thêm tầng
            </Button>
          )}
        </div>
      )}

      {/* CONTENT AREA */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 flex flex-col ${propertyId ? 'min-h-[400px]' : ''}`}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} className="p-4" />
        ) : floors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white flex-1">
            <Empty description={<span className="text-slate-500">Chưa có tầng nào</span>} />
            <Button type="primary" className="mt-4 bg-indigo-600" onClick={() => navigate("/manage/floors/createFloor", { state: { propertyId } })}>
              Tạo tầng đầu tiên
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <Table
              columns={floorColumns}
              dataSource={floors}
              rowKey="id"
              pagination={false}
              className="modern-table"
              rowClassName="hover:bg-slate-50 cursor-pointer transition-colors"
              onRow={(record: any) => ({
                onDoubleClick: () => navigate(`/manage/floors/detailFloor/${record.id}`)
              })}
            />
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!isLoading && floors.length > 0 && (
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
            <span className="text-lg font-semibold text-slate-800">Thùng rác — Tầng</span>
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
                    <Layers size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">{record.name}</h4>
                    <span className="text-xs text-slate-400">
                      Đã xóa lúc: {record.deleted_at ? new Date(record.deleted_at).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {can("delete", "floors") && (
                    <Tooltip title="Khôi phục">
                      <Popconfirm title="Khôi phục tầng?" onConfirm={() => restoreMutation.mutate(record.id)} okText="Khôi phục" cancelText="Hủy">
                        <Button
                          icon={<RotateCcw size={16} />}
                          className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors rounded-lg flex items-center justify-center"
                        />
                      </Popconfirm>
                    </Tooltip>
                  )}
                  {can("delete", "floors") && (
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

export default Floors;
