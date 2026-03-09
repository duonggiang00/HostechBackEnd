import { useEffect } from "react";
import { Button, Input, Form, Select, InputNumber, Skeleton } from "antd";
import { useNavigate, useParams } from "react-router";


import { useFloor, useUpdateFloor, useProperties } from "../../hooks/useProperties";
import { Layers, Hash, Home, X as XIcon, Pencil } from "lucide-react";

const EditFloor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();


  const { data: floor, isLoading: floorLoading } = useFloor(id || "");
  const updateMutation = useUpdateFloor(id || "", form.getFieldValue("property_id"));

  const { data: propertiesData, isLoading: propertiesLoading } = useProperties();
  const properties = propertiesData?.data || [];

  useEffect(() => {
    if (floor) {
      form.setFieldsValue({
        property_id: (floor as any)?.property?.id || (floor as any).property_id,
        name: floor.name,
        code: floor.code,
        sort_order: (floor as any).sort_order,
      });
    }
  }, [floor, form]);

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = (values: any) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        handleClose();
      }
    });
  };

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-3xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Pencil size={20} className="text-amber-500" />
              Chỉnh sửa tầng
            </h2>
            <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin tầng</p>
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
          {floorLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>

              {/* Property selector */}
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm mb-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4 px-1 flex items-center gap-2">
                  <Home size={18} className="text-indigo-500" />
                  Nhà trọ
                </h3>
                <Form.Item
                  name="property_id"
                  label={<span className="text-slate-600 font-medium">Chọn nhà trọ <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: "Vui lòng chọn nhà trọ!" }]}
                  className="mb-0"
                >
                  <Select
                    placeholder="Chọn nhà trọ..."
                    loading={propertiesLoading}
                    options={properties.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
                    showSearch
                    filterOption={(input, option) =>
                      String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    size="large"
                    notFoundContent={<span className="text-slate-400 text-sm">Không có nhà trọ nào</span>}
                  />
                </Form.Item>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-4 px-1">Thông tin tầng</h3>

                <Form.Item
                  name="name"
                  label={<span className="text-slate-600 font-medium">Tên tầng <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: "Vui lòng nhập tên tầng!" }]}
                >
                  <Input
                    prefix={<Layers size={16} className="text-slate-400 mr-2" />}
                    placeholder="Ví dụ: Tầng 1, Tầng trệt..."
                    className="rounded-xl h-11 border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
                  />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="code"
                    label={<span className="text-slate-600 font-medium">Mã tầng</span>}
                  >
                    <Input
                      prefix={<Hash size={16} className="text-slate-400 mr-2" />}
                      placeholder="F01"
                      className="rounded-xl h-11 border-slate-200 uppercase"
                    />
                  </Form.Item>

                  <Form.Item
                    name="sort_order"
                    label={<span className="text-slate-600 font-medium">Thứ tự sắp xếp</span>}
                  >
                    <InputNumber
                      min={0}
                      placeholder="1"
                      className="w-full rounded-xl h-11"
                    />
                  </Form.Item>
                </div>
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
            className="rounded-xl h-10 px-8 bg-indigo-600 hover:bg-indigo-700 border-none shadow-md shadow-indigo-500/20 font-medium"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditFloor;
