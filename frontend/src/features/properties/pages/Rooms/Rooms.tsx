import { useState } from "react";
import { Table, Button, Tooltip, Popconfirm, Modal, Input, Tag } from "antd";
import { formatStatusRoom } from "../../../../Constants/Helper";
import { Plus, Edit, Eye, Trash2, RotateCcw, Search } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type { ColumnsType } from "antd/es/table";
import {
  useRooms,
  useDeleteRoom,
  useDeletedRooms,
  useRestoreRoom,
} from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { useDebounce } from "../../../../shared/hooks/useDebounce";

const Rooms = () => {
  const { openForm, setOpenForm } = useOpenStore();
  const navigate = useNavigate();
  const { can } = usePermission();
  const [searchText, setSearchText] = useState("");
  const [trashOpen, setTrashOpen] = useState(false);
  const debouncedSearch = useDebounce(searchText, 400);

  const { data: rooms, isLoading } = useRooms(debouncedSearch || undefined);
  const { data: trashData, isLoading: trashLoading } = useDeletedRooms();
  const deleteMutation = useDeleteRoom();
  const restoreMutation = useRestoreRoom();

  const columns: ColumnsType<any> = [
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    {
      title: "Tầng",
      dataIndex: ["floor", "name"],
      key: "floor",
      render: (text: string) => text || "—",
    },
    {
      title: "Khu (Nhà)",
      dataIndex: ["property", "name"],
      key: "property",
      render: (text: string) => text || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: any) => (
        <Tag color={status === "AVAILABLE" ? "green" : status === "OCCUPIED" ? "blue" : "default"}>
          {formatStatusRoom(status)}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<Eye size={14} />}
              onClick={() => { setOpenForm(true); navigate(`detailRoom/${record.id}`); }}
              className="bg-green-500 border-green-500 text-white hover:bg-green-600"
            />
          </Tooltip>
          {can("update", "rooms") && (
            <Tooltip title="Sửa">
              <Button size="small" icon={<Edit size={14} />}
                onClick={() => { setOpenForm(true); navigate(`editRoom/${record.id}`); }}
                className="bg-sky-500 border-sky-500 text-white hover:bg-sky-600"
              />
            </Tooltip>
          )}
          {can("delete", "rooms") && (
            <Tooltip title="Xóa">
              <Popconfirm title="Xóa phòng" description="Bạn có chắc chắn muốn xóa phòng này?"
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

  const trashColumns: ColumnsType<any> = [
    { title: "Tên phòng", dataIndex: "name", key: "name" },
    {
      title: "Đã xóa lúc", dataIndex: "deleted_at", key: "deleted_at",
      render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Thao tác", key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          {can("delete", "rooms") && (
            <Tooltip title="Khôi phục">
              <Popconfirm title="Khôi phục phòng này?" onConfirm={() => restoreMutation.mutate(record.id)} okText="Khôi phục" cancelText="Hủy">
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
              placeholder="Tìm kiếm phòng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-56"
              allowClear
            />
            <div className="flex gap-2">
              {can("delete", "rooms") && (
                <Button icon={<Trash2 size={14} />} onClick={() => setTrashOpen(true)} className="border-gray-400 text-gray-600">
                  Thùng rác
                </Button>
              )}
              {can("create", "rooms") && (
                <Button type="primary" icon={<Plus size={14} />}
                  onClick={() => { setOpenForm(true); navigate("createRoom"); }}
                  className="bg-blue-600"
                >
                  Thêm phòng
                </Button>
              )}
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={rooms}
            rowKey="id"
            loading={isLoading}
          />

          <Modal
            title={<span className="flex items-center gap-2"><Trash2 size={16} className="text-red-500" /> Thùng rác — Phòng</span>}
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

export default Rooms;
