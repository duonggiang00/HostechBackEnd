import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Popconfirm, Tag, Tooltip, notification } from "antd";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { getDeletedContracts, restoreContract, hardDeleteContract } from "../api/contractApi";
import { ContractStatusLabels, ContractStatusColors } from "../../../Types/ContractTypes";
import type { Contract, ContractStatus } from "../../../Types/ContractTypes";

const DeletedContracts = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { data: contracts, isLoading } = useQuery({
        queryKey: ["deletedContracts"],
        queryFn: getDeletedContracts,
    });

    const restoreMutation = useMutation({
        mutationFn: restoreContract,
        onSuccess: () => {
            notification.success({ message: "Khôi phục hợp đồng thành công" });
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            queryClient.invalidateQueries({ queryKey: ["deletedContracts"] });
        },
    });

    const hardDeleteMutation = useMutation({
        mutationFn: hardDeleteContract,
        onSuccess: () => {
            notification.success({ message: "Đã xóa vĩnh viễn hợp đồng" });
            queryClient.invalidateQueries({ queryKey: ["deletedContracts"] });
        },
    });

    const columns = [
        {
            title: "Phòng",
            key: "room",
            render: (_: any, record: Contract) => (
                <span className="font-medium">{record.room?.name} – {record.property?.name}</span>
            ),
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
                <Tag color={ContractStatusColors[status]}>{ContractStatusLabels[status] ?? status}</Tag>
            ),
        },
        {
            title: "Ngày xóa",
            dataIndex: "deleted_at",
            key: "deleted_at",
            render: (val: string) => val?.slice(0, 10) ?? "—",
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: Contract) => (
                <div className="flex gap-2">
                    <Tooltip title="Khôi phục">
                        <Button
                            icon={<RotateCcw size={15} />}
                            onClick={() => restoreMutation.mutate(record.id)}
                            loading={restoreMutation.isPending}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Xóa vĩnh viễn? Không thể khôi phục sau khi xóa!"
                        onConfirm={() => hardDeleteMutation.mutate(record.id)}
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
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">Hợp đồng đã xóa</h2>
            </div>

            <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 text-orange-700 text-sm">
                Các hợp đồng tại đây có thể được khôi phục hoặc xóa vĩnh viễn. Xóa vĩnh viễn sẽ không thể hoàn tác.
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

export default DeletedContracts;
