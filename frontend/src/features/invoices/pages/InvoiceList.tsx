import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Button,
  Tag,
  Popconfirm,
  Tooltip,
  notification,
  Select,
  Space,
  Badge,
  Typography,
} from "antd";
import { Plus, Eye, Edit, Trash2, FileX, Filter, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { getInvoices, deleteInvoice } from "../api/invoiceApi";
import type { InvoiceFilters } from "../api/invoiceApi";
import {
  InvoiceStatusLabels,
  InvoiceStatusColors,
} from "../../../Types/InvoiceTypes";
import type { Invoice, InvoiceStatus } from "../../../Types/InvoiceTypes";
import { useTokenStore } from "../../auth/stores/authStore";
import { RoleGuard } from "../../../shared/components/RoleGuard";

const { Title, Text } = Typography;

const InvoiceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles = useTokenStore((state) => state.roles);
  const canManage = roles?.some((r) => ["Owner", "Manager"].includes(r));

  const [filters, setFilters] = useState<InvoiceFilters>({
    include: "room,property,contract",
    per_page: 15,
    sort: "-created_at",
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["invoices", filters],
    queryFn: () => getInvoices(filters),
  });

  const invoices: Invoice[] = data?.data ?? [];
  const meta = data?.meta;

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      notification.success({ message: "Xóa hóa đơn thành công" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: () => notification.error({ message: "Xóa hóa đơn thất bại" }),
  });

  const handleFilterChange = useCallback((key: keyof InvoiceFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  }, []);

  const columns = [
    {
      title: "Phòng / Tòa nhà",
      key: "room",
      render: (_: any, r: Invoice) => (
        <div>
          <div className="font-semibold text-slate-800">{r.room?.name || "—"}</div>
          <div className="text-xs text-slate-400">{r.property?.name || "—"}</div>
        </div>
      ),
    },
    {
      title: "Kỳ hóa đơn",
      key: "period",
      render: (_: any, r: Invoice) => (
        <div className="text-sm text-slate-600">
          <div>{r.period_start}</div>
          <div className="text-slate-400">→ {r.period_end}</div>
        </div>
      ),
    },
    {
      title: "Ngày phát hành",
      dataIndex: "issue_date",
      key: "issue_date",
      render: (v: string) => <span className="text-sm text-slate-600">{v || "—"}</span>,
    },
    {
      title: "Hạn thanh toán",
      dataIndex: "due_date",
      key: "due_date",
      render: (v: string) => <span className="text-sm text-slate-600">{v || "—"}</span>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v: number) => (
        <span className="font-semibold text-slate-700">
          {v?.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Còn nợ",
      dataIndex: "debt",
      key: "debt",
      render: (v: number) => (
        <span className={`font-semibold ${v > 0 ? "text-red-500" : "text-emerald-600"}`}>
          {v?.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: InvoiceStatus) => (
        <Tag color={InvoiceStatusColors[s]}>{InvoiceStatusLabels[s] ?? s}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_: any, r: Invoice) => (
        <div className="flex justify-end gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => navigate(`/manage/invoices/detail/${r.id}`)}
              className="text-slate-500 hover:text-green-600 bg-slate-50 hover:bg-green-50"
            />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Tooltip title="Chỉnh sửa">
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() => navigate(`/manage/invoices/edit/${r.id}`)}
                className="text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50"
              />
            </Tooltip>
            <Popconfirm
              title="Xóa hóa đơn?"
              description="Hóa đơn sẽ được chuyển vào thùng rác."
              onConfirm={() => deleteMutation.mutate(r.id)}
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
                  loading={deleteMutation.isPending && deleteMutation.variables === r.id}
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
            Quản lý hóa đơn
          </Title>
          <Text type="secondary" className="text-sm mt-0.5">
            {meta?.total != null ? `${meta.total} hóa đơn` : "Danh sách hóa đơn thuê phòng"}
          </Text>
        </div>
        <Space>
          <Button icon={<FileX size={14} />} onClick={() => navigate("/manage/invoices/deleted")}>
            Đã xóa
          </Button>
          <Tooltip title="Tải lại">
            <Button icon={<RefreshCw size={14} />} onClick={() => refetch()} />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => navigate("/manage/invoices/create")}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl h-[40px] px-5 shadow-md shadow-blue-500/20 font-medium flex items-center gap-2 border-none"
            >
              Tạo hóa đơn
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
          className="w-52"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.entries(InvoiceStatusLabels).map(([k, v]) => ({
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
            { value: "-issue_date", label: "Phát hành mới" },
            { value: "due_date", label: "Hạn sớm nhất" },
            { value: "-total_amount", label: "Tổng tiền cao" },
          ]}
        />
        {!canManage && (
          <Badge
            status="processing"
            text={<span className="text-xs text-slate-500">Chế độ xem</span>}
          />
        )}
      </div>

      <Table
        dataSource={invoices}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: filters.per_page ?? 15,
          total: meta?.total,
          current: filters.page ?? 1,
          onChange: (page, pageSize) =>
            setFilters((prev) => ({ ...prev, page, per_page: pageSize })),
          showTotal: (total) => `Tổng ${total} hóa đơn`,
          showSizeChanger: true,
        }}
        scroll={{ x: 900 }}
        size="middle"
        rowClassName="hover:bg-slate-50 transition-colors"
      />
    </div>
  );
};

export default InvoiceList;
