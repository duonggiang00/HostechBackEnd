import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { Descriptions, Tag, Button, Spin, Alert } from "antd";
import { ArrowLeft, Edit } from "lucide-react";
import { getContractById } from "../api/contractApi";
import { ContractStatusLabels, ContractStatusColors } from "../../../Types/ContractTypes";
import type { ContractStatus } from "../../../Types/ContractTypes";

const ContractDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: contract, isLoading, error } = useQuery({
        queryKey: ["contract", id],
        queryFn: () => getContractById(id!),
        retry: false,
    });

    if (isLoading) return <Spin className="mt-10 flex justify-center" />;

    if (error) {
        const is404 = (error as Error).message === "404";
        return (
            <div className="p-6">
                <Alert
                    type={is404 ? "warning" : "error"}
                    message={is404 ? "Không tìm thấy hợp đồng (404)" : "Bạn không có quyền xem hợp đồng này (403)"}
                    description={is404 ? "Hợp đồng không tồn tại hoặc đã bị xóa." : "Liên hệ quản trị viên để được cấp quyền."}
                    showIcon
                    action={
                        <Button size="small" onClick={() => navigate(-1)}>
                            Quay lại
                        </Button>
                    }
                />
            </div>
        );
    }

    const primaryMember = contract?.members.find((m) => m.is_primary === "1");

    return (
        <div className="flex flex-col gap-5 p-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">Chi tiết hợp đồng</h1>
                </div>
                <Button
                    icon={<Edit size={15} />}
                    onClick={() => navigate(`/manage/contracts/edit/${id}`)}

                >
                    Chỉnh sửa
                </Button>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                <Descriptions title="Thông tin hợp đồng" column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="Phòng">{contract?.room?.name}</Descriptions.Item>
                    <Descriptions.Item label="Nhà">{contract?.property?.name}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">{contract?.property?.address}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={ContractStatusColors[contract?.status as ContractStatus]}>
                            {ContractStatusLabels[contract?.status as ContractStatus]}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày bắt đầu">{contract?.start_date}</Descriptions.Item>
                    <Descriptions.Item label="Ngày kết thúc">{contract?.end_date}</Descriptions.Item>
                    <Descriptions.Item label="Giá thuê">{contract?.rent_price?.toLocaleString()} VNĐ</Descriptions.Item>
                    <Descriptions.Item label="Tiền đặt cọc">{contract?.deposit_amount?.toLocaleString()} VNĐ</Descriptions.Item>
                    <Descriptions.Item label="Kỳ thanh toán">{contract?.billing_cycle}</Descriptions.Item>
                    <Descriptions.Item label="Ngày đến hạn">{contract?.due_day}</Descriptions.Item>
                    <Descriptions.Item label="Ngày chốt">{contract?.cutoff_day}</Descriptions.Item>
                    <Descriptions.Item label="Mã tham gia">{contract?.join_code}</Descriptions.Item>
                </Descriptions>
            </div>

            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                <Descriptions title="Người thuê chính" column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="Họ tên">{primaryMember?.user?.full_name ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{primaryMember?.user?.phone ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Email">{primaryMember?.user?.email ?? "—"}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tham gia">{primaryMember?.joined_at ?? "—"}</Descriptions.Item>
                </Descriptions>
            </div>

            {contract && contract.members.length > 1 && (
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <h3 className="font-semibold mb-3">Danh sách thành viên ({contract.members.length})</h3>
                    {contract.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <span className="font-medium">{m.user.full_name}</span>
                            <span className="text-gray-500 text-sm">{m.user.phone}</span>
                            {m.is_primary === "1" && <Tag color="blue">Người thuê chính</Tag>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ContractDetail;
