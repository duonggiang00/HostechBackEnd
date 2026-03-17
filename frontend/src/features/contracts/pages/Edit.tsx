import { useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  notification,
  Spin,
  Alert,
  Typography,
} from "antd";

const { Title } = Typography;
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import {
  getContractById,
  updateContract,
} from "../api/contractApi";
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

const EditContract = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: contract,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contract", id],
    queryFn: () => getContractById(id!),
    retry: false,
  });

  useEffect(() => {
    if (contract) {
      // Tìm người thuê chính hiện tại
      const primaryMember = contract.members.find((m) => m.is_primary === "1");
      form.setFieldsValue({
        room_id: contract.room?.id,
        status: contract.status,
        primary_user_id: primaryMember?.user?.id ?? undefined,
        start_date: contract.start_date,
        end_date: contract.end_date,
        rent_price: contract.rent_price,
        deposit_amount: contract.deposit_amount,
        billing_cycle: contract.billing_cycle,
        due_day: contract.due_day,
        cutoff_day: contract.cutoff_day,
      });
    }
  }, [contract, form]);

  const mutation = useMutation({
    mutationFn: (values: ContractFormValues) => updateContract(id!, values),
    onSuccess: () => {
      notification.success({ message: "Cập nhật hợp đồng thành công" });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
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
              ? "Không tìm thấy hợp đồng (404)"
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
        <Title level={4} className="!mb-0">Chỉnh sửa hợp đồng</Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="border border-gray-300 rounded-xl max-w-full"
      >
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="room_id"
              label="Phòng"
              rules={[{ required: true }]}
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
                <Select.Option value={ContractStatus.PENDING_SIGNATURE}>Chờ ký</Select.Option>
                <Select.Option value={ContractStatus.PENDING_PAYMENT}>Chờ thanh toán</Select.Option>
                <Select.Option value={ContractStatus.ACTIVE}>Đang hiệu lực</Select.Option>
                <Select.Option value={ContractStatus.ENDED}>Hết hạn</Select.Option>
                <Select.Option value={ContractStatus.CANCELLED}>Đã hủy</Select.Option>
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
              placeholder="Tìm theo tên, SĐT..."
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

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="start_date"
              label="Ngày bắt đầu"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="end_date"
              label="Ngày kết thúc"
              rules={[{ required: true }]}
            >
              <Input type="date" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="rent_price"
              label="Giá thuê (VNĐ)"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item
              name="deposit_amount"
              label="Tiền đặt cọc (VNĐ)"
              rules={[{ required: true }]}
            >
              <InputNumber className="w-full" min={0} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="billing_cycle"
              label="Kỳ thanh toán"
              rules={[{ required: true }]}
            >
              <Select options={billingCycleOptions} />
            </Form.Item>
            <Form.Item
              name="due_day"
              label="Ngày đến hạn"
              rules={[{ required: true }]}
            >
              <Input placeholder="VD: 5" />
            </Form.Item>
            <Form.Item
              name="cutoff_day"
              label="Ngày chốt"
              rules={[{ required: true }]}
            >
              <Input placeholder="VD: 28" />
            </Form.Item>
          </div>

          <div className="flex gap-3">
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
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

export default EditContract;
