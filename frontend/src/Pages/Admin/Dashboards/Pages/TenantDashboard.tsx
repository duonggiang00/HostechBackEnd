import ActivityFeed from "../Components/ActivityFeed";
import CalendarWidget from "../Components/CalendarWidget";
import NotificationPanel from "../Components/NotificationPanel";
import StatCard from "../Components/StatCard";

const TenantDashboard = () => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Dashboard của tôi
        </h1>
        <p className="text-gray-500 text-sm">
          Thông tin phòng và thanh toán của bạn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Phòng" value="A203" />
        <StatCard title="Tiền phòng" value="3.500.000đ" />
        <StatCard title="Hợp đồng" value="Còn hiệu lực" />
        <StatCard title="Yêu cầu" value="1" />
      </div>

      {/* Notification + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <NotificationPanel />
        <ActivityFeed />
      </div>

      {/* Calendar */}
      <CalendarWidget />
    </div>
  );
};

export default TenantDashboard;
