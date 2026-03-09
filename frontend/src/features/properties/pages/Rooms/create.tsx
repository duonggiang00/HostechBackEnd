import { useEffect, useState } from "react";
import { Button, Input, Form, Select, InputNumber, notification, Upload, Tabs, Divider, Space, Card, Empty } from "antd";
import { useNavigate, useLocation } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRoom } from "../../api/propertyApi";
import { uploadMedia } from "../../../../features/media/api/mediaApi";
import { useServices } from "../../../../features/services/hooks/useServices";
import { QUERY_KEYS } from "../../../../shared/constants/queryKeys";
import { useProperties, useFloorsByProperty } from "../../hooks/useProperties";
import { 
  DoorOpen, Home, Layers, Hash, Coins, Maximize, Users, 
  X as XIcon, Plus, Trash2, ClipboardList, Wrench, 
  ImagePlus, Info, CheckCircle2, ChevronRight
} from "lucide-react";

const CreateRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [fileList, setFileList] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const statePropertyId = location.state?.propertyId as string | undefined;
  const stateFloorId = location.state?.floorId as string | undefined;

  const selectedPropertyId = Form.useWatch("property_id", form);

  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesData?.data || [];

  const { data: floors, isLoading: floorsLoading } = useFloorsByProperty(selectedPropertyId || statePropertyId || "");
  const { data: services, isLoading: servicesLoading } = useServices();

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

  const onFinish = async (values: any) => {
    setIsUploading(true);
    try {
      const mediaIds: string[] = [];
      
      // 1. Upload images if any
      for (const file of fileList) {
        if (file.originFileObj) {
          const res = await uploadMedia(file.originFileObj, "room");
          mediaIds.push(res.id);
        }
      }

      // 2. Prepare payload
      const payload = {
        ...values,
        media_ids: mediaIds,
        // Backend expects json for utilities and amenities
        utilities: values.services ? JSON.stringify(values.services) : null,
      };

      createMutation.mutate(payload);
    } catch (error) {
      notification.error({ message: "Lỗi tải ảnh lên hệ thống" });
    } finally {
      setIsUploading(false);
    }
  };

  const showPropertyDropdown = !statePropertyId;
  const showFloorDropdown = !stateFloorId;

  const tabItems = [
    {
      key: "basic",
      label: (
        <span className="flex items-center gap-2">
          <Info size={16} /> Thông tin cơ bản
        </span>
      ),
      children: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {showPropertyDropdown ? (
              <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
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
                    size="large"
                    onChange={handlePropertyChange}
                    className="rounded-xl"
                  />
                </Form.Item>
              </div>
            ) : (
              <Form.Item name="property_id" hidden><Input /></Form.Item>
            )}

            {showFloorDropdown ? (
              <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
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
                    className="rounded-xl"
                  />
                </Form.Item>
              </div>
            ) : (
              <Form.Item name="floor_id" hidden><Input /></Form.Item>
            )}
          </div>

          <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden" bodyStyle={{ padding: 24 }}>
            <h3 className="text-base font-semibold text-slate-700 mb-6 flex items-center gap-2">
              <ClipboardList size={18} className="text-emerald-500" />
              Chi tiết phòng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Form.Item
                name="name"
                label={<span className="text-slate-600 font-medium font-inter">Tên phòng <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: "Vui lòng nhập tên phòng!" }]}
              >
                <Input
                  prefix={<DoorOpen size={16} className="text-slate-400 mr-2" />}
                  placeholder="Ví dụ: P.101, Phòng VIP..."
                  className="rounded-xl h-12"
                />
              </Form.Item>

              <Form.Item
                name="code"
                label={<span className="text-slate-600 font-medium font-inter">Mã phòng</span>}
              >
                <Input
                  prefix={<Hash size={16} className="text-slate-400 mr-2" />}
                  placeholder="R101"
                  className="rounded-xl h-12 uppercase"
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
              <Form.Item
                name="base_price"
                label={<span className="text-slate-600 font-medium font-inter">Giá thuê (VNĐ) <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
              >
                <InputNumber
                  min={0}
                  step={100000}
                  prefix={<Coins size={16} className="text-slate-400 mr-2" />}
                  placeholder="3,500,000"
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',',)}
                  parser={(val) => Number(val?.replace(/\$\s?|(,*)/g, '')) as any}
                  className="w-full rounded-xl h-12 flex items-center"
                  controls={false}
                />
              </Form.Item>

              <Form.Item
                name="area"
                label={<span className="text-slate-600 font-medium font-inter">Diện tích (m²)</span>}
              >
                <InputNumber
                  min={0}
                  prefix={<Maximize size={16} className="text-slate-400 mr-2" />}
                  placeholder="25"
                  className="w-full rounded-xl h-12 flex items-center"
                />
              </Form.Item>

              <Form.Item
                name="capacity"
                label={<span className="text-slate-600 font-medium font-inter">Sức chứa tối đa (người)</span>}
              >
                <InputNumber
                  min={1}
                  prefix={<Users size={16} className="text-slate-400 mr-2" />}
                  placeholder="2"
                  className="w-full rounded-xl h-12 flex items-center"
                />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label={<span className="text-slate-600 font-medium font-inter mt-4 block">Mô tả thêm</span>}
              className="mt-4"
            >
              <Input.TextArea
                rows={4}
                placeholder="Tiện ích nội thất, view phòng, hướng nắng..."
                className="rounded-xl p-3"
              />
            </Form.Item>
          </Card>
        </div>
      )
    },
    {
      key: "assets",
      label: (
        <span className="flex items-center gap-2">
          <Wrench size={16} /> Tài sản & Dịch vụ
        </span>
      ),
      children: (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="rounded-2xl border border-gray-100 shadow-sm" bodyStyle={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Wrench size={18} className="text-blue-500" />
                  Danh sách trang thiết bị
                </h3>
                <p className="text-sm text-slate-500 mt-1">Các vật dụng có sẵn trong phòng khi bàn giao</p>
              </div>
            </div>

            <Form.List name="assets">
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="p-4 bg-slate-50/50 rounded-2xl border border-gray-100 flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: 'Nhập tên tài sản' }]}
                          className="mb-0"
                        >
                          <Input placeholder="Tên: Tivi, Điều hòa..." className="rounded-xl h-10" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'serial']}
                          className="mb-0"
                        >
                          <Input placeholder="Số serial (nếu có)" className="rounded-xl h-10" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'condition']}
                          className="mb-0"
                        >
                          <Select placeholder="Tình trạng" className="rounded-xl" style={{ height: 40 }}>
                            <Select.Option value="Likenew">Mới 100%</Select.Option>
                            <Select.Option value="Good">Hoạt động tốt</Select.Option>
                            <Select.Option value="Old">Cũ/Trầy xước</Select.Option>
                            <Select.Option value="Pending">Cần bảo trì</Select.Option>
                          </Select>
                        </Form.Item>
                      </div>
                      <Button 
                        type="text" 
                        danger 
                        icon={<Trash2 size={18} />} 
                        onClick={() => remove(name)}
                        className="flex items-center justify-center p-0 w-10 h-10 rounded-full hover:bg-red-50"
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<Plus size={16} />}
                    className="h-12 rounded-xl text-slate-500 border-slate-300 hover:text-emerald-600 hover:border-emerald-600 flex items-center justify-center gap-2"
                  >
                    Thêm trang thiết bị
                  </Button>
                  {fields.length === 0 && (
                    <Empty description="Chưa có trang thiết bị nào được thêm" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-2" />
                  )}
                </div>
              )}
            </Form.List>
          </Card>

          <Card className="rounded-2xl border border-gray-100 shadow-sm" bodyStyle={{ padding: 24 }}>
            <h3 className="text-base font-semibold text-slate-700 mb-6 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              Dịch vụ đính kèm
            </h3>
            <Form.Item name="services" className="mb-0">
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Chọn các dịch vụ áp dụng cho phòng này (Điện, nước, rác...)"
                loading={servicesLoading}
                className="rounded-xl custom-multiple-select"
                size="large"
                options={services?.map((s: any) => ({ label: `${s.name} (${s.unit})`, value: s.id }))}
                maxTagCount="responsive"
              />
            </Form.Item>
            <p className="text-xs text-slate-400 mt-3 italic">* Khách thuê sẽ được tự động gán các dịch vụ này khi tạo hợp đồng</p>
          </Card>
        </div>
      )
    },
    {
      key: "images",
      label: (
        <span className="flex items-center gap-2">
          <ImagePlus size={16} /> Hình ảnh
        </span>
      ),
      children: (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="rounded-2xl border border-gray-100 shadow-sm" bodyStyle={{ padding: 32 }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImagePlus size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Hình ảnh căn bản của phòng</h3>
              <p className="text-slate-500">Tải lên ít nhất 3 ảnh để phòng trông chuyên nghiệp hơn</p>
            </div>
            
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={() => false}
              multiple
              className="upload-room-images flex flex-wrap justify-center gap-4"
            >
              {fileList.length >= 8 ? null : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Plus size={20} className="text-slate-400" />
                  <div className="text-xs text-slate-500 font-medium">Tải lên</div>
                </div>
              )}
            </Upload>
            
            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <div className="flex gap-3">
                <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-700">
                  <span className="font-semibold block mb-1">Mẹo nhỏ:</span>
                  Ảnh đẹp giúp tăng khả năng khách thuê chốt phòng lên đến 40%. Nên chụp góc rộng và đủ sáng.
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50/70 flex justify-center py-12 px-4">
      <div className="w-full max-w-5xl flex flex-col bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white overflow-hidden backdrop-blur-sm">

        {/* HEADER AREA */}
        <div className="px-10 py-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Space size={12}>
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <DoorOpen size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Thêm phòng mới
                </h2>
                <nav className="flex items-center text-sm text-slate-400 font-medium gap-1.5">
                  <span className="hover:text-slate-600 transition-colors cursor-default">Quản lý nhà</span>
                  <ChevronRight size={14} />
                  <span className="text-emerald-500">Thêm phòng</span>
                </nav>
              </div>
            </Space>
          </div>
          <Button
            type="text"
            icon={<XIcon size={20} className="text-slate-400" />}
            onClick={() => navigate(-1)}
            className="hover:bg-slate-100 rounded-2xl w-11 h-11 flex items-center justify-center transition-all"
          />
        </div>

        <Divider className="my-0 border-slate-50" />

        {/* FORM CONTENT */}
        <div className="flex-1 flex flex-col md:flex-row h-full min-h-[600px]">
          
          {/* NAVIGATION BAR (LEFT) */}
          <div className="w-full md:w-72 bg-slate-50/40 p-6 md:p-8 space-y-6">
            <div className="hidden md:block mb-8">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-4">Các bước thực hiện</h4>
              <div className="space-y-3">
                {[
                  { key: "basic", label: "Thông tin cơ bản", icon: Info, color: "text-indigo-500", bg: "bg-indigo-50" },
                  { key: "assets", label: "Tài sản & Dịch vụ", icon: Wrench, color: "text-blue-500", bg: "bg-blue-50" },
                  { key: "images", label: "Hình ảnh phòng", icon: ImagePlus, color: "text-emerald-500", bg: "bg-emerald-50" }
                ].map((item) => (
                  <div 
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`
                      p-4 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-300 group
                      ${activeTab === item.key 
                        ? 'bg-white shadow-md shadow-slate-200/50 scale-[1.02]' 
                        : 'hover:bg-slate-100/70 border border-transparent'}
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${activeTab === item.key ? item.bg + ' ' + item.color : 'bg-white text-slate-400'}
                    `}>
                      <item.icon size={18} />
                    </div>
                    <span className={`text-[14.5px] font-bold transition-colors ${activeTab === item.key ? 'text-slate-800' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl shadow-slate-200">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Trạng thái</span>
               </div>
               <p className="text-xs text-slate-300 leading-relaxed font-medium">
                 Đang tạo phòng mới cho {selectedPropertyId ? properties.find(p => p.id === selectedPropertyId)?.name : '...'}
               </p>
            </div>
          </div>

          {/* FORM FIELDS (RIGHT/CENTER) */}
          <div className="flex-1 bg-white p-6 md:p-10">
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={onFinish} 
              requiredMark={false}
              autoComplete="off"
              initialValues={{ assets: [] }}
            >
              {/* HIDDEN INPUTS FOR STATE BINDING */}
              <Form.Item name="property_id" hidden><Input /></Form.Item>
              <Form.Item name="floor_id" hidden><Input /></Form.Item>

              <Tabs 
                activeKey={activeTab} 
                onChange={setActiveTab} 
                renderTabBar={() => <></>}
                items={tabItems}
              />
            </Form>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-md">
           <div className="flex items-center gap-2 text-slate-400">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
             <span className="text-xs font-semibold uppercase tracking-wider">Hostech Property Management</span>
           </div>
           
           <div className="flex gap-4">
              <Button
                onClick={() => navigate(-1)}
                className="rounded-2xl h-12 px-8 border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all border-2"
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={createMutation.isPending || isUploading}
                className="rounded-2xl h-12 px-10 bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20 font-bold text-[15px] transition-all transform hover:translate-y-[-2px] active:translate-y-[0]"
              >
                {isUploading ? 'Đang tải ảnh...' : (activeTab === 'images' ? 'Hoàn tất & Tạo phòng' : 'Tạo phòng ngay')}
              </Button>
           </div>
        </div>
      </div>
      
      {/* GLOBAL CUSTOM STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-multiple-select .ant-select-selector {
          border-radius: 12px !important;
          padding: 6px 12px !important;
          border-color: #e2e8f0 !important;
        }
        .upload-room-images .ant-upload-select-picture-card {
          border-radius: 20px !important;
          border: 2px dashed #e2e8f0 !important;
          background: #f8fafc !important;
          width: 120px !important;
          height: 120px !important;
        }
        .upload-room-images .ant-upload-list-item {
          border-radius: 20px !important;
          width: 120px !important;
          height: 120px !important;
        }
        .ant-form-item-label label {
          font-family: 'Inter', sans-serif !important;
        }
      ` }} />
    </div>
  );
};

export default CreateRoom;

