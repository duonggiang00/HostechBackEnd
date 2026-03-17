import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Popconfirm, Tag, Tooltip, notification, Input, Select, Badge } from "antd";
import { Edit, Trash2, Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router";
import { getServices, deleteService } from "../api/serviceApi";
import { ServiceCalcModeLabels } from "../types";
import type { Service } from "../types";
import { useTokenStore } from "../../../features/auth/stores/authStore";
import { RoleGuard } from "../../../shared/components/RoleGuard";

const { Option } = Select;

const ServiceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles = useTokenStore((state) => state.roles);
  const canEdit = roles?.some((r) => ["Owner", "Manager"].includes(r));

  // Local filter state
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "1" | "0">("all");
  const [filterCalcMode, setFilterCalcMode] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      notification.success({ message: "Xóa dịch vụ thành công" });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => {
      notification.error({
        message: "Xóa thất bại",
        description: "Có thể dịch vụ đang được sử dụng",
      });
    },
  });

  // Client-side filtering (services list usually small)
  const filtered = services.filter((s: Service) => {
    const matchSearch =
      !searchText ||
      s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchText.toLowerCase());
    const matchActive =
      filterActive === "all" ||
      (filterActive === "1" && s.is_active) ||
      (filterActive === "0" && !s.is_active);
    const matchMode = filterCalcMode === "all" || s.calc_mode === filterCalcMode;
    return matchSearch && matchActive && matchMode;
  });

  const calcModeColors: Record<string, string> = {
    PER_PERSON: "blue",
    PER_ROOM: "geekblue",
    QUANTITY: "purple",
    PER_METER: "orange",
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 100,
      render: (code: string) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
          {code}
        </span>
      ),
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <span className="font-semibold text-slate-800">{text}</span>,
    },
    {
      title: "Cách tính",
      dataIndex: "calc_mode",
      key: "calc_mode",
      render: (mode: keyof typeof ServiceCalcModeLabels) => (
        <Tag color={calcModeColors[mode] || "default"} className="text-xs">
          {ServiceCalcModeLabels[mode] || mode}
        </Tag>
      ),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      render: (unit: string) => <span className="text-slate-500 text-sm">{unit}</span>,
    },
    {
      title: "Đơn giá",
      key: "price",
      render: (_: unknown, record: Service) => {
        const price = record.current_rate?.price ?? record.price ?? 0;
        return (
          <span className="font-medium text-emerald-700">
            {price.toLocaleString("vi-VN")} ₫
          </span>
        );
      },
    },
    {
      title: "Định kỳ",
      dataIndex: "is_recurring",
      key: "is_recurring",
      render: (val: boolean) => (
        <Badge
          status={val ? "processing" : "default"}
          text={<span className="text-xs">{val ? "Hàng tháng" : "Một lần"}</span>}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "Hoạt động" : "Ngưng"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_: unknown, record: Service) => (
        <div className="flex gap-1">
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Tooltip title="Chỉnh sửa">
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => navigate(`/manage/services/editService/${record.id}`)}
                className="border-sky-400 text-sky-600 hover:bg-sky-50"
              />
            </Tooltip>
            <Popconfirm
              title="Bạn có chắc muốn xóa dịch vụ này?"
              description="Thao tác này có thể ảnh hưởng đến các phòng đang sử dụng dịch vụ."
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  loading={deleteMutation.isPending}
                />
              </Tooltip>
            </Popconfirm>
          </RoleGuard>
          {!canEdit && <span className="text-xs text-slate-400 italic">Chỉ xem</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh mục dịch vụ</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý các dịch vụ áp dụng cho phòng trong tổ chức
          </p>
        </div>
        <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate("/manage/services/createService")}
            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
          >
            Thêm dịch vụ
          </Button>
        </RoleGuard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter size={14} />
          <span>Lọc:</span>
        </div>
        <Input
          prefix={<Search size={14} className="text-slate-400" />}
          placeholder="Tìm theo tên, mã..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-52"
          allowClear
        />
        <Select
          value={filterActive}
          onChange={(v) => setFilterActive(v)}
          className="w-36"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "1", label: "Đang hoạt động" },
            { value: "0", label: "Đã ngưng" },
          ]}
        />
        <Select
          value={filterCalcMode}
          onChange={(v) => setFilterCalcMode(v)}
          className="w-48"
        >
          <Option value="all">Tất cả cách tính</Option>
          {Object.entries(ServiceCalcModeLabels).map(([key, label]) => (
            <Option key={key} value={key}>
              {label}
            </Option>
          ))}
        </Select>
        <span className="text-xs text-slate-400 self-center">
          {filtered.length}/{services.length} dịch vụ
        </span>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        scroll={{ x: 700 }}
        size="middle"
        rowClassName="hover:bg-slate-50 transition-colors"
      />
    </div>
  );
};

export default ServiceList;
