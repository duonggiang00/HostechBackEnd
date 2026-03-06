import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, Popconfirm, Tooltip, notification } from "antd";
import { Plus, Eye, Edit, Trash2, FileX } from "lucide-react";
import { useNavigate } from "react-router";
import { getInvoices, deleteInvoice } from "../api/invoiceApi";
import {
  InvoiceStatusLabels,
  InvoiceStatusColors,
} from "../../../Types/InvoiceTypes";
import type { Invoice, InvoiceStatus } from "../../../Types/InvoiceTypes";

const InvoiceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: getInvoices,
  });

  const canEdit = true;

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      notification.success({ message: "Xóa hóa đơn thành công" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => notification.error({ message: "Xóa hóa đơn thất bại" }),
  });

  const columns = [
    {
      title: "Phòng",
      key: "room",
      render: (_: any, r: Invoice) => (
        <span className="font-medium">
          {r.room?.name} – {r.property?.name}
        </span>
      ),
    },
    {
      title: "Kỳ",
      key: "period",
      render: (_: any, r: Invoice) => `${r.period_start} → ${r.period_end}`,
    },
    {
      title: "Phát hành",
      dataIndex: "issue_date",
      key: "issue_date",
    },
    {
      title: "Hạn TT",
      dataIndex: "due_date",
      key: "due_date",
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v: number) => `${v.toLocaleString()} VNĐ`,
    },
    {
      title: "Còn nợ",
      dataIndex: "debt",
      key: "debt",
      render: (v: number) => (
        <span
          className={v > 0 ? "text-red-500 font-semibold" : "text-green-600"}
        >
          {v.toLocaleString()} VNĐ
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: InvoiceStatus) => (
        <Tag color={InvoiceStatusColors[s]}>{InvoiceStatusLabels[s]}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, r: Invoice) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye size={15} />}
              onClick={() => navigate(`/manage/invoices/detail/${r.id}`)}

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
              onClick={() => navigate(`/manage/invoices/edit/${r.id}`)}

              style={{
                backgroundColor: !canEdit ? "#d1d5db" : "#0ea5e9",
                borderColor: !canEdit ? "#d1d5db" : "#0ea5e9",
                color: "white",
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Hóa đơn sẽ được chuyển vào thùng rác. Tiếp tục?"
            onConfirm={() => deleteMutation.mutate(r.id)}
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
        <h2 className="text-xl font-bold">Danh sách hóa đơn</h2>
        <div className="flex gap-2">
          <Button
            icon={<FileX size={15} />}
            onClick={() => navigate("/manage/invoices/deleted")}

          >
            Đã xóa
          </Button>
          {canEdit && (
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => navigate("/manage/invoices/create")}

              className="bg-blue-600"
            >
              Tạo hóa đơn
            </Button>
          )}
        </div>
      </div>
      <Table
        dataSource={invoices}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default InvoiceList;
