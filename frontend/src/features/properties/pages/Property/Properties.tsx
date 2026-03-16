import { useState, useEffect } from "react";
import { Button, Tooltip, Popconfirm, Modal, Empty, Skeleton, Table, Tag, Pagination } from "antd";
import { Plus, Eye, Trash2, RotateCcw, Home, Settings2 } from "lucide-react";
import FilterBar from "../../../../shared/components/FilterBar";

import { useNavigate } from "react-router";
import {
  useProperties,
  useDeleteProperty,
  useDeletedProperties,
  useRestoreProperty,
  useForceDeleteProperty,
} from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { useDebounce } from "../../../../shared/hooks/useDebounce";
import type { PropertyDTO } from "../../types";
import FloorListInline from "../../components/FloorListInline";

import { useTokenStore } from "../../../auth/stores/authStore";

const Properties = () => {
  const navigate = useNavigate();
  const { can } = usePermission();

  const { org_id, role } = useTokenStore();

  const [searchText, setSearchText] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchText, 400);

  // Queries
  const queryParams = {
    search: debouncedSearch || undefined,
    page: currentPage,
    per_page: pageSize,
    filter: (role === 'Admin' ? {} : { org_id: org_id })
  };

  const { data: paginatedData, isLoading } = useProperties(queryParams);
  const properties = paginatedData?.data || [];
  const meta = paginatedData?.meta || { current_page: 1, last_page: 1, total: 0, per_page: 10 };

  const { data: trashData, isLoading: trashLoading } = useDeletedProperties();
  const deleteMutation = useDeleteProperty();
  const restoreMutation = useRestoreProperty();
  const forceDeleteMutation = useForceDeleteProperty();

  // Handlers
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
  };
  
  // Redirect Manager/Staff if they have at least one property
  useEffect(() => {
    if ((role === "Manager" || role === "Staff") && !isLoading && properties.length > 0) {
      navigate(`detailProperty/${properties[0].id}`, { replace: true });
    }
  }, [role, isLoading, properties, navigate]);


  // Table Columns
  const tableColumns = [
    {
      title: 'Mã nhà',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span className="font-semibold text-blue-600 uppercase">{text}</span>,
    },
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-bold text-slate-800">{text}</span>,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      render: (text: string) => <span className="text-slate-600 truncate max-w-[200px] block">{text || '-'}</span>,
    },
    {
      title: 'Diện tích',
      dataIndex: 'area',
      key: 'area',
      render: (text: number) => <span className="text-slate-600 block">{text ? `${text} m²` : '-'}</span>,
    },
    {
      title: 'Quy mô',
      key: 'scale',
      render: (_: any, record: PropertyDTO) => (
        <div className="flex gap-2">
          <Tag color="indigo">{record.floors_count || 0} tầng</Tag>
          <Tag color="emerald">{record.rooms_count || 0} phòng</Tag>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      align: 'right' as const,
      render: (_: any, record: PropertyDTO) => (
        <div className="flex justify-end gap-2">
          <Tooltip title="Chi tiết">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => navigate(`detailProperty/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          {can("update", "properties") && (
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Settings2 size={16} />}
                onClick={() => navigate(`editProperty/${record.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
          )}
          {can("delete", "properties") && (
            <Tooltip title="Xóa">
              <Popconfirm
                title="Xóa nhà trọ"
                description="Bạn có chắc chắn muốn xóa?"
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

  const handleClearFilters = () => {
    setSearchText("");
    setCurrentPage(1);
  };

  return (
    <div className="relative w-full h-full animate-fade-in flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Home className="text-blue-500" size={26} />
            Quản Lý Nhà Trọ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách các tòa nhà, khu trọ của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can("delete", "properties") && (
            <Button
              icon={<Trash2 size={16} />}
              onClick={() => setTrashOpen(true)}
              className="rounded-xl flex items-center gap-2 border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-500 transition-colors h-[40px]"
            >
              Thùng rác
            </Button>
          )}
          {can("create", "properties") && (
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => navigate("createProperty")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-[40px] px-5 shadow-md shadow-blue-500/20 font-medium flex items-center gap-2 border-none"
            >
              Thêm nhà
            </Button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <FilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm kiếm tên, mã nhà..."
        onClearAll={handleClearFilters}
        extra={
          <div className="text-sm text-slate-500 px-2 border-l border-slate-200 ml-2">
            Tổng cộng: <span className="font-semibold text-slate-700">{meta.total}</span>
          </div>
        }
      />


      {/* CONTENT AREA */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} active paragraph={{ rows: 4 }} className="p-4 border border-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white flex-1">
            <Empty description={<span className="text-slate-500">Chưa có nhà trọ nào</span>} />
            <Button type="primary" className="mt-4" onClick={() => navigate("createProperty")}>
              Tạo nhà trọ đầu tiên
            </Button>
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto flex-1">
            <Table
              columns={tableColumns}
              dataSource={properties}
              rowKey="id"
              pagination={false}
              className="modern-table"
              rowClassName="hover:bg-slate-50 cursor-pointer transition-colors"
              expandable={{
                expandedRowRender: (record) => <FloorListInline propertyId={record.id} />,
                rowExpandable: () => true,
              }}
              onRow={(record) => ({
                onDoubleClick: () => navigate(`detailProperty/${record.id}`)
              })}
            />
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!isLoading && properties.length > 0 && (
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
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

      {/* MODAL Thùng rác */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <Trash2 size={18} />
            </div>
            <span className="text-lg font-semibold text-slate-800">Thùng rác — Nhà trọ</span>
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
          ) : trashData?.length === 0 ? (
            <Empty description={<span className="text-slate-400">Thùng rác trống</span>} />
          ) : (
            trashData?.map((record: PropertyDTO) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center">
                    <Home size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">{record.name}</h4>
                    <span className="text-xs text-slate-400">
                      Đã xóa lúc: {record.deleted_at ? new Date(record.deleted_at).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {can("delete", "properties") && (
                    <Tooltip title="Khôi phục">
                      <Popconfirm title="Khôi phục nhà trọ này?" onConfirm={() => restoreMutation.mutate(record.id)} okText="Khôi phục" cancelText="Hủy">
                        <Button
                          icon={<RotateCcw size={16} />}
                          className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors rounded-lg flex items-center justify-center"
                        />
                      </Popconfirm>
                    </Tooltip>
                  )}
                  {can("delete", "properties") && (
                    <Tooltip title="Xóa vĩnh viễn">
                      <Popconfirm title="Xóa vĩnh viễn?" description="Hành động này không thể hoàn tác!"
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

export default Properties;
