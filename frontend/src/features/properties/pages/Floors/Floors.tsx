import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Modal, Input } from "antd";
import { usePageStore } from "../../../../Stores/PageStore";
import { Plus, Edit, Eye, Trash2, RotateCcw, Search } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { useOpenStore } from "../../../../Stores/OpenStore";
import {
  useFloors,
  useDeleteFloor,
  useDeletedFloors,
  useRestoreFloor,
} from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { useDebounce } from "../../../../shared/hooks/useDebounce";

const Floors = () => {
  const { pages, pageSizes, setPage, setPageSize } = usePageStore();
  const { openForm, setOpenForm } = useOpenStore();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [searchText, setSearchText] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
  const debouncedSearch = useDebounce(searchText, 400);

  const { data: floors, isLoading } = useFloors(debouncedSearch || undefined);
  const { data: trashData, isLoading: trashLoading } = useDeletedFloors();
  const deleteMutation = useDeleteFloor();
  const restoreMutation = useRestoreFloor();

  const floorColumns = [
    { title: "Tên tầng", dataIndex: "name", key: "name" },
    {
      title: "Nhà",
      dataIndex: ["property", "name"],
      key: "property",
      render: (text: string) => text || "—",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<Eye size={14} />}
              onClick={() => { setOpenForm(true); navigate(`detailFloor/${record.id}`); }}
              className="bg-green-500 border-green-500 text-white hover:bg-green-600"
            />
          </Tooltip>
          {can("update", "floors") && (
            <Tooltip title="Sửa">
              <Button size="small" icon={<Edit size={14} />}
                onClick={() => { setOpenForm(true); navigate(`editFloor/${record.id}`); }}
                className="bg-sky-500 border-sky-500 text-white hover:bg-sky-600"
              />
            </Tooltip>
          )}
          {can("delete", "floors") && (
            <Tooltip title="Xóa">
              <Popconfirm title="Xóa tầng" description="Bạn có chắc chắn muốn xóa tầng này?"
                onConfirm={() => deleteMutation.mutate(record.id)} okText="Xóa" cancelText="Hủy"
              >
                <Button size="small" icon={<Trash2 size={14} />} danger
                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const trashColumns = [
    { title: "Tên tầng", dataIndex: "name", key: "name" },
    {
      title: "Đã xóa lúc", dataIndex: "deleted_at", key: "deleted_at",
      render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Thao tác", key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          {can("delete", "floors") && (
            <Tooltip title="Khôi phục">
              <Popconfirm title="Khôi phục tầng này?" onConfirm={() => restoreMutation.mutate(record.id)} okText="Khôi phục" cancelText="Hủy">
                <Button size="small" icon={<RotateCcw size={14} />} className="bg-green-500 border-green-500 text-white" />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {openForm == false ? (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between border p-3 border-gray-300 rounded-[10px] bg-white">
            <Input
              prefix={<Search size={14} className="text-gray-400" />}
              placeholder="Tìm kiếm tầng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-56"
              allowClear
            />
            <div className="flex gap-2">
              {can("delete", "floors") && (
                <Button icon={<Trash2 size={14} />} onClick={() => setTrashOpen(true)} className="border-gray-400 text-gray-600">
                  Thùng rác
                </Button>
              )}
              {can("create", "floors") && (
                <Button type="primary" icon={<Plus size={14} />}
                  onClick={() => { setOpenForm(true); navigate("createFloor"); }}
                  className="bg-blue-600"
                >
                  Thêm tầng
                </Button>
              )}
            </div>
          </div>

          <Table
            rowKey="id"
            columns={floorColumns}
            dataSource={floors}
            loading={isLoading}
            pagination={{
              current: pages, pageSize: pageSizes,
              total: floors?.length,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />

          <Modal
            title={<span className="flex items-center gap-2"><Trash2 size={16} className="text-red-500" /> Thùng rác — Tầng</span>}
            open={trashOpen}
            onCancel={() => setTrashOpen(false)}
            footer={null}
            width={650}
          >
            <Table
              rowKey="id"
              columns={trashColumns}
              dataSource={trashData}
              loading={trashLoading}
              size="small"
              pagination={{ pageSize: 8 }}
            />
          </Modal>
        </section>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Floors;
