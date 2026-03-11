import { useEffect } from "react";
import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  notification,
  Spin,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { getServices, updateService } from "../api/serviceApi";
import {
  ServiceCalcModeLabels,
  ServiceFormSchema,
} from "../../../Types/ServiceTypes";
import type { ServiceFormValues } from "../../../Types/ServiceTypes";

const EditService = () => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Lấy dịch vụ cần sửa từ danh sách mock
  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const service = services?.find((s) => s.id === id);

  useEffect(() => {
    if (service) {
      form.setFieldsValue({
        ...service,
        price: service.price || 0,
      });
    }
  }, [service, form]);

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) => updateService(id!, values),
    onSuccess: () => {
      notification.success({ message: "Cập nhật dịch vụ thành công" });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/manage/services");

    },
    onError: (error: any) => {
      notification.error({
        message: "Đã có lỗi xảy ra",
        description: error.message,
      });
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

  if (isLoading) return <Spin className="mt-10" />;

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Chỉnh sửa dịch vụ</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="border border-gray-300 rounded-lg max-w-full"
      >
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 ">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
            >
              <Input placeholder="VD: kWh, Người, Phòng..." />
            </Form.Item>
          </div>

          <Form.Item
            name="price"
            label="Đơn giá (VNĐ)"
            rules={[{ required: true, message: "Vui lòng nhập đơn giá" }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <div className="flex gap-6">
            <Form.Item
              name="is_recurring"
              label="Định kỳ hàng tháng"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="is_active"
              label="Kích hoạt"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>

          <div className="flex gap-3">
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

export default EditService;
