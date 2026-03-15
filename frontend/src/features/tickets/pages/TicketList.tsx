import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Tag,
  Button,
  Select,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Card,
  Row,
  Col,
  Badge,
  Typography,
  Space,
  Tooltip,
  Dropdown,
} from "antd";
import type { MenuProps } from "antd";
import {
  Plus,
  MoreVertical,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { getTickets, createTicket, updateTicketStatus, deleteTicket } from "../api/ticketApi";
import {
  TicketStatusLabels,
  TicketStatusColors,
  TicketTypeLabels,
  TicketPriorityLabels,
  TicketPriorityColors,
} from "../types";
import type { Ticket, TicketStatus, TicketFilters } from "../types";
import { useTokenStore } from "../../auth/stores/authStore";
import { RequireRole } from "../../../shared/components/RequireRole";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ── Status column icons ────────────────────────────────────────

const StatusIcons: Record<TicketStatus, React.ReactNode> = {
  OPEN: <AlertCircle size={14} className="inline mr-1 text-gray-500" />,
  IN_PROGRESS: <Clock size={14} className="inline mr-1 text-blue-500" />,
  RESOLVED: <CheckCircle2 size={14} className="inline mr-1 text-green-500" />,
  CLOSED: <CheckCircle2 size={14} className="inline mr-1 text-gray-400" />,
  CANCELLED: <XCircle size={14} className="inline mr-1 text-red-500" />,
};

const KANBAN_COLUMNS: { key: TicketStatus; label: string; color: string }[] = [
  { key: "OPEN", label: "Mở", color: "#6b7280" },
  { key: "IN_PROGRESS", label: "Đang xử lý", color: "#3b82f6" },
  { key: "RESOLVED", label: "Đã giải quyết", color: "#10b981" },
  { key: "CLOSED", label: "Đóng", color: "#9ca3af" },
];

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const TicketList = () => {
  const queryClient = useQueryClient();
  const roles = useTokenStore((state) => state.roles);
  const isTenant = roles?.includes("Tenant") ?? false;
  const isManager = roles?.some((r) => ["Owner", "Manager"].includes(r)) ?? false;
  const canChangeStatus = roles?.some((r) =>
    ["Owner", "Manager", "Staff"].includes(r)
  ) ?? false;

  // View: 'board' for manager/staff, 'list' for all
  const [view, setView] = useState<"board" | "list">(isTenant ? "list" : "board");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterPriority, setFilterPriority] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Ticket | null>(null);
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();

  const filters: TicketFilters = {
    status: filterStatus as TicketStatus | undefined,
    type: filterType as any,
    priority: filterPriority as any,
    sort: "-created_at",
    page,
    per_page: 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => getTickets(filters),
  });

  const tickets = data?.data ?? [];
  const total = data?.meta?.total ?? tickets.length;

  // ── Mutations ────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      message.success("Đã tạo phiếu sự cố!");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setDrawerOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Tạo phiếu thất bại"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      updateTicketStatus(id, status, note),
    onSuccess: () => {
      message.success("Đã cập nhật trạng thái!");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setStatusModalOpen(false);
      setStatusTarget(null);
      statusForm.resetFields();
    },
    onError: () => message.error("Cập nhật thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      message.success("Đã xóa phiếu!");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => message.error("Xóa thất bại"),
  });

  // ── Helpers ───────────────────────────────────────────────

  const openStatusModal = (ticket: Ticket) => {
    setStatusTarget(ticket);
    statusForm.setFieldValue("status", ticket.status);
    setStatusModalOpen(true);
  };

  const getTicketActions = (ticket: Ticket): MenuProps["items"] => {
    const items: MenuProps["items"] = [];
    if (canChangeStatus) {
      items.push({
        key: "status",
        label: "Đổi trạng thái",
        onClick: () => openStatusModal(ticket),
      });
    }
    if (isManager) {
      items.push({
        key: "delete",
        label: <span className="text-red-500">Xóa phiếu</span>,
        onClick: () =>
          Modal.confirm({
            title: "Xóa phiếu sự cố?",
            content: `Bạn sắp xóa "${ticket.title}"`,
            okText: "Xóa",
            cancelText: "Hủy",
            okButtonProps: { danger: true },
            onOk: () => deleteMutation.mutate(ticket.id),
          }),
      });
    }
    return items;
  };

  // ── Table columns ─────────────────────────────────────────

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: Ticket) => (
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          {record.description && (
            <div className="text-xs text-gray-400 truncate max-w-xs">
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 130,
      render: (type: string) => (
        <Tag>{TicketTypeLabels[type as keyof typeof TicketTypeLabels] ?? type}</Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority: string) => (
        <Tag
          color={
            TicketPriorityColors[priority as keyof typeof TicketPriorityColors] ?? "default"
          }
        >
          {TicketPriorityLabels[priority as keyof typeof TicketPriorityLabels] ?? priority}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: TicketStatus) => (
        <Tag color={TicketStatusColors[status]}>
          {StatusIcons[status]}
          {TicketStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Phòng",
      key: "room",
      width: 120,
      render: (_: any, record: Ticket) =>
        record.room?.name ? (
          <Text type="secondary" className="text-xs">
            {record.room.name}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (date: string) => (
        <Text type="secondary" className="text-xs">
          {new Date(date).toLocaleDateString("vi-VN")}
        </Text>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: any, record: Ticket) => {
        const items = getTicketActions(record);
        if (!items || items.length === 0) return null;
        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" size="small" icon={<MoreVertical size={16} />} />
          </Dropdown>
        );
      },
    },
  ];

  // ── Kanban Board ──────────────────────────────────────────

  const KanbanBoard = () => (
    <Row gutter={12}>
      {KANBAN_COLUMNS.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.key);
        return (
          <Col key={col.key} span={6}>
            <Card
              size="small"
              title={
                <Space>
                  <Badge count={colTickets.length} color={col.color} />
                  <span style={{ color: col.color, fontWeight: 600 }}>
                    {col.label}
                  </span>
                </Space>
              }
              style={{ background: "#f9fafb", minHeight: 400 }}
            >
              {colTickets.length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  Không có phiếu
                </div>
              )}
              {colTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  size="small"
                  className="mb-2 shadow-sm hover:shadow-md transition-shadow"
                  style={{ background: "#fff", borderRadius: 8 }}
                >
                  <div className="font-medium text-sm text-gray-800 mb-1">
                    {ticket.title}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Tag
                      color={
                        TicketPriorityColors[ticket.priority]
                      }
                      style={{ fontSize: 10 }}
                    >
                      {TicketPriorityLabels[ticket.priority]}
                    </Tag>
                    <Tag style={{ fontSize: 10 }}>
                      {TicketTypeLabels[ticket.type]}
                    </Tag>
                  </div>
                  {ticket.room?.name && (
                    <div className="text-xs text-gray-400 mt-1">
                      📍 {ticket.room.name}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <Text className="text-xs text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString("vi-VN")}
                    </Text>
                    {canChangeStatus && (
                      <Tooltip title="Đổi trạng thái">
                        <Button
                          size="small"
                          type="text"
                          icon={<MoreVertical size={12} />}
                          onClick={() => openStatusModal(ticket)}
                        />
                      </Tooltip>
                    )}
                  </div>
                </Card>
              ))}
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-0">
            Phiếu sự cố
          </Title>
          <Text type="secondary" className="text-sm">
            Quản lý yêu cầu sửa chữa và khiếu nại
          </Text>
        </div>
        <Space>
          {!isTenant && (
            <Button
              type={view === "board" ? "primary" : "default"}
              ghost={view === "board"}
              size="small"
              onClick={() => setView(view === "board" ? "list" : "board")}
            >
              {view === "board" ? "Dạng danh sách" : "Dạng bảng"}
            </Button>
          )}
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setDrawerOpen(true)}
          >
            Tạo phiếu
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card size="small">
        <Space wrap>
          <Filter size={14} className="text-gray-400" />
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 150 }}
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
          >
            {Object.entries(TicketStatusLabels).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          <Select
            placeholder="Loại sự cố"
            allowClear
            style={{ width: 150 }}
            value={filterType}
            onChange={(v) => { setFilterType(v); setPage(1); }}
          >
            {Object.entries(TicketTypeLabels).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          <Select
            placeholder="Ưu tiên"
            allowClear
            style={{ width: 140 }}
            value={filterPriority}
            onChange={(v) => { setFilterPriority(v); setPage(1); }}
          >
            {Object.entries(TicketPriorityLabels).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Main View */}
      {view === "board" && !isTenant ? (
        <KanbanBoard />
      ) : (
        <Card size="small" className="shadow-sm">
          <Table
            dataSource={tickets}
            columns={columns}
            loading={isLoading}
            rowKey="id"
            size="small"
            pagination={{
              current: page,
              total,
              pageSize: 20,
              onChange: setPage,
              showTotal: (t) => `Tổng ${t} phiếu`,
            }}
          />
        </Card>
      )}

      {/* Create Ticket Drawer */}
      <Drawer
        title="Tạo phiếu sự cố mới"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); form.resetFields(); }}
        width={480}
        footer={
          <div className="text-right">
            <Button onClick={() => setDrawerOpen(false)} className="mr-2">
              Hủy
            </Button>
            <Button
              type="primary"
              loading={createMutation.isPending}
              onClick={() =>
                form
                  .validateFields()
                  .then((values) => createMutation.mutate(values))
              }
            >
              Tạo phiếu
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, min: 5, message: "Tiêu đề ít nhất 5 ký tự" }]}
          >
            <Input placeholder="VD: Hỏng vòi nước phòng tắm..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết">
            <TextArea rows={4} placeholder="Mô tả chi tiết vấn đề..." />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại sự cố"
            rules={[{ required: true, message: "Chọn loại sự cố" }]}
          >
            <Select placeholder="Chọn loại">
              {Object.entries(TicketTypeLabels).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Mức độ ưu tiên" initialValue="normal">
            <Select>
              {Object.entries(TicketPriorityLabels).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Status Update Modal */}
      <RequireRole allowedRoles={["Owner", "Manager", "Staff"]}>
        <Modal
          title={`Đổi trạng thái: "${statusTarget?.title}"`}
          open={statusModalOpen}
          onCancel={() => { setStatusModalOpen(false); statusForm.resetFields(); }}
          onOk={() =>
            statusForm.validateFields().then((values) =>
              statusMutation.mutate({
                id: statusTarget!.id,
                status: values.status,
                note: values.note,
              })
            )
          }
          okText="Cập nhật"
          cancelText="Hủy"
          confirmLoading={statusMutation.isPending}
        >
          <Form form={statusForm} layout="vertical">
            <Form.Item
              name="status"
              label="Trạng thái mới"
              rules={[{ required: true }]}
            >
              <Select>
                {Object.entries(TicketStatusLabels).map(([k, v]) => (
                  <Option key={k} value={k}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="note" label="Ghi chú (tùy chọn)">
              <TextArea rows={2} placeholder="Mô tả cập nhật..." />
            </Form.Item>
          </Form>
        </Modal>
      </RequireRole>
    </div>
  );
};

export default TicketList;
