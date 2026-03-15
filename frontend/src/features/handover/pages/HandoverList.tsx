import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Tag,
  Button,
  Card,
  Typography,
  Space,
  Modal,
  message,
  Form,
  Input,
  Select,
  Dropdown,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import { Plus, MoreVertical, ClipboardCheck, Filter } from "lucide-react";
import {
  getHandovers,
  createHandover,
  confirmHandover,
  deleteHandover,
} from "../api/handoverApi";
import { RequireRole } from "../../../shared/components/RequireRole";
import type { Handover, HandoverType, HandoverStatus } from "../types";

const { Title, Text } = Typography;
const { Option } = Select;

// ─────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────

const TypeLabels: Record<HandoverType, string> = {
  CHECK_IN: "Nhận phòng",
  CHECK_OUT: "Trả phòng",
};

const StatusLabels: Record<HandoverStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CANCELLED: "Đã hủy",
};

const StatusColors: Record<HandoverStatus, string> = {
  PENDING: "warning",
  CONFIRMED: "success",
  CANCELLED: "error",
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const HandoverList = () => {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: handovers = [], isLoading } = useQuery<any[]>({
    queryKey: ["handovers"],
    queryFn: () => getHandovers(),
  });

  const filtered = handovers.filter((h) => {
    if (filterStatus && h.status !== filterStatus) return false;
    if (filterType && h.type !== filterType) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: createHandover,
    onSuccess: () => {
      message.success("Đã tạo biên bản bàn giao!");
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
      setDrawerOpen(false);
      form.resetFields();
    },
    onError: () => message.error("Tạo thất bại"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmHandover(id),
    onSuccess: () => {
      message.success("Đã xác nhận bàn giao!");
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
    },
    onError: () => message.error("Xác nhận thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHandover(id),
    onSuccess: () => {
      message.success("Đã xóa biên bản!");
      queryClient.invalidateQueries({ queryKey: ["handovers"] });
    },
  });

  const getActions = (record: any): MenuProps["items"] => [
    {
      key: "confirm",
      label: "Xác nhận bàn giao",
      disabled: record.status === "CONFIRMED",
      onClick: () =>
        Modal.confirm({
          title: "Xác nhận bàn giao?",
          content: `Xác nhận biên bản ${record.id}`,
          okText: "Xác nhận",
          onOk: () => confirmMutation.mutate(record.id),
        }),
    },
    {
      key: "delete",
      label: <span className="text-red-500">Xóa</span>,
      onClick: () =>
        Modal.confirm({
          title: "Xóa biên bản?",
          okButtonProps: { danger: true },
          okText: "Xóa",
          onOk: () => deleteMutation.mutate(record.id),
        }),
    },
  ];

  const columns = [
    {
      title: "Loại bàn giao",
      dataIndex: "type",
      key: "type",
      render: (type: HandoverType) => (
        <Tag color={type === "CHECK_IN" ? "blue" : "purple"}>
          <ClipboardCheck size={12} className="inline mr-1" />
          {TypeLabels[type] ?? type}
        </Tag>
      ),
    },
    {
      title: "Hợp đồng",
      key: "contract",
      render: (_: any, record: any) => (
        <Text className="text-sm">
          {record.contract?.code ?? `#${record.contract_id}`}
        </Text>
      ),
    },
    {
      title: "Phòng",
      key: "room",
      render: (_: any, record: any) => (
        <Text type="secondary" className="text-sm">
          {record.room?.name ?? "—"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: HandoverStatus) => (
        <Tag color={StatusColors[status] ?? "default"}>
          {StatusLabels[status] ?? status}
        </Tag>
      ),
    },
    {
      title: "Ngày bàn giao",
      dataIndex: "handover_date",
      key: "handover_date",
      width: 130,
      render: (date: string) =>
        date ? (
          <Text type="secondary" className="text-xs">
            {new Date(date).toLocaleDateString("vi-VN")}
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
      render: (_: any, record: any) => (
        <RequireRole allowedRoles={["Owner", "Manager", "Staff"]}>
          <Dropdown menu={{ items: getActions(record) }} trigger={["click"]}>
            <Tooltip title="Hành động">
              <Button type="text" size="small" icon={<MoreVertical size={16} />} />
            </Tooltip>
          </Dropdown>
        </RequireRole>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-0">
            Biên bản bàn giao
          </Title>
          <Text type="secondary" className="text-sm">
            Quản lý biên bản nhận/trả phòng
          </Text>
        </div>
        <RequireRole allowedRoles={["Owner", "Manager", "Staff"]}>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setDrawerOpen(true)}
          >
            Tạo biên bản
          </Button>
        </RequireRole>
      </div>

      {/* Filters */}
      <Card size="small">
        <Space wrap>
          <Filter size={14} className="text-gray-400" />
          <Select
            placeholder="Loại bàn giao"
            allowClear
            style={{ width: 150 }}
            value={filterType}
            onChange={setFilterType}
          >
            {Object.entries(TypeLabels).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
          <Select
            placeholder="Trạng thái"
            allowClear
            style={{ width: 160 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            {Object.entries(StatusLabels).map(([k, v]) => (
              <Option key={k} value={k}>{v}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Table */}
      <Card size="small" className="shadow-sm">
        <Table
          dataSource={filtered}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 15, showTotal: (t) => `Tổng ${t} biên bản` }}
          locale={{ emptyText: "Chưa có biên bản bàn giao nào" }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo biên bản bàn giao"
        open={drawerOpen}
        onCancel={() => { setDrawerOpen(false); form.resetFields(); }}
        onOk={() =>
          form.validateFields().then((values) => createMutation.mutate(values))
        }
        okText="Tạo biên bản"
        cancelText="Hủy"
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="contract_id"
            label="Mã hợp đồng"
            rules={[{ required: true, message: "Nhập mã hợp đồng" }]}
          >
            <Input placeholder="ID hợp đồng..." />
          </Form.Item>
          <Form.Item
            name="type"
            label="Loại bàn giao"
            rules={[{ required: true, message: "Chọn loại bàn giao" }]}
          >
            <Select>
              {Object.entries(TypeLabels).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="handover_date" label="Ngày bàn giao">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HandoverList;
