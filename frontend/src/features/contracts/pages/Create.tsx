import { Form, Input, InputNumber, Select, Button, notification } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { createContract } from "../api/contractApi";
import {
  ContractStatus,
  ContractFormSchema,
} from "../../../Types/ContractTypes";
import type { ContractFormValues } from "../../../Types/ContractTypes";

const mockTenants = [{ id: "t1", full_name: "Nguyễn Văn A", phone: "0901234567" }];

const billingCycleOptions = [
  { label: "Hàng tháng", value: "monthly" },
  { label: "Hàng quý", value: "quarterly" },
  { label: "Hàng năm", value: "yearly" },
];

const CreateContract = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: ContractFormValues) => createContract(values),
    onSuccess: () => {
      notification.success({ message: "Tạo hợp đồng thành công" });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      navigate("/manage/contracts");

    },
    onError: (e: any) => {
      notification.error({ message: "Lỗi", description: e.message });
    },
  });

  const onFinish = (values: any) => {
    const result = ContractFormSchema.safeParse({
      ...values,
      rent_price: Number(values.rent_price),
      deposit_amount: Number(values.deposit_amount),
    });
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
        <h1 className="text-2xl font-bold">Tạo hợp đồng mới</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: ContractStatus.DRAFT,
          billing_cycle: "monthly",
        }}
        className="border border-gray-300 rounded-xl max-w-full"
      >
        <div className="p-5">
          {/* ───── Thông tin phòng & trạng thái ───── */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="room_id"
              label="Phòng"
              rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
            >
              <Select placeholder="Chọn phòng">
                <Select.Option value="room-1">Phòng 101</Select.Option>
                <Select.Option value="room-2">Phòng 102</Select.Option>
                <Select.Option value="room-3">Phòng 103</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Select.Option value={ContractStatus.DRAFT}>Nháp</Select.Option>
                <Select.Option value={ContractStatus.ACTIVE}>
                  Đang hiệu lực
                </Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* ───── Người thuê chính ───── */}
          <Form.Item
            name="primary_user_id"
            label="Người thuê chính"
            rules={[
              { required: true, message: "Vui lòng chọn người thuê chính" },
            ]}
          >
            <Select
              showSearch
              placeholder="Tìm theo tên, SĐT hoặc email..."
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={mockTenants.map((t) => ({
                value: t.id,
                label: `${t.full_name} – ${t.phone}`,
              }))}
            />
          </Form.Item>

          {/* ───── Ngày bắt đầu / kết thúc ───── */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="start_date"
              label="Ngày bắt đầu"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="end_date"
              label="Ngày kết thúc"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input type="date" />
            </Form.Item>
          </div>

          {/* ───── Giá thuê & Đặt cọc ───── */}
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="rent_price"
              label="Giá thuê (VNĐ)"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item
              name="deposit_amount"
              label="Tiền đặt cọc (VNĐ)"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>

          {/* ───── Kỳ thanh toán ───── */}
          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="billing_cycle"
              label="Kỳ thanh toán"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Select options={billingCycleOptions} />
            </Form.Item>
            <Form.Item
              name="due_day"
              label="Ngày đến hạn"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input placeholder="VD: 5" />
            </Form.Item>
            <Form.Item
              name="cutoff_day"
              label="Ngày chốt"
              rules={[{ required: true, message: "Bắt buộc" }]}
            >
              <Input placeholder="VD: 28" />
            </Form.Item>
          </div>

          <div className="flex gap-3">
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              className="bg-blue-500"
            >
              Tạo hợp đồng
            </Button>
            <Button onClick={() => navigate(-1)}>Hủy</Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CreateContract;
