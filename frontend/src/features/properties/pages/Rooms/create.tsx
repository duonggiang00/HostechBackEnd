import { useEffect } from "react";
import { Button, Input, Form, Select, InputNumber, notification } from "antd";
import { useNavigate, useLocation } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom } from "../../api/propertyApi";
import { QUERY_KEYS } from "../../../../shared/constants/queryKeys";
import { useProperties, useFloorsByProperty } from "../../hooks/useProperties";
import { DoorOpen, Home, Layers, Hash, Coins, Maximize, Users, X as XIcon } from "lucide-react";

const CreateRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const statePropertyId = location.state?.propertyId as string | undefined;
  const stateFloorId = location.state?.floorId as string | undefined;

  // Watch selected property to load its floors
  const selectedPropertyId = Form.useWatch("property_id", form);

  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesData?.data || [];

  const { data: floors, isLoading: floorsLoading } = useFloorsByProperty(selectedPropertyId || statePropertyId || "");

  useEffect(() => {
    if (statePropertyId) {
      form.setFieldValue("property_id", statePropertyId);
    } else if (properties.length === 1) {
      form.setFieldValue("property_id", properties[0].id);
    }
  }, [statePropertyId, properties, form]);

  useEffect(() => {
    if (stateFloorId) {
      form.setFieldValue("floor_id", stateFloorId);
    }
  }, [stateFloorId, form]);

  // If property changes, reset floor if we aren't bound by state
  const handlePropertyChange = () => {
    if (!stateFloorId) {
      form.setFieldValue("floor_id", undefined);
    }
  };

  const createMutation = useMutation({
    mutationFn: ({ property_id, ...data }: any) => createRoom(property_id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.rooms.all });
      notification.success({ message: "Tạo phòng thành công" });
      navigate(-1);
    },
    onError: (err: any) => {
      notification.error({ message: err?.response?.data?.message ?? "Lỗi tạo phòng" });
    },
  });

  const showPropertyDropdown = !statePropertyId;
  const showFloorDropdown = !stateFloorId;

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-4xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <DoorOpen size={20} className="text-emerald-500" />
              Thêm phòng mới
            </h2>
            <p className="text-sm text-slate-500 mt-1">Điền thông tin cơ bản cho phòng</p>
          </div>
          <Button
            type="text"
            icon={<XIcon size={20} className="text-slate-500" />}
            onClick={() => navigate(-1)}
            className="hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center p-0"
          />
        </div>

        {/* FORM BODY */}
        <div className="p-6">
          <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)} requiredMark={false}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {showPropertyDropdown ? (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <Form.Item
                    name="property_id"
                    label={<span className="text-slate-600 font-medium flex items-center gap-2"><Home size={16} className="text-indigo-500" /> Chọn nhà trọ <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng chọn nhà trọ!" }]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn nhà trọ..."
                      loading={propertiesLoading}
                      options={properties.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                      showSearch
                      filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                      size="large"
                      onChange={handlePropertyChange}
                    />
                  </Form.Item>
                </div>
              ) : (
                <Form.Item name="property_id" hidden><Input /></Form.Item>
              )}

              {showFloorDropdown ? (
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <Form.Item
                    name="floor_id"
                    label={<span className="text-slate-600 font-medium flex items-center gap-2"><Layers size={16} className="text-indigo-500" /> Chọn tầng <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng chọn tầng!" }]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn tầng..."
                      loading={floorsLoading}
                      disabled={!selectedPropertyId && !statePropertyId}
                      options={floors?.map((f) => ({ value: f.id, label: f.name })) || []}
                      size="large"
                    />
                  </Form.Item>
                </div>
              ) : (
                <Form.Item name="floor_id" hidden><Input /></Form.Item>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-700 mb-2 px-1 border-b border-gray-50 pb-3">Thông tin chi tiết phòng</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label={<span className="text-slate-600 font-medium">Tên phòng <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: "Vui lòng nhập tên phòng!" }]}
                >
                  <Input
                    prefix={<DoorOpen size={16} className="text-slate-400 mr-2" />}
                    placeholder="Ví dụ: P.101, Phòng VIP..."
                    className="rounded-xl h-11"
                  />
                </Form.Item>

                <Form.Item
                  name="code"
                  label={<span className="text-slate-600 font-medium">Mã phòng</span>}
                >
                  <Input
                    prefix={<Hash size={16} className="text-slate-400 mr-2" />}
                    placeholder="R101"
                    className="rounded-xl h-11 uppercase"
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name="base_price"
                  label={<span className="text-slate-600 font-medium">Giá thuê (VNĐ) <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
                >
                  <InputNumber
                    min={0}
                    step={100000}
                    prefix={<Coins size={16} className="text-slate-400 mr-2" />}
                    placeholder="3,500,000"
                    formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '')) as any}
                    className="w-full rounded-xl h-11"
                    controls={false}
                  />
                </Form.Item>

                <Form.Item
                  name="area"
                  label={<span className="text-slate-600 font-medium">Diện tích (m²)</span>}
                >
                  <InputNumber
                    min={0}
                    prefix={<Maximize size={16} className="text-slate-400 mr-2" />}
                    placeholder="25"
                    className="w-full rounded-xl h-11"
                  />
                </Form.Item>

                <Form.Item
                  name="capacity"
                  label={<span className="text-slate-600 font-medium">Sức chứa tối đa (người)</span>}
                >
                  <InputNumber
                    min={1}
                    prefix={<Users size={16} className="text-slate-400 mr-2" />}
                    placeholder="2"
                    className="w-full rounded-xl h-11"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label={<span className="text-slate-600 font-medium">Mô tả thêm</span>}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Tiện ích nội thất, view phòng..."
                  className="rounded-xl p-3"
                />
              </Form.Item>
            </div>
          </Form>
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <Button
            onClick={() => navigate(-1)}
            className="rounded-xl h-10 px-6 border-slate-200 text-slate-600 hover:text-slate-800"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={createMutation.isPending}
            className="rounded-xl h-10 px-8 bg-emerald-600 hover:bg-emerald-700 border-none shadow-md shadow-emerald-500/20 font-medium"
          >
            Tạo phòng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoom;
