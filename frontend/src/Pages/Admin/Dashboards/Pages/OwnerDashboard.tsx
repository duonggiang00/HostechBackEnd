import ActivityFeed from "../Components/ActivityFeed";
import CalendarWidget from "../Components/CalendarWidget";
import NotificationPanel from "../Components/NotificationPanel";
import OccupancyChart from "../Components/OccupancyChart";
import RevenueChart from "../Components/RevenueChart";
import StatCard from "../Components/StatCard";


const OwnerDashboard = () => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Dashboard hệ thống
        </h1>
        <p className="text-gray-500 text-sm">
          Tổng quan doanh thu và hoạt động toàn hệ thống
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Doanh thu" value="240.000.000đ" change="+12%" />
        <StatCard title="Tòa nhà" value="4" />
        <StatCard title="Phòng" value="128" />
        <StatCard title="Người thuê" value="96" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>

        <NotificationPanel />
      </div>

      {/* More widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <OccupancyChart />
        <ActivityFeed />
        <CalendarWidget />
      </div>
    </div>
  );
};

export default OwnerDashboard;