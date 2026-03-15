import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Tag, Popconfirm, Tooltip, notification, Select, Space, Badge } from "antd";
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
import { RequireRole } from "../../../shared/components/RequireRole";

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
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<Eye size={14} />}
              onClick={() => navigate(`/manage/contracts/detail/${record.id}`)}
              className="border-emerald-400 text-emerald-600"
            />
          </Tooltip>
          <RequireRole allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Tooltip title="Chỉnh sửa">
              <Button
                size="small"
                icon={<Edit size={14} />}
                onClick={() => navigate(`/manage/contracts/edit/${record.id}`)}
                className="border-sky-400 text-sky-600"
                disabled={record.status !== ContractStatus.DRAFT}
              />
            </Tooltip>
            <Popconfirm
              title="Xóa hợp đồng này?"
              description="Hợp đồng sẽ được chuyển vào thùng rác. Tiếp tục?"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button size="small" danger icon={<Trash2 size={14} />} />
              </Tooltip>
            </Popconfirm>
          </RequireRole>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý hợp đồng</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {meta?.total != null ? `${meta.total} hợp đồng` : "Danh sách hợp đồng thuê phòng"}
          </p>
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
          <RequireRole allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => navigate("/manage/contracts/create")}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              Tạo hợp đồng
            </Button>
          </RequireRole>
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
