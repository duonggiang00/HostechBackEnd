import { useEffect } from "react";
import { Button, Input, Form, Select, InputNumber, Skeleton } from "antd";
import { useNavigate, useParams } from "react-router";
import {
  useRoom,
  useUpdateRoom,
  useProperties,
  useFloorsByProperty,
  useProperty,
  useRooms,
} from "../../hooks/useProperties";
import {
  DoorOpen,
  Home,
  Layers,
  Hash,
  Coins,
  Maximize,
  Users,
  X as XIcon,
  Pencil,
} from "lucide-react";

const EditRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  const { data: room, isLoading: roomLoading } = useRoom(id || "");
  const updateMutation = useUpdateRoom(id || "");

  const selectedPropertyId = Form.useWatch("property_id", form);

  const propertyId = Form.useWatch("property_id", form);
  const { data: property } = useProperty(propertyId || "");
  const { data: rooms } = useRooms({ property_id: propertyId });

  const { data: propertiesData, isLoading: propertiesLoading } =
    useProperties();
  const properties = propertiesData?.data || [];

  const { data: floors, isLoading: floorsLoading } = useFloorsByProperty(
    selectedPropertyId || "",
  );

  useEffect(() => {
    if (room) {
      form.setFieldsValue({
        property_id: (room as any)?.property?.id || (room as any).property_id,
        floor_id: (room as any)?.floor?.id || (room as any).floor_id,
        name: room.name,
        code: room.code,
        base_price: room.base_price,
        area: room.area,
        capacity: room.capacity,
        description: room.description,
      });
    }
  }, [room, form]);

  const handleClose = () => {
    navigate(-1);
  };

  const handlePropertyChange = () => {
    form.setFieldValue("floor_id", undefined); // Reset floor when property changes
  };

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-4xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Pencil size={20} className="text-amber-500" />
              Chỉnh sửa phòng
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Cập nhật thông tin phòng
            </p>
          </div>
          <Button
            type="text"
            icon={<XIcon size={20} className="text-slate-500" />}
            onClick={handleClose}
            className="hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center p-0"
          />
        </div>

        {/* FORM BODY */}
        <div className="p-6">
          {roomLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={(v) => updateMutation.mutate(v)}
              requiredMark={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <Form.Item
                    name="property_id"
                    label={
                      <span className="text-slate-600 font-medium flex items-center gap-2">
                        <Home size={16} className="text-indigo-500" /> Chọn nhà
                        trọ <span className="text-red-500">*</span>
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng chọn nhà trọ!" },
                    ]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn nhà trọ..."
                      loading={propertiesLoading}
                      options={properties.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.code})`,
                      }))}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      size="large"
                      onChange={handlePropertyChange}
                    />
                  </Form.Item>
                </div>

                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                  <Form.Item
                    name="floor_id"
                    label={
                      <span className="text-slate-600 font-medium flex items-center gap-2">
                        <Layers size={16} className="text-indigo-500" /> Chọn
                        tầng <span className="text-red-500">*</span>
                      </span>
                    }
                    rules={[{ required: true, message: "Vui lòng chọn tầng!" }]}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn tầng..."
                      loading={floorsLoading}
                      disabled={!selectedPropertyId}
                      options={
                        floors?.data?.map((f) => ({
                          value: f.id,
                          label: f.name,
                        })) || []
                      }
                      size="large"
                    />
                  </Form.Item>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-slate-700 mb-2 px-1 border-b border-gray-50 pb-3">
                  Thông tin chi tiết phỏng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="name"
                    label={
                      <span className="text-slate-600 font-medium">
                        Tên phòng <span className="text-red-500">*</span>
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập tên phòng!" },
                    ]}
                  >
                    <Input
                      prefix={
                        <DoorOpen size={16} className="text-slate-400 mr-2" />
                      }
                      placeholder="Ví dụ: P.101, Phòng VIP..."
                      className="rounded-xl h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label={
                      <span className="text-slate-600 font-medium">
                        Mã phòng
                      </span>
                    }
                  >
                    <Input
                      prefix={
                        <Hash size={16} className="text-slate-400 mr-2" />
                      }
                      placeholder="R101"
                      className="rounded-xl h-11 uppercase"
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Form.Item
                    name="base_price"
                    label={
                      <span className="text-slate-600 font-medium">
                        Giá thuê (VNĐ) <span className="text-red-500">*</span>
                      </span>
                    }
                    rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
                  >
                    <InputNumber
                      min={0}
                      step={100000}
                      prefix={
                        <Coins size={16} className="text-slate-400 mr-2" />
                      }
                      placeholder="3,500,000"
                      formatter={(val) =>
                        `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(val) =>
                        Number(val?.replace(/\$\s?|(,*)/g, "")) as any
                      }
                      className="w-full rounded-xl h-11"
                      controls={false}
                    />
                  </Form.Item>

                  <Form.Item
                    name="area"
                    label={
                      <span className="text-slate-600 font-medium">
                        Diện tích (m²)
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập diện tích phòng",
                      },
                      {
                        validator: async (_, value) => {
                          if (!value) return Promise.resolve();

                          if (!property?.area || !rooms?.data) {
                            return Promise.resolve();
                          }

                          // ✅ FILTER LẠI
                          const roomsData = (rooms.data ?? []).filter(
                            (r: any) =>
                              String(r.property_id) === String(propertyId),
                          );

                          const editingRoom = roomsData.find(
                            (r: any) => String(r.id) === String(id),
                          );

                          const currentRoomArea = Number(
                            editingRoom?.area || 0,
                          );

                          const totalRoomArea = roomsData.reduce(
                            (sum: number, r: any) => sum + Number(r.area || 0),
                            0,
                          );

                          const newTotal =
                            totalRoomArea - currentRoomArea + Number(value);

                          if (newTotal > Number(property.area)) {
                            return Promise.reject(
                              new Error(
                                `Tổng diện tích phòng (${newTotal} m²) vượt quá diện tích nhà (${property.area} m²)`,
                              ),
                            );
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      prefix={
                        <Maximize size={16} className="text-slate-400 mr-2" />
                      }
                      placeholder="25"
                      className="w-full rounded-xl h-11"
                    />
                  </Form.Item>

                  <Form.Item
                    name="capacity"
                    label={
                      <span className="text-slate-600 font-medium">
                        Sức chứa tối đa (người)
                      </span>
                    }
                  >
                    <InputNumber
                      min={1}
                      prefix={
                        <Users size={16} className="text-slate-400 mr-2" />
                      }
                      placeholder="2"
                      className="w-full rounded-xl h-11"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="description"
                  label={
                    <span className="text-slate-600 font-medium">
                      Mô tả thêm
                    </span>
                  }
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Tiện ích nội thất, view phòng..."
                    className="rounded-xl p-3"
                  />
                </Form.Item>
              </div>
            </Form>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <Button
            onClick={handleClose}
            className="rounded-xl h-10 px-6 border-slate-200 text-slate-600 hover:text-slate-800"
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={updateMutation.isPending}
            disabled={roomLoading}
            className="rounded-xl h-10 px-8 bg-amber-500 hover:bg-amber-600 border-none shadow-md shadow-amber-500/20 font-medium"
          >
            Cập nhật
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditRoom;
