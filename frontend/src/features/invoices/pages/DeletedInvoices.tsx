import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Popconfirm, Tag, Tooltip, notification } from "antd";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { getDeletedInvoices, restoreInvoice, hardDeleteInvoice } from "../api/invoiceApi";
import { InvoiceStatusLabels, InvoiceStatusColors } from "../../../Types/InvoiceTypes";
import type { Invoice, InvoiceStatus } from "../../../Types/InvoiceTypes";

const DeletedInvoices = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: invoices, isLoading } = useQuery({ queryKey: ["deletedInvoices"], queryFn: getDeletedInvoices });

    const restoreMutation = useMutation({
        mutationFn: restoreInvoice,
        onSuccess: () => {
            notification.success({ message: "Khôi phục hóa đơn thành công" });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["deletedInvoices"] });
        },
    });

    const hardDeleteMutation = useMutation({
        mutationFn: hardDeleteInvoice,
        onSuccess: () => {
            notification.success({ message: "Đã xóa vĩnh viễn" });
            queryClient.invalidateQueries({ queryKey: ["deletedInvoices"] });
        },
    });

    const columns = [
        {
            title: "Phòng",
            key: "room",
            render: (_: any, r: Invoice) => <span className="font-medium">{r.room?.name} – {r.property?.name}</span>,
        },
        {
            title: "Kỳ",
            key: "period",
            render: (_: any, r: Invoice) => `${r.period_start} → ${r.period_end}`,
        },
        {
            title: "Tổng tiền",
            dataIndex: "total_amount",
            key: "total_amount",
            render: (v: number) => `${v.toLocaleString()} VNĐ`,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (s: InvoiceStatus) => <Tag color={InvoiceStatusColors[s]}>{InvoiceStatusLabels[s]}</Tag>,
        },
        {
            title: "Ngày xóa",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (v: string) => v?.slice(0, 10) ?? "—",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, r: Invoice) => (
                <div className="flex gap-2">
                    <Tooltip title="Khôi phục">
                        <Button icon={<RotateCcw size={15} />} onClick={() => restoreMutation.mutate(r.id)} loading={restoreMutation.isPending} />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa vĩnh viễn? Không thể hoàn tác!"
                        onConfirm={() => hardDeleteMutation.mutate(r.id)}
                        okText="Xóa vĩnh viễn"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Xóa vĩnh viễn">
                            <Button danger icon={<Trash2 size={15} />} />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Hóa đơn đã xóa</h2>
            </div>
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 text-orange-700 text-sm">
                Hóa đơn tại đây có thể khôi phục hoặc xóa vĩnh viễn. Xóa vĩnh viễn không thể hoàn tác.
            </div>
            <Table dataSource={invoices} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} scroll={{ x: 800 }} />
        </div>
    );
};

export default DeletedInvoices;
