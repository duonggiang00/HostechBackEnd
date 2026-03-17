import { useState } from "react";
import { Form, Input, InputNumber, Select, Button, notification, Steps, Card, Typography } from "antd";

const { Title, Text } = Typography;
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { createContract } from "../api/contractApi";
import {
  ContractStatus,
  ContractFormSchema,
} from "../../../Types/ContractTypes";
import type { ContractFormValues } from "../../../Types/ContractTypes";
import Api from "../../../Api/Api"; // Used to fetch properties/rooms if not using hooks directly

const billingCycleOptions = [
  { label: "Hàng tháng", value: "MONTHLY" },
  { label: "Hàng quý", value: "QUARTERLY" },
  { label: "Hàng năm", value: "YEARLY" },
];

const CreateContract = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);

  // Draft form data to keep state between steps
  const [formData, setFormData] = useState<Partial<ContractFormValues>>({
    status: ContractStatus.DRAFT,
    billing_cycle: "MONTHLY",
  });

  // Mock fetching for demonstration. Recommend replacing with real hooks.
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
      queryKey: ["properties"],
      queryFn: async () => {
          const res = await Api.get("properties");
          return res.data?.data || [];
      }
  });

  const propertyId = Form.useWatch("property_id", form);

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
      queryKey: ["rooms", propertyId],
      queryFn: async () => {
          if (!propertyId) return [];
          const res = await Api.get(`properties/${propertyId}/rooms`);
          return res.data?.data || [];
      },
      enabled: !!propertyId
  });

  const mutation = useMutation({
    mutationFn: (values: ContractFormValues) => createContract(values),
    onSuccess: () => {
      notification.success({ message: "Tạo hợp đồng thành công" });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      // Go back to list
      navigate("/manage/contracts");
    },
    onError: (e: any) => {
      notification.error({ message: "Lỗi tạo hợp đồng", description: e?.response?.data?.message || e.message });
    },
  });

  const stepFields = [
    ["property_id", "room_id"],
    ["tenant_name", "tenant_phone", "tenant_email"],
    ["start_date", "end_date", "rent_price", "deposit_amount", "billing_cycle", "due_day", "cutoff_day"],
    [] // Step 3 has no fields to validate
  ];

  const next = async () => {
    try {
      const currentFields = stepFields[currentStep];
      if (currentFields && currentFields.length > 0) {
          await form.validateFields(currentFields);
      }
      
      const values = form.getFieldsValue(currentFields);
      setFormData(prev => ({ ...prev, ...values }));
      setCurrentStep(currentStep + 1);
    } catch (error) {
       console.log("Validation Failed:", error);
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const onFinish = () => {
      const finalData = { ...formData, ...form.getFieldsValue(true) };
      
      // Transform numerical fields
      const dataToSubmit = {
          ...finalData,
          rent_price: Number(finalData.rent_price),
          deposit_amount: Number(finalData.deposit_amount),
          due_day: parseInt(finalData.due_day as any) || 5,
          cutoff_day: parseInt(finalData.cutoff_day as any) || 28,
          members: [{
              full_name: finalData.tenant_name,
              phone: finalData.tenant_phone,
              email: finalData.tenant_email || "",
              role: "ROOMMATE",
              is_primary: true
          }],
          status: ContractStatus.DRAFT // Always start as draft when creating
      };

      const result = ContractFormSchema.safeParse(dataToSubmit);
      
      if (!result.success) {
          console.error(result.error);
          notification.error({ message: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các bước." });
          return;
      }
      
      mutation.mutate(result.data);
  };

  const steps = [
    {
      title: 'Tòa nhà & Phòng',
      content: (
          <div className="grid grid-cols-2 gap-4 mt-6">
              <Form.Item
                  name="property_id"
                  label="Tòa nhà"
                  rules={[{ required: true, message: "Vui lòng chọn tòa nhà" }]}
              >
                  <Select placeholder="Chọn tòa nhà" loading={isLoadingProperties}>
                      {propertiesData?.map((p: any) => (
                          <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                      ))}
                  </Select>
              </Form.Item>

              <Form.Item
                  name="room_id"
                  label="Phòng"
                  rules={[{ required: true, message: "Vui lòng chọn phòng" }]}
              >
                  <Select placeholder="Chọn phòng" loading={isLoadingRooms} disabled={!propertyId}>
                      {roomsData?.map((r: any) => (
                          <Select.Option key={r.id} value={r.id}>{r.name} - {r.code}</Select.Option>
                      ))}
                  </Select>
              </Form.Item>
          </div>
      ),
    },
    {
      title: 'Người thuê',
      content: (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Form.Item
                  name="tenant_name"
                  label="Họ tên người thuê (Người đại diện)"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                  <Input placeholder="Nguyễn Văn A" />
              </Form.Item>

              <Form.Item
                  name="tenant_phone"
                  label="Số điện thoại"
                  rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
              >
                  <Input placeholder="0901234567" />
              </Form.Item>

              <Form.Item
                  name="tenant_email"
                  label="Email (Tùy chọn)"
              >
                  <Input type="email" placeholder="example@gmail.com" />
              </Form.Item>
          </div>
      ),
    },
    {
      title: 'Thời hạn & Chi phí',
      content: (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="rent_price"
                label="Giá thuê (VNĐ)"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber className="w-full" min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
                />
              </Form.Item>
              <Form.Item
                name="deposit_amount"
                label="Tiền đặt cọc (VNĐ)"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber className="w-full" min={0} 
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                name="billing_cycle"
                label="Kỳ thanh toán"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <Select options={billingCycleOptions} />
              </Form.Item>
              <Form.Item
                name="due_day"
                label="Ngày đến hạn (Hàng tháng)"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber min={1} max={31} className="w-full" placeholder="VD: 5" />
              </Form.Item>
              <Form.Item
                name="cutoff_day"
                label="Ngày chốt điện nước"
                rules={[{ required: true, message: "Bắt buộc" }]}
              >
                <InputNumber min={1} max={31} className="w-full" placeholder="VD: 28" />
              </Form.Item>
            </div>
          </div>
      ),
    },
    {
        title: "Xác nhận & Lưu",
        content: (
            <div className="mt-6">
                <Card className="bg-slate-50 border-emerald-100">
                    <p className="mb-2 text-slate-600">Vui lòng kiểm tra lại các thông tin trước khi lưu hợp đồng. Sau khi lưu, hợp đồng sẽ ở trạng thái <b>Bản nháp (DRAFT)</b>.</p>
                    <p className="mb-6 text-slate-600">Bạn có thể gửi yêu cầu xác nhận cho Khách thuê (Tenant) sau.</p>
                    
                    <div className="font-medium text-slate-700">Tóm tắt:</div>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-slate-600">
                        <li><b>Người thuê:</b> {form.getFieldValue('tenant_name')} ({form.getFieldValue('tenant_phone')})</li>
                        <li><b>Giá thuê:</b> {form.getFieldValue('rent_price')?.toLocaleString()} VNĐ</li>
                        <li><b>Tiền cọc:</b> {form.getFieldValue('deposit_amount')?.toLocaleString()} VNĐ</li>
                        <li><b>Thời hạn:</b> {form.getFieldValue('start_date')} đến {form.getFieldValue('end_date')}</li>
                    </ul>
                </Card>
            </div>
        )
    }
  ];

  return (
    <div className="flex flex-col gap-5 p-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
            <Title level={4} className="!mb-0">Tạo hợp đồng mới</Title>
            <Text type="secondary" className="text-sm">Điền thông tin hợp đồng theo các bước dưới đây</Text>
        </div>
      </div>

      <Card className="shadow-sm">
        <Steps current={currentStep} className="mb-8" items={steps.map(item => ({ title: item.title }))} />

        <Form
            form={form}
            layout="vertical"
            initialValues={formData}
        >
            {/* Wrapper to preserve form state while hiding steps */}
            {steps.map((step, index) => (
                <div key={step.title} style={{ display: currentStep === index ? 'block' : 'none' }}>
                    {step.content}
                </div>
            ))}
            
            <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                {currentStep > 0 ? (
                    <Button onClick={() => prev()}>Quay lại</Button>
                ) : (
                    <Button onClick={() => navigate(-1)}>Hủy</Button>
                )}
                
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={() => next()}>
                        Tiếp tục
                    </Button>
                )}
                
                {currentStep === steps.length - 1 && (
                    <Button 
                        type="primary" 
                        onClick={onFinish} 
                        loading={mutation.isPending}
                    >
                        Lưu bản nháp
                    </Button>
                )}
            </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateContract;
