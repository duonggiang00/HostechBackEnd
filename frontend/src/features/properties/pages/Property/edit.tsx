import { useEffect } from "react";
import { Button, Input, Form, Switch, Skeleton, Select } from "antd";
import { useNavigate, useParams } from "react-router";
import { useUpdateProperty, useProperty } from "../../hooks/useProperties";
import { useOrgs } from "../../hooks/useOrgs";
import { usePermission } from "../../../../shared/hooks/usePermission";
import { Home, MapPin, Hash, X, Building2 } from "lucide-react";

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateMutation = useUpdateProperty(id || "");
  const { data: property, isLoading } = useProperty(id || "");
  const [form] = Form.useForm();
  const { role } = usePermission();

  const isOwner = role === "owner" || role === "admin";
  const { data: orgsData, isLoading: orgsLoading } = useOrgs();
  const orgs = orgsData?.data || [];

  useEffect(() => {
    if (property) {
      form.setFieldsValue(property);
    }
  }, [property, form]);

  const handleClose = () => {
    navigate("/manage/properties", { replace: true });
  };

  const handleSubmit = (values: any) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const orgOptions = orgs.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-3xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cập nhật nhà trọ</h2>
            <p className="text-sm text-slate-500 mt-1">Chỉnh sửa thông tin nhà trọ</p>
          </div>
          <Button
            type="text"
            icon={<X size={20} className="text-slate-500" />}
            onClick={handleClose}
            className="hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center p-0"
          />
        </div>

        {/* FORM BODY */}
        <div className="p-6">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white p-6 rounded-2xl border border-gray-100" />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              {/* ORGANIZATION SELECT — only owner can change the org */}
              {isOwner && (
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 shadow-sm mb-6">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 px-1 flex items-center gap-2">
                    <Building2 size={18} className="text-blue-500" />
                    Tổ chức
                  </h3>
                  <Form.Item
                    name="org_id"
                    label={<span className="text-slate-600 font-medium">Tổ chức quản lý</span>}
                    className="mb-0"
                  >
                    <Select
                      placeholder="Chọn tổ chức..."
                      loading={orgsLoading}
                      options={orgOptions}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      className="h-11 rounded-xl"
                      size="large"
                      notFoundContent={<span className="text-slate-400 text-sm">Không có tổ chức nào</span>}
                    />
                  </Form.Item>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4 px-1">Thông tin chung</h3>

                <Form.Item
                  name="name"
                  label={<span className="text-slate-600 font-medium">Tên nhà trọ <span className="text-red-500">*</span></span>}
                  rules={[{ required: true, message: "Vui lòng nhập tên nhà trọ!" }]}
                >
                  <Input
                    prefix={<Home size={16} className="text-slate-400 mr-2" />}
                    placeholder="Ví dụ: Căn hộ Dịch vụ Aurora"
                    className="rounded-xl h-11 border-slate-200 hover:border-blue-400 focus:border-blue-500"
                  />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="code"
                    label={<span className="text-slate-600 font-medium">Mã nhà trọ <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng nhập mã nhà trọ!" }]}
                  >
                    <Input
                      prefix={<Hash size={16} className="text-slate-400 mr-2" />}
                      placeholder="AURORA_01"
                      className="rounded-xl h-11 border-slate-200 uppercase"
                    />
                  </Form.Item>

                  <Form.Item
                    name="area"
                    label={<span className="text-slate-600 font-medium">Tổng diện tích (m²)</span>}
                    rules={[{ pattern: /^\d+(\.\d{1,2})?$/, message: "Vui lòng nhập số hợp lệ!" }]}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ví dụ: 200.5"
                      className="rounded-xl h-11 border-slate-200"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="address"
                  label={<span className="text-slate-600 font-medium">Địa chỉ</span>}
                >
                  <Input
                    prefix={<MapPin size={16} className="text-slate-400 mr-2" />}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    className="rounded-xl h-11 border-slate-200"
                  />
                </Form.Item>

                <Form.Item
                  name="note"
                  label={<span className="text-slate-600 font-medium">Ghi chú</span>}
                  className="mb-0"
                >
                  <Input.TextArea
                    placeholder="Thông tin thêm về nhà trọ..."
                    rows={3}
                    className="rounded-xl border-slate-200 p-3"
                  />
                </Form.Item>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-4 px-1">Cấu hình</h3>
                <Form.Item
                  name="use_floors"
                  valuePropName="checked"
                  className="mb-0 bg-slate-50 p-4 rounded-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium text-slate-700">Sử dụng phân tầng</div>
                      <div className="text-xs text-slate-500 mt-0.5">Quản lý phòng theo từng tầng của tòa nhà</div>
                    </div>
                    <Switch className="bg-slate-300" />
                  </div>
                </Form.Item>
              </div>
            </Form>
          )}
        </div>

        {/* FOOTER ACTIONS */}
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
            disabled={isLoading}
            className="rounded-xl h-10 px-8 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 font-medium"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
