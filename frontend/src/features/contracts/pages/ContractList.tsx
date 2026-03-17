import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, Popconfirm, Tooltip, notification, Select, Space, Badge, Typography } from "antd";
import { Plus, Eye, Edit, Trash2, FileX, Filter, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { getContracts, deleteContract } from "../api/contractApi";
import type { ContractFilters } from "../api/contractApi";
import {
  ContractStatusLabels,
  ContractStatus,
} from "../../../Types/ContractTypes";
import type { Contract, ContractStatus as ContractStatusType } from "../../../Types/ContractTypes";
import { useTokenStore } from "../../auth/stores/authStore";
import { RoleGuard } from "../../../shared/components/RoleGuard";

const { Title, Text } = Typography;

const ContractList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles = useTokenStore((state) => state.roles);
  const canEdit = roles?.some((r) => ["Owner", "Manager"].includes(r));

  const [filters, setFilters] = useState<ContractFilters>({
    include: "room,property,members.user",
    per_page: 15,
    sort: "-created_at",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => getContracts(filters),
  });

  const contracts: Contract[] = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      notification.success({ message: "Xóa hợp đồng thành công" });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: () => {
      notification.error({ message: "Có lỗi xảy ra khi xóa hợp đồng" });
    },
  });

  const handleFilterChange = useCallback((key: keyof ContractFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }, []);

  const statusColors: Record<string, string> = {
    DRAFT: "default",
    ACTIVE: "success",
    EXPIRED: "warning",
    TERMINATED: "error",
  };

  const columns = [
    {
      title: "Phòng / Tòa nhà",
      key: "room",
      render: (_: any, record: Contract) => (
        <div>
          <div className="font-semibold text-slate-800">
            {record.room?.name || "—"}
          </div>
          <div className="text-xs text-slate-400">
            {record.property?.name || "—"}
          </div>
        </div>
      ),
    },
    {
      title: "Người thuê chính",
      key: "tenant",
      render: (_: any, record: Contract) => {
        const primary = record.members?.find((m) => m.is_primary === "1" || (m.is_primary as any) === true || (m.is_primary as any) === 1);
        return primary ? (
          <div>
            <div className="font-medium text-slate-700">{primary.user?.full_name}</div>
            <div className="text-xs text-slate-400">{primary.user?.phone || primary.user?.email}</div>
          </div>
        ) : (
          <span className="text-slate-400 italic text-sm">Chưa có</span>
        );
      },
    },
    {
      title: "Thời hạn",
      key: "dates",
      render: (_: any, record: Contract) => (
        <div className="text-sm">
          <div className="text-slate-600">{record.start_date}</div>
          <div className="text-slate-400">→ {record.end_date}</div>
        </div>
      ),
    },
    {
      title: "Giá thuê",
      dataIndex: "rent_price",
      key: "rent_price",
      render: (price: number) => (
        <span className="font-semibold text-emerald-700">
          {price?.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ContractStatusType) => (
        <Tag color={statusColors[status] || "default"}>
          {ContractStatusLabels[status] ?? status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_: any, record: Contract) => (
        <div className="flex justify-end gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => navigate(`/manage/contracts/detail/${record.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Tooltip title={record.status !== ContractStatus.DRAFT ? "Chỉ có thể sửa bản nháp" : "Chỉnh sửa"}>
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() => navigate(`/manage/contracts/edit/${record.id}`)}
                disabled={record.status !== ContractStatus.DRAFT}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
            <Popconfirm
              title="Xóa hợp đồng?"
              description="Hợp đồng sẽ được chuyển vào thùng rác."
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa">
                <Button 
                  type="text" 
                  danger 
                  icon={<Trash2 size={16} />} 
                  className="text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50"
                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                />
              </Tooltip>
            </Popconfirm>
          </RoleGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={4} className="!mb-0">
            Quản lý hợp đồng
          </Title>
          <Text type="secondary" className="text-sm mt-0.5">
            {meta?.total != null ? `${meta.total} hợp đồng` : "Danh sách hợp đồng thuê phòng"}
          </Text>
        </div>
        <Space>
          <Button
            icon={<FileX size={14} />}
            onClick={() => navigate("/manage/contracts/deleted")}
          >
            Đã xóa
          </Button>
          <Tooltip title="Tải lại">
            <Button icon={<RefreshCw size={14} />} onClick={() => refetch()} />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => navigate("/manage/contracts/create")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-[40px] px-5 shadow-md shadow-blue-500/20 font-medium flex items-center gap-2 border-none"
            >
              Tạo hợp đồng
            </Button>
          </RoleGuard>
        </Space>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter size={14} />
          <span>Lọc:</span>
        </div>
        <Select
          value={filters.status ?? "all"}
          onChange={(v) => handleFilterChange("status", v === "all" ? undefined : v)}
          className="w-44"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.entries(ContractStatusLabels).map(([k, v]) => ({
              value: k,
              label: v,
            })),
          ]}
        />
        <Select
          value={filters.sort ?? "-created_at"}
          onChange={(v) => handleFilterChange("sort", v)}
          className="w-48"
          options={[
            { value: "-created_at", label: "Mới nhất" },
            { value: "created_at", label: "Cũ nhất" },
            { value: "-start_date", label: "Ngày bắt đầu ↓" },
            { value: "start_date", label: "Ngày bắt đầu ↑" },
            { value: "-rent_price", label: "Giá cao" },
            { value: "rent_price", label: "Giá thấp" },
          ]}
        />
        {!canEdit && (
          <Badge status="processing" text={<span className="text-xs text-slate-500">Chế độ xem</span>} />
        )}
      </div>

      <Table
        dataSource={contracts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: filters.per_page ?? 15,
          total: meta?.total,
          current: filters.page ?? 1,
          onChange: (page, pageSize) =>
            setFilters((prev) => ({ ...prev, page, per_page: pageSize })),
          showTotal: (total) => `Tổng ${total} hợp đồng`,
          showSizeChanger: true,
        }}
        scroll={{ x: 800 }}
        size="middle"
        rowClassName="hover:bg-slate-50 transition-colors"
      />
    </div>
  );
};

export default ContractList;
