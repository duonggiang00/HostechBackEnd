import { useState } from "react";
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
  Modal,
  Form,
  Input,
  InputNumber,
} from "antd";
import { Plus, Gauge, Trash2, ClipboardList, RefreshCw, Filter } from "lucide-react";
import { getMeters as _getMeters, deleteMeter, createMeter, getMeterReadings, createMeterReading } from "../api/meterApi";
import { MeterTypeLabels, MeterStatusLabels } from "../types";
import type { Meter, MeterReading } from "../types";
import { RoleGuard } from "../../../shared/components/RoleGuard";

const typeColors: Record<string, string> = {
  electricity: "gold",
  water: "blue",
  gas: "orange",
  other: "default",
};

const MeterList = () => {
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState("-created_at");
  const [page, setPage] = useState(1);

  // Modal: Create Meter
  const [showCreate, setShowCreate] = useState(false);
  const [createForm] = Form.useForm();

  // Modal: Readings (nhập chỉ số)
  const [readingMeterId, setReadingMeterId] = useState<string | null>(null);
  const [readingForm] = Form.useForm();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["meters", filterType, filterStatus, sort, page],
    queryFn: async () => {
      const params: Record<string, any> = { include: "room,property", sort, per_page: 15, page };
      if (filterType) params["filter[meter_type]"] = filterType;
      if (filterStatus !== undefined && filterStatus !== "all") params["filter[status]"] = filterStatus;
      const { default: Api } = await import("../../../Api/Api");
      const res = await Api.get("meters", { params });
      return res.data;
    },
  });

  const meters: Meter[] = data?.data ?? [];
  const meta = data?.meta;

  const { data: readings, isLoading: readingsLoading } = useQuery({
    queryKey: ["meter-readings", readingMeterId],
    queryFn: () => getMeterReadings(readingMeterId!),
    enabled: !!readingMeterId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMeter,
    onSuccess: () => {
      notification.success({ message: "Xóa đồng hồ thành công" });
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    },
    onError: () => notification.error({ message: "Có lỗi xảy ra khi xóa" }),
  });

  const createMutation = useMutation({
    mutationFn: createMeter,
    onSuccess: () => {
      notification.success({ message: "Thêm đồng hồ thành công" });
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      setShowCreate(false);
      createForm.resetFields();
    },
    onError: () => notification.error({ message: "Có lỗi xảy ra khi thêm đồng hồ" }),
  });

  const readingMutation = useMutation({
    mutationFn: ({ meterId, data }: { meterId: string; data: any }) =>
      createMeterReading(meterId, data),
    onSuccess: () => {
      notification.success({ message: "Nhập chỉ số thành công" });
      queryClient.invalidateQueries({ queryKey: ["meter-readings", readingMeterId] });
      readingForm.resetFields();
    },
    onError: () => notification.error({ message: "Có lỗi xảy ra khi nhập chỉ số" }),
  });

  const columns = [
    {
      title: "Tên đồng hồ",
      key: "name",
      render: (_: any, meter: Meter) => (
        <div>
          <div className="font-semibold text-slate-800">{meter.name}</div>
          <div className="text-xs text-slate-400">{meter.meter_number}</div>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "meter_type",
      key: "type",
      render: (t: string) => (
        <Tag color={typeColors[t] ?? "default"}>{MeterTypeLabels[t] ?? t}</Tag>
      ),
    },
    {
      title: "Phòng / Tòa nhà",
      key: "room",
      render: (_: any, meter: Meter) => (
        <div>
          <div className="text-sm text-slate-700">{meter.room?.name || "—"}</div>
          <div className="text-xs text-slate-400">{meter.property?.name || "—"}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: number) => (
        <Tag color={s === 1 ? "success" : "default"}>
          {MeterStatusLabels[s] ?? "—"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 130,
      render: (_: any, meter: Meter) => (
        <Space size={4}>
          <Tooltip title="Xem chỉ số">
            <Button
              size="small"
              icon={<ClipboardList size={14} />}
              onClick={() => setReadingMeterId(meter.id)}
              className="border-emerald-400 text-emerald-600"
            />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Popconfirm
              title="Xóa đồng hồ này?"
              onConfirm={() => deleteMutation.mutate(meter.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Tooltip title="Xóa">
                <Button size="small" danger icon={<Trash2 size={14} />} />
              </Tooltip>
            </Popconfirm>
          </RoleGuard>
        </Space>
      ),
    },
  ];

  const readingColumns = [
    {
      title: "Ngày đọc",
      dataIndex: "reading_date",
      key: "reading_date",
    },
    {
      title: "Chỉ số",
      dataIndex: "reading_value",
      key: "reading_value",
      render: (v: number) => <span className="font-semibold">{v}</span>,
    },
    {
      title: "Mức tiêu thụ",
      dataIndex: "consumption",
      key: "consumption",
      render: (v?: number) => v != null ? <span className="text-emerald-600">{v}</span> : "—",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (v?: string) => v || "—",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Gauge size={20} className="text-emerald-600" />
            Quản lý đồng hồ
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {meta?.total != null ? `${meta.total} đồng hồ` : "Danh sách đồng hồ điện, nước, gas"}
          </p>
        </div>
        <Space>
          <Tooltip title="Tải lại">
            <Button icon={<RefreshCw size={14} />} onClick={() => refetch()} />
          </Tooltip>
          <RoleGuard allowedRoles={["Owner", "Manager"]} fallback={null}>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowCreate(true)}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
            >
              Thêm đồng hồ
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
          value={filterType ?? "all"}
          onChange={(v) => setFilterType(v === "all" ? undefined : v)}
          className="w-40"
          options={[
            { value: "all", label: "Tất cả loại" },
            ...Object.entries(MeterTypeLabels).map(([k, v]) => ({ value: k, label: v })),
          ]}
        />
        <Select
          value={filterStatus ?? "all"}
          onChange={(v) => setFilterStatus(v === "all" ? undefined : v)}
          className="w-48"
          options={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "1", label: "Đang hoạt động" },
            { value: "0", label: "Ngừng hoạt động" },
          ]}
        />
        <Select
          value={sort}
          onChange={setSort}
          className="w-44"
          options={[
            { value: "-created_at", label: "Mới nhất" },
            { value: "created_at", label: "Cũ nhất" },
            { value: "name", label: "Tên A-Z" },
          ]}
        />
      </div>

      <Table
        dataSource={meters}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 15,
          total: meta?.total,
          current: page,
          onChange: (p) => setPage(p),
          showTotal: (total) => `Tổng ${total} đồng hồ`,
        }}
        size="middle"
        rowClassName="hover:bg-slate-50 transition-colors"
      />

      {/* Modal Create Meter */}
      <Modal
        title="Thêm đồng hồ mới"
        open={showCreate}
        onCancel={() => { setShowCreate(false); createForm.resetFields(); }}
        onOk={() => createForm.validateFields().then((vals) => createMutation.mutate(vals))}
        okText="Thêm"
        cancelText="Hủy"
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <Form.Item label="Tên đồng hồ" name="name" rules={[{ required: true, message: "Bắt buộc" }]}>
            <Input placeholder="VD: Điện tầng 1 phòng 101" />
          </Form.Item>
          <Form.Item label="Số đồng hồ" name="meter_number" rules={[{ required: true }]}>
            <Input placeholder="VD: DH-001" />
          </Form.Item>
          <Form.Item label="Loại" name="meter_type" rules={[{ required: true }]}>
            <Select
              options={Object.entries(MeterTypeLabels).map(([k, v]) => ({ value: k, label: v }))}
            />
          </Form.Item>
          <Form.Item label="Phòng (ID)" name="room_id" rules={[{ required: true }]}>
            <Input placeholder="UUID của phòng" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Readings */}
      <Modal
        title="Chỉ số đồng hồ"
        open={!!readingMeterId}
        onCancel={() => setReadingMeterId(null)}
        footer={null}
        width={700}
      >
        <RoleGuard allowedRoles={["Owner", "Manager", "Staff"]} fallback={null}>
          <Form
            form={readingForm}
            layout="inline"
            className="mb-4 flex flex-wrap gap-2"
            onFinish={(vals) => {
              if (readingMeterId) {
                readingMutation.mutate({ meterId: readingMeterId, data: vals });
              }
            }}
          >
            <Form.Item name="reading_value" rules={[{ required: true, message: "Bắt buộc" }]}>
              <InputNumber placeholder="Chỉ số" className="w-36" />
            </Form.Item>
            <Form.Item name="reading_date" rules={[{ required: true }]}>
              <Input type="date" className="w-40" />
            </Form.Item>
            <Form.Item name="note">
              <Input placeholder="Ghi chú" className="w-48" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={readingMutation.isPending}
                className="bg-emerald-600 border-emerald-600"
              >
                Nhập chỉ số
              </Button>
            </Form.Item>
          </Form>
        </RoleGuard>
        <Table
          dataSource={(readings as MeterReading[]) ?? []}
          columns={readingColumns}
          rowKey="id"
          loading={readingsLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default MeterList;
