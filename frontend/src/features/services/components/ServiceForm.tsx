import { useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, Switch, Button, notification } from "antd";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useServiceStore } from "../stores/useServiceStore";
import { createService, updateService } from "../api/serviceApi";
import { ServiceCalcModeLabels, ServiceFormSchema } from "../types";
import type { ServiceFormValues } from "../types";

const ServiceForm = () => {
    const { isOpenModal, closeModal, selectedService } = useServiceStore();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpenModal) {
            if (selectedService) {
                form.setFieldsValue({
                    ...selectedService,
                    price: selectedService.price || 0,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    is_active: true,
                    is_recurring: true,
                    price: 0
                })
            }
        }
    }, [isOpenModal, selectedService, form]);

    const mutation = useMutation({
        mutationFn: async (values: ServiceFormValues) => {
            if (selectedService) {
                return await updateService(selectedService.id, values);
            } else {
                return await createService(values);
            }
        },
        onSuccess: () => {
            notification.success({ message: selectedService ? "Cập nhật thành công" : "Thêm mới thành công" });
            queryClient.invalidateQueries({ queryKey: ["services"] });
            closeModal();
        },
        onError: (error: any) => {
            notification.error({ message: "Đã có lỗi xảy ra", description: error.message });
        },
    });

    const onFinish = (values: any) => {
        const result = ServiceFormSchema.safeParse(values);
        if (!result.success) {
            notification.error({ message: "Dữ liệu không hợp lệ" });
            return;
        }
        mutation.mutate(result.data);
    };

    return (
        <Modal
            title={selectedService ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
            open={isOpenModal}
            onCancel={closeModal}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ is_active: true, is_recurring: true }}
            >
                <Form.Item
                    name="code"
                    label="Mã dịch vụ"
                    rules={[{ required: true, message: "Vui lòng nhập mã dịch vụ" }]}
                >
                    <Input placeholder="VD: ELECTRIC" />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Tên dịch vụ"
                    rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
                >
                    <Input placeholder="VD: Tiền điện" />
                </Form.Item>

                <Form.Item
                    name="calc_mode"
                    label="Cách tính"
                    rules={[{ required: true, message: "Vui lòng chọn cách tính" }]}
                >
                    <Select placeholder="Chọn cách tính">
                        {Object.entries(ServiceCalcModeLabels).map(([key, label]) => (
                            <Select.Option key={key} value={key}>
                                {label}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="unit"
                    label="Đơn vị tính"
                    rules={[{ required: true, message: "Bắt buộc" }]}
                >
                    <Input placeholder="VD: kWh, Người, Phòng..." />
                </Form.Item>

                <Form.Item
                    name="price"
                    label="Đơn giá (VNĐ)"
                    rules={[{ required: true, message: "Vui lòng nhập đơn giá" }]}
                >
                    <InputNumber
                        className="w-full"
                        min={0}
                    />
                </Form.Item>

                <div className="flex gap-4">
                    <Form.Item name="is_recurring" label="Định kỳ hàng tháng" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={closeModal}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={mutation.isPending}>
                        {selectedService ? "Lưu thay đổi" : "Thêm mới"}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ServiceForm;
