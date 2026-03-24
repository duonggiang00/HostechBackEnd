import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import {
    Descriptions, Tag, Button, Spin, Alert, Table, Modal,
    Form, Input, InputNumber, Select, Popconfirm, notification, Divider, Typography
} from "antd";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
const { Title } = Typography;
import { getInvoiceById, addInvoiceItem, removeInvoiceItem, issueInvoice, payInvoice } from "../api/invoiceApi";
import {
    InvoiceStatusLabels, InvoiceStatusColors, InvoiceItemSchema,
} from "../../../Types/InvoiceTypes";
import type { InvoiceStatus, InvoiceItemFormValues, InvoiceItem } from "../../../Types/InvoiceTypes";
import { InvoiceStatus as InvoiceStatusEnum } from "../../../Types/InvoiceTypes";
import { RoleGuard } from "../../../shared/components/RoleGuard";

const itemTypeOptions = [
    { label: "Tiền thuê", value: "rent" },
    { label: "Dịch vụ", value: "service" },
    { label: "Khác", value: "other" },
];

const InvoiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [addItemForm] = Form.useForm();
    const [showAddForm, setShowAddForm] = useState(false);

    const { data: invoice, isLoading, error } = useQuery({
        queryKey: ["invoice", id],
        queryFn: () => getInvoiceById(id!),
        retry: false,
    });

    const addItemMutation = useMutation({
        mutationFn: (values: InvoiceItemFormValues) => addInvoiceItem(id!, values),
        onSuccess: () => {
            notification.success({ message: "Thêm dòng chi phí thành công" });
            queryClient.invalidateQueries({ queryKey: ["invoice", id] });
            addItemForm.resetFields();
            setShowAddForm(false);
        },
        onError: (e: any) => notification.error({ message: "Lỗi", description: e.message }),
    });

    const removeItemMutation = useMutation({
        mutationFn: (itemId: string) => removeInvoiceItem(id!, itemId),
        onSuccess: () => {
            notification.success({ message: "Đã xóa dòng chi phí" });
            queryClient.invalidateQueries({ queryKey: ["invoice", id] });
        },
    });

    const issueMutation = useMutation({
        mutationFn: () => issueInvoice(id!),
        onSuccess: () => {
            notification.success({ message: "Phát hành hóa đơn thành công" });
            queryClient.invalidateQueries({ queryKey: ["invoice", id] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
        onError: (e: any) => notification.error({ message: "Lỗi phát hành", description: e.message }),
    });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm] = Form.useForm();

    const payMutation = useMutation({
        mutationFn: (values?: any) => payInvoice(id!, values),
        onSuccess: () => {
            notification.success({ message: "Ghi nhận thanh toán thành công" });
            queryClient.invalidateQueries({ queryKey: ["invoice", id] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setShowPaymentModal(false);
            paymentForm.resetFields();
        },
        onError: (e: any) => notification.error({ message: "Lỗi thanh toán", description: e.message }),
    });

    const onRecordPayment = (values: any) => {
        payMutation.mutate({
            amount: Number(values.amount),
            payment_method: values.payment_method,
            note: values.note
        });
    };

    const onAddItem = (values: any) => {
        const result = InvoiceItemSchema.safeParse({
            ...values,
            quantity: Number(values.quantity),
            unit_price: Number(values.unit_price),
        });
        if (!result.success) {
            notification.error({ message: "Dữ liệu không hợp lệ" });
            return;
        }
        addItemMutation.mutate(result.data);
    };

    if (isLoading) return <Spin className="mt-10 flex justify-center" />;
    if (error) {
        const is404 = (error as Error).message === "404";
        return (
            <div className="p-6">
                <Alert
                    type={is404 ? "warning" : "error"}
                    message={is404 ? "Không tìm thấy hóa đơn (404)" : "Không có quyền xem (403)"}
                    description={is404 ? "Hóa đơn không tồn tại hoặc đã bị xóa." : "Liên hệ quản trị viên."}
                    showIcon
                    action={<Button size="small" onClick={() => navigate(-1)}>Quay lại</Button>}
                />
            </div>
        );
    }

    const isLocked = invoice?.status === InvoiceStatusEnum.PAID || invoice?.status === InvoiceStatusEnum.CANCELLED;

    const itemColumns = [
        { title: "Mô tả", dataIndex: "description", key: "description" },
        { title: "Loại", dataIndex: "type", key: "type" },
        { title: "SL", dataIndex: "quantity", key: "quantity" },
        {
            title: "Đơn giá",
            dataIndex: "unit_price",
            key: "unit_price",
            render: (v: number) => `${v.toLocaleString()} VNĐ`,
        },
        {
            title: "Thành tiền",
            dataIndex: "amount",
            key: "amount",
            render: (v: number) => <span className="font-semibold">{v.toLocaleString()} VNĐ</span>,
        },
        {
            title: "",
            key: "action",
            render: (_: any, item: InvoiceItem) => (
                <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
                    <Popconfirm
                        title="Xóa dòng chi phí này?"
                        onConfirm={() => removeItemMutation.mutate(item.id)}
                        disabled={isLocked}
                    >
                        <Button
                            danger
                            size="small"
                            icon={<Trash2 size={13} />}
                            disabled={isLocked}
                        />
                    </Popconfirm>
                </RoleGuard>
            ),
        },
    ];

    return (
        <div className="flex flex-col gap-5 p-5">
            {/* Payment Modal */}
            <Modal
                title="Ghi nhận thanh toán"
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                onOk={() => paymentForm.submit()}
                confirmLoading={payMutation.isPending}
            >
                <div className="mb-4 text-sm text-gray-600">
                    <p>Khách đang còn nợ: <span className="font-bold text-red-600">{(invoice?.debt || 0).toLocaleString()} VNĐ</span></p>
                    <p>Nhập số tiền khách thực tế đã thanh toán lần này.</p>
                </div>
                <Form
                    form={paymentForm}
                    layout="vertical"
                    onFinish={onRecordPayment}
                >
                    <Form.Item
                        name="amount"
                        label="Số tiền (VNĐ)"
                        rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
                    >
                        <InputNumber
                            className="w-full"
                            min={0}
                            max={invoice?.debt || 0}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="payment_method"
                        label="Phương thức thanh toán"
                        rules={[{ required: true }]}
                    >
                        <Select options={[
                            { label: "Chuyển khoản", value: "transfer" },
                            { label: "Tiền mặt", value: "cash" },
                        ]} />
                    </Form.Item>
                    <Form.Item name="note" label="Ghi chú (Tùy chọn)">
                        <Input.TextArea rows={2} placeholder="Vd: Khách chuyển khoản VCB" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <Title level={4} className="!mb-0">Chi tiết hóa đơn</Title>
                </div>
                <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
                    <div className="flex gap-2">
                        {invoice?.status === InvoiceStatusEnum.DRAFT && (
                            <Popconfirm title="Phát hành hóa đơn này cho khách thuê?" onConfirm={() => issueMutation.mutate()}>
                                <Button type="primary" loading={issueMutation.isPending}>Phát hành / Gửi</Button>
                            </Popconfirm>
                        )}
                        {(invoice?.status === InvoiceStatusEnum.ISSUED || invoice?.status === InvoiceStatusEnum.PARTIAL || invoice?.status === InvoiceStatusEnum.OVERDUE) && (
                            <Button type="primary" onClick={() => {
                                paymentForm.setFieldsValue({
                                    amount: invoice?.debt || 0,
                                    payment_method: 'transfer',
                                    note: ''
                                });
                                setShowPaymentModal(true);
                            }}>
                                Ghi nhận thanh toán
                            </Button>
                        )}
                        <Button 
                            icon={<Edit size={15} />} 
                            onClick={() => navigate(`/manage/invoices/edit/${id}`)}
                            disabled={invoice?.status !== InvoiceStatusEnum.DRAFT}
                            title={invoice?.status !== InvoiceStatusEnum.DRAFT ? "Chỉ có thể chỉnh sửa hóa đơn ở trạng thái Nháp" : ""}
                        >
                            Chỉnh sửa
                        </Button>
                    </div>
                </RoleGuard>
            </div>

            {/* Thông tin chung */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                <Descriptions title="Thông tin hóa đơn" column={{ xs: 1, sm: 2 }} bordered>
                    <Descriptions.Item label="Phòng">{invoice?.room?.name}</Descriptions.Item>
                    <Descriptions.Item label="Nhà">{invoice?.property?.name}</Descriptions.Item>
                    <Descriptions.Item label="Kỳ thanh toán">
                        {invoice?.period_start} → {invoice?.period_end}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={InvoiceStatusColors[invoice?.status as InvoiceStatus]}>
                            {InvoiceStatusLabels[invoice?.status as InvoiceStatus]}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày phát hành">{invoice?.issue_date}</Descriptions.Item>
                    <Descriptions.Item label="Hạn thanh toán">{invoice?.due_date}</Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền">
                        <span className="font-bold">{invoice?.total_amount.toLocaleString()} VNĐ</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Đã thanh toán">
                        <span className="text-green-600 font-semibold">{(invoice?.paid_amount || 0).toLocaleString()} VNĐ</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Còn nợ">
                        <span className={`font-bold ${(invoice?.debt ?? 0) > 0 ? "text-red-500" : "text-green-600"}`}>
                            {(invoice?.debt || 0).toLocaleString()} VNĐ
                        </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phát hành bởi">{invoice?.issued_by?.full_name ?? "—"}</Descriptions.Item>
                </Descriptions>
            </div>

            {/* ───── Danh sách chi phí ───── */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-base">Chi tiết chi phí ({invoice?.items.length} dòng)</h3>
                    <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
                        <Button
                            icon={<Plus size={14} />}
                            size="small"
                            type="dashed"
                            disabled={isLocked}
                            title={isLocked ? "Không thể chỉnh sửa hóa đơn đã kóa" : ""}
                            onClick={() => !isLocked && setShowAddForm((v) => !v)}
                        >
                            {showAddForm ? "Đóng" : "Thêm dòng"}
                        </Button>
                    </RoleGuard>
                </div>

                {/* Banner khoá */}
                {isLocked && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-yellow-700 text-sm">
                        ⚠️ Hóa đơn đã <strong>{InvoiceStatusLabels[invoice!.status]}</strong> — không thể thêm hay xóa dòng chi phí.
                    </div>
                )}

                {/* Form thêm item */}
                {showAddForm && (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 mb-4">
                        <Form form={addItemForm} layout="vertical" onFinish={onAddItem}>
                            <div className="grid grid-cols-2 gap-3">
                                <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
                                    <Select options={itemTypeOptions} placeholder="Chọn loại" />
                                </Form.Item>
                                <Form.Item name="service_id" label="Mã dịch vụ (tuỳ chọn)">
                                    <Input placeholder="VD: ELECTRIC" />
                                </Form.Item>
                            </div>
                            <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
                                <Input placeholder="VD: Tiền điện tháng 2" />
                            </Form.Item>
                            <div className="grid grid-cols-2 gap-3">
                                <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
                                    <InputNumber className="w-full" min={1} />
                                </Form.Item>
                                <Form.Item name="unit_price" label="Đơn giá (VNĐ)" rules={[{ required: true }]}>
                                    <InputNumber className="w-full" min={0} />
                                </Form.Item>
                            </div>
                            <div className="flex gap-2">
                                <Button type="primary" htmlType="submit" loading={addItemMutation.isPending} size="small">
                                    Thêm
                                </Button>
                                <Button size="small" onClick={() => { setShowAddForm(false); addItemForm.resetFields(); }}>
                                    Hủy
                                </Button>
                            </div>
                        </Form>
                    </div>
                )}

                <Divider className="my-2" />
                <Table
                    dataSource={invoice?.items}
                    columns={itemColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4}>
                                <span className="font-bold">Tổng cộng</span>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                                <span className="font-bold text-blue-600">
                                    {invoice?.items.reduce((s, i) => s + i.amount, 0).toLocaleString()} VNĐ
                                </span>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                    )}
                />
            </div>
        </div>
    );
};

export default InvoiceDetail;
