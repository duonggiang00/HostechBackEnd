import { useState } from "react";
import { Button, Popconfirm, Skeleton, Tag, Tabs } from "antd";
import type { TabsProps } from "antd";
import { useNavigate, useParams } from "react-router";
import { Edit, Trash2, MapPin, Home, Hash, Calendar, Layers, DoorOpen, Info, Banknote, X } from "lucide-react";
import { useProperty, useDeleteProperty } from "../../hooks/useProperties";
import { usePermission } from "../../../../shared/hooks/usePermission";
import Floors from "../Floors/Floors";
import { useTokenStore } from "../../../auth/stores/authStore";

const DetailProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const { role } = useTokenStore();

  const { data: property, isLoading } = useProperty(id || "");
  console.log("[DEBUG] DetailProperty - property data:", property);

  const deleteMutation = useDeleteProperty();

  const [activeTab, setActiveTab] = useState("overview");

  const handleEdit = () => {
    navigate(`/manage/properties/editProperty/${id}`);
  };

  const handleClose = () => {
    if (role === "Manager" || role === "Staff") {
      navigate("/manage", { replace: true });
    } else {
      navigate("/manage/properties", { replace: true });
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          handleClose();
        }
      });
    }
  };

  const overviewContent = (
    <div className="space-y-6 mx-auto animate-in fade-in duration-500 pt-2">
      {/* OVERVIEW CARD */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-3 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Home size={32} strokeWidth={2} />
            </div>
            <div className="pt-1">
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">{property?.name}</h1>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <Tag color="blue" className="rounded-md border-blue-200 text-blue-600 px-2 py-0.5 text-xs m-0 font-medium">
                  {property?.use_floors ? "CÓ PHÂN TẦNG" : "KHÔNG PHÂN TẦNG"}
                </Tag>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <Hash size={14} />
                  <span className="uppercase">{property?.code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS STAMP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-500 shadow-sm">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-sm font-medium text-indigo-600/70 mb-0.5">Tổng số tầng</div>
            <div className="text-2xl font-bold text-indigo-700 leading-none">{property?.floors_count || property?.floors?.length || 0}</div>
          </div>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
            <DoorOpen size={22} />
          </div>
          <div>
            <div className="text-sm font-medium text-emerald-600/70 mb-0.5">Tổng số phòng</div>
            <div className="text-2xl font-bold text-emerald-700 leading-none">{property?.rooms_count || property?.rooms?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* DETAILS LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        <h3 className="text-base font-semibold text-slate-800 border-b border-gray-100 pb-4">Thông tin chi tiết</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <MapPin size={16} className="text-slate-400" /> Địa chỉ
            </div>
            <div className="text-slate-800 font-medium leading-relaxed">
              {property?.address || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Banknote size={16} className="text-slate-400" /> Thông tin thanh toán
            </div>
            <div className="text-slate-800 font-medium space-y-1 text-sm">
              {property?.default_billing_cycle && <div>• Kỳ Thu: {property.default_billing_cycle} tháng</div>}
              {property?.default_due_day && <div>• Hạn chót: Ngày {property.default_due_day}</div>}
              {property?.default_cutoff_day && <div>• Chốt điện/nước: Ngày {property.default_cutoff_day}</div>}
              {!property?.default_billing_cycle && !property?.default_due_day && !property?.default_cutoff_day && (
                <span className="text-slate-400 italic font-normal">Sử dụng chu kỳ chuẩn</span>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Info size={16} className="text-slate-400" /> Ghi chú
            </div>
            <div className="text-slate-700 bg-slate-50 p-4 rounded-xl text-sm leading-relaxed border border-slate-100">
              {property?.note || <span className="text-slate-400 italic">Không có ghi chú nào</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Calendar size={16} className="text-slate-400" /> Ngày tạo
            </div>
            <div className="text-slate-800 font-medium">
              {property?.created_at ? new Date(property.created_at).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
              <Calendar size={16} className="text-slate-400" /> Cập nhật lần cuối
            </div>
            <div className="text-slate-800 font-medium">
              {property?.updated_at ? new Date(property.updated_at).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: <span className="px-2 font-medium">TỔNG QUAN</span>,
      children: overviewContent,
    },
    {
      key: 'floors',
      label: <span className="px-2 font-medium">QUẢN LÝ TẦNG</span>,
      children: <div className="animate-in fade-in duration-500 pt-2"><Floors propertyId={id} /></div>,
    },
  ];

  return (
    <div className="w-full min-h-full bg-slate-50/50 flex justify-center py-8">
      <div className="w-full max-w-5xl flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[80vh]">

        {/* HEADER */}
        <div className="px-6 py-5 bg-white flex justify-between items-center relative z-10 transition-shadow">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chi tiết nhà trọ</h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading ? "Đang tải dữ liệu..." : <span className="uppercase font-medium text-blue-600">{property?.code} - {property?.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {can("update", "properties") && !isLoading && (
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-blue-50/50"
              >
                Sửa
              </Button>
            )}
            {can("delete", "properties") && !isLoading && (
              <Popconfirm
                title="Xóa nhà"
                description="Bạn có chắc muốn xóa nhà này?"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onConfirm={handleDelete}
              >
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={16} />}
                  loading={deleteMutation.isPending}
                  className="hover:bg-red-50 bg-red-50/50"
                >
                  Xóa
                </Button>
              </Popconfirm>
            )}
            <Button
              type="text"
              icon={<X size={20} className="text-slate-500" />}
              onClick={handleClose}
              className="hover:bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center p-0 ml-2"
            />
          </div>
        </div>

        {/* TABS BODY */}
        <div className="flex-1 bg-slate-50/30">
          {isLoading ? (
            <div className="p-6"><Skeleton active paragraph={{ rows: 12 }} className="bg-white p-6 rounded-2xl border border-gray-100" /></div>
          ) : !property ? (
            <div className="text-center py-20 text-slate-500">Không tìm thấy thông tin nhà trọ</div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              className="custom-tabs px-6"
              size="large"
              tabBarStyle={{ marginBottom: 0, paddingLeft: "16px", paddingRight: "16px", borderBottom: "1px solid #f1f5f9" }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailProperty;
