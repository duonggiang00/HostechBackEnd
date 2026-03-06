import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, Popconfirm, Tooltip, notification } from "antd";
import { Plus, Eye, Edit, Trash2, FileX } from "lucide-react";
import { useNavigate } from "react-router";
import { getContracts, deleteContract } from "../api/contractApi";
import {
  ContractStatusLabels,
  ContractStatusColors,
} from "../../../Types/ContractTypes";
import type { Contract, ContractStatus } from "../../../Types/ContractTypes";

const ContractList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: getContracts,
  });

  // Để test, cho phép chỉnh sửa với mọi người
  const canEdit = true;

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      notification.success({ message: "Xóa hợp đồng thành công" });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: () => {
      notification.error({ message: "Có lỗi xảy ra khi xóa hợp đồng" });
    },
  });

  const columns = [
    {
      title: "Phòng",
      key: "room",
      render: (_: any, record: Contract) => (
        <span className="font-medium">
          {record.room?.name} – {record.property?.name}
        </span>
      ),
    },
    {
      title: "Người thuê chính",
      key: "tenant",
      render: (_: any, record: Contract) => {
        const primary = record.members.find((m) => m.is_primary === "1");
        return primary ? (
          primary.user.full_name
        ) : (
          <span className="text-gray-400">Chưa có</span>
        );
      },
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      key: "end_date",
    },
    {
      title: "Giá thuê",
      dataIndex: "rent_price",
      key: "rent_price",
      render: (price: number) => `${price?.toLocaleString()} VNĐ`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ContractStatus) => (
        <Tag color={ContractStatusColors[status]}>
          {ContractStatusLabels[status] ?? status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Contract) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye size={15} />}
              onClick={() => navigate(`/manage/contracts/detail/${record.id}`)}

              style={{
                backgroundColor: "#22c55e",
                borderColor: "#22c55e",
                color: "white",
              }}
            />
          </Tooltip>
          <Tooltip title={!canEdit ? "Không có quyền sửa" : "Sửa"}>
            <Button
              disabled={!canEdit}
              icon={<Edit size={15} />}
              onClick={() => navigate(`/manage/contracts/edit/${record.id}`)}

              style={{
                backgroundColor: !canEdit ? "#d1d5db" : "#0ea5e9",
                borderColor: !canEdit ? "#d1d5db" : "#0ea5e9",
                color: "white",
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Hợp đồng sẽ được chuyển vào thùng rác. Tiếp tục?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            disabled={!canEdit}
          >
            <Tooltip title={!canEdit ? "Không có quyền xóa" : "Xóa"}>
              <Button disabled={!canEdit} danger icon={<Trash2 size={15} />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Danh sách hợp đồng</h2>
        <div className="flex gap-2">
          <Button
            icon={<FileX size={15} />}
            onClick={() => navigate("/manage/contracts/deleted")}

          >
            Hợp đồng đã xóa
          </Button>
          {canEdit && (
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => navigate("/manage/contracts/create")}

              className="bg-blue-600"
            >
              Tạo hợp đồng
            </Button>
          )}
        </div>
      </div>

      <Table
        dataSource={contracts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />
    </div>
  );
};

export default ContractList;
