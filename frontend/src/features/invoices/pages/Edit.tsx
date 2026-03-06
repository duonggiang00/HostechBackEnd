import { useEffect } from "react";
import { Form, Input, Select, Button, notification, Spin, Alert } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import {
  getInvoiceById,
  updateInvoice,
} from "../api/invoiceApi";
import {
  InvoiceStatus,
  InvoiceFormSchema,
  InvoiceStatusLabels,
} from "../../../Types/InvoiceTypes";
import type { InvoiceFormValues } from "../../../Types/InvoiceTypes";

const mockContractsForInvoice: any[] = [{ id: "c1", label: "Hợp đồng thuê phòng 101" }];

const EditInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceById(id!),
    retry: false,
  });

  useEffect(() => {
    if (invoice) {
      form.setFieldsValue({
        contract_id: invoice.contract?.id,
        status: invoice.status,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
      });
    }
  }, [invoice, form]);

  const mutation = useMutation({
    mutationFn: (values: InvoiceFormValues) => updateInvoice(id!, values),
    onSuccess: () => {
      notification.success({ message: "Cập nhật hóa đơn thành công" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
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

  if (isLoading)
    return (
      <div className="p-6">
        <Spin />
      </div>
    );
  if (error) {
    const is404 = (error as Error).message === "404";
    return (
      <div className="p-6">
        <Alert
          type={is404 ? "warning" : "error"}
          message={
            is404
              ? "Không tìm thấy hóa đơn (404)"
              : "Không có quyền truy cập (403)"
          }
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

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Chỉnh sửa hóa đơn</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="border border-gray-300 rounded-xl max-w-full"
      >
        <div className="p-5 flex flex-col gap-1">
          <Form.Item
            name="contract_id"
            label="Hợp đồng"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
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

          <Form.Item name="status" label="Trạng thái">
            <Select>
              {Object.values(InvoiceStatus).map((val) => (
                <Select.Option key={val} value={val}>
                  {InvoiceStatusLabels[val]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
              className="bg-blue-500"
            >
              Lưu thay đổi
            </Button>
            <Button onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default EditInvoice;
