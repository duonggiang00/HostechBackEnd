import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Spin,
  Tag,
  Progress,
  Divider,
} from "antd";
import {
  Building2,
  Users,
  FileText,
  Receipt,
  TrendingUp,
  TrendingDown,
  TicketCheck,
  Home,
} from "lucide-react";
import dayjs from "dayjs";
import { getDashboard } from "../api/dashboardApi";
import { useTokenStore } from "../../auth/stores/authStore";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// ─────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  suffix,
  icon,
  color = "#3b82f6",
  change,
}: {
  title: string;
  value: number | string;
  suffix?: string;
  icon: React.ReactNode;
  color?: string;
  change?: number;
}) => (
  <Card size="small" className="shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <Text type="secondary" className="text-xs uppercase tracking-wide">
          {title}
        </Text>
        <div className="flex items-end gap-1 mt-1">
          <Statistic
            value={value}
            suffix={suffix}
            styles={{ content: { fontSize: 24, fontWeight: 700, color } }}
          />
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <TrendingUp size={12} className="text-green-500" />
            ) : (
              <TrendingDown size={12} className="text-red-500" />
            )}
            <Text
              className="text-xs"
              style={{ color: change >= 0 ? "#10b981" : "#ef4444" }}
            >
              {change >= 0 ? "+" : ""}
              {change?.toFixed(1)}% so với kỳ trước
            </Text>
          </div>
        )}
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}1a` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  </Card>
);

// ─────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const roles = useTokenStore((state) => state.roles);
  const isOwner = roles?.includes("Owner") ?? false;
  const isManager = roles?.some((r) => ["Manager", "Staff"].includes(r)) ?? false;

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", dateRange],
    queryFn: () => getDashboard({ from: dateRange[0], to: dateRange[1] }),
  });

  const dashRole: string = data?.role ?? "unknown";
  const d = data?.data ?? {};

  if (isLoading) {
    return <Spin size="large" tip="Đang tải dashboard..." fullscreen />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={4} className="!mb-0">
            Dashboard
          </Title>
          <Text type="secondary" className="text-sm">
            Tổng quan hệ thống —{" "}
            <Tag color="blue" className="ml-1">
              {dashRole.toUpperCase()}
            </Tag>
          </Text>
        </div>
        <RangePicker
          defaultValue={[dayjs().startOf("month"), dayjs()]}
          format="DD/MM/YYYY"
          onChange={(_, strings) => {
            if (strings[0] && strings[1]) {
              setDateRange([
                dayjs(strings[0], "DD/MM/YYYY").format("YYYY-MM-DD"),
                dayjs(strings[1], "DD/MM/YYYY").format("YYYY-MM-DD"),
              ]);
            }
          }}
        />
      </div>

      {/* ── Owner / Admin stats ── */}
      {(isOwner || dashRole === "owner" || dashRole === "admin") && (
        <>
          {/* Revenue */}
          {d.revenue && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Doanh thu kỳ hiện tại"
                  value={
                    Number(d.revenue.current_period ?? 0).toLocaleString("vi-VN")
                  }
                  suffix="đ"
                  icon={<Receipt size={22} />}
                  color="#10b981"
                  change={d.revenue.change_percent}
                />
              </Col>
              {d.contracts && (
                <>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Hợp đồng đang hoạt động"
                      value={d.contracts.total_active ?? 0}
                      icon={<FileText size={22} />}
                      color="#3b82f6"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Hợp đồng sắp hết hạn (30 ngày)"
                      value={d.contracts.expiring_in_30_days ?? 0}
                      icon={<FileText size={22} />}
                      color="#f59e0b"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Hợp đồng mới trong kỳ"
                      value={d.contracts.new_in_range ?? 0}
                      icon={<FileText size={22} />}
                      color="#8b5cf6"
                    />
                  </Col>
                </>
              )}
            </Row>
          )}

          {/* Properties + Staff */}
          {(d.properties || d.staff) && (
            <Row gutter={[16, 16]}>
              {d.properties && (
                <>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Tổng số tòa nhà"
                      value={d.properties.total_properties ?? d.properties.total ?? 0}
                      icon={<Building2 size={22} />}
                      color="#0ea5e9"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Phòng đang ở"
                      value={d.properties.occupied_rooms ?? 0}
                      icon={<Home size={22} />}
                      color="#10b981"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Phòng trống"
                      value={d.properties.available_rooms ?? 0}
                      icon={<Home size={22} />}
                      color="#6b7280"
                    />
                  </Col>
                </>
              )}
              {d.staff && (
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Nhân sự vận hành"
                    value={(d.staff.managers ?? 0) + (d.staff.staff ?? 0)}
                    icon={<Users size={22} />}
                    color="#8b5cf6"
                  />
                </Col>
              )}
            </Row>
          )}

          {/* Occupancy progress */}
          {d.properties?.total_rooms && (
            <Card size="small" className="shadow-sm">
              <Text className="font-semibold text-sm">Tỷ lệ lấp đầy</Text>
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <Text type="secondary" className="text-xs">
                    {d.properties.occupied_rooms ?? 0} /{" "}
                    {d.properties.total_rooms ?? 0} phòng
                  </Text>
                  <Text className="text-xs font-medium text-blue-600">
                    {(d.properties.occupancy_rate ?? 0).toFixed(1)}%
                  </Text>
                </div>
                <Progress
                  percent={d.properties.occupancy_rate ?? 0}
                  strokeColor={{
                    "0%": "#3b82f6",
                    "100%": "#10b981",
                  }}
                  showInfo={false}
                />
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Manager / Staff stats ── */}
      {(isManager || dashRole === "manager" || dashRole === "staff") && (
        <>
          <Row gutter={[16, 16]}>
            {d.tenants && (
              <>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Tenant đang ở"
                    value={d.tenants.active ?? 0}
                    icon={<Users size={22} />}
                    color="#3b82f6"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <StatCard
                    title="Tenant mới trong kỳ"
                    value={d.tenants.new_in_range ?? 0}
                    icon={<Users size={22} />}
                    color="#10b981"
                  />
                </Col>
              </>
            )}
            {d.revenue && (
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Doanh thu kỳ hiện tại"
                  value={Number(d.revenue.current_period ?? 0).toLocaleString("vi-VN")}
                  suffix="đ"
                  icon={<Receipt size={22} />}
                  color="#10b981"
                  change={d.revenue.change_percent}
                />
              </Col>
            )}
            {d.tickets && (
              <Col xs={24} sm={12} lg={6}>
                <StatCard
                  title="Phiếu đang xử lý"
                  value={(d.tickets.pending ?? 0) + (d.tickets.in_progress ?? 0)}
                  icon={<TicketCheck size={22} />}
                  color="#f59e0b"
                />
              </Col>
            )}
          </Row>

          {/* Ticket breakdown */}
          {d.tickets && (
            <Card size="small" className="shadow-sm">
              <Text className="font-semibold text-sm">Phân loại phiếu sự cố</Text>
              <Divider className="my-3" />
              <Row gutter={16}>
                <Col span={6} className="text-center">
                  <div className="text-2xl font-bold text-gray-500">
                    {d.tickets.pending ?? 0}
                  </div>
                  <Tag>Chờ xử lý</Tag>
                </Col>
                <Col span={6} className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {d.tickets.in_progress ?? 0}
                  </div>
                  <Tag color="processing">Đang xử lý</Tag>
                </Col>
                <Col span={6} className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {d.tickets.done ?? 0}
                  </div>
                  <Tag color="success">Hoàn thành</Tag>
                </Col>
                <Col span={6} className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {d.tickets.cancelled ?? 0}
                  </div>
                  <Tag color="error">Đã hủy</Tag>
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}

      {/* ── Fallback if no data ── */}
      {!d.revenue && !d.tenants && !d.properties && (
        <Card className="text-center py-12">
          <Text type="secondary">Không có dữ liệu dashboard cho tài khoản này.</Text>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
