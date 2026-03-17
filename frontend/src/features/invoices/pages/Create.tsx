import { Form, Input, Select, Button, notification, Typography } from "antd";

const { Title } = Typography;
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import {
  createInvoice,
} from "../api/invoiceApi";
import { InvoiceStatus, InvoiceFormSchema } from "../../../Types/InvoiceTypes";
import type { InvoiceFormValues } from "../../../Types/InvoiceTypes";

const mockContractsForInvoice: any[] = [{ id: "c1", label: "Hợp đồng thuê phòng 101" }];

const CreateInvoice = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) => createInvoice(values),
    onSuccess: () => {
      notification.success({ message: "Tạo hóa đơn thành công" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      navigate("/manage/invoices");

    },
    onError: (e: any) =>
      notification.error({ message: "Lỗi", description: e.message }),
  });

  const onFinish = (values: any) => {
    const result = InvoiceFormSchema.safeParse(values);
    if (!result.success) {
      notification.error({ message: "Dữ liệu không hợp lệ" });
      return;
    }
    mutation.mutate(result.data);
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Title level={4} className="!mb-0">Tạo hóa đơn mới</Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ status: InvoiceStatus.DRAFT }}
        className="border border-gray-300 rounded-xl max-w-full"
      >
        <div className="p-5 flex flex-col gap-1">
          {/* Hợp đồng */}
          <Form.Item
            name="contract_id"
            label="Hợp đồng"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="Chọn hợp đồng..."
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={mockContractsForInvoice.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
          </Form.Item>

          {/* Trạng thái */}
          <Form.Item name="status" label="Trạng thái">
            <Select>
              <Select.Option value={InvoiceStatus.DRAFT}>Nháp</Select.Option>
              <Select.Option value={InvoiceStatus.ISSUED}>
                Phát hành ngay
              </Select.Option>
            </Select>
          </Form.Item>

          {/* Kỳ thanh toán */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="period_start"
              label="Kỳ bắt đầu"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="period_end"
              label="Kỳ kết thúc"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
          </div>

          {/* Ngày phát hành & hạn */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="issue_date"
              label="Ngày phát hành"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="due_date"
              label="Hạn thanh toán"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
            >
              Tạo hóa đơn
            </Button>
            <Button onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CreateInvoice;
