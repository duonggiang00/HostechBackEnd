import ActivityFeed from "../Components/ActivityFeed";
import NotificationPanel from "../Components/NotificationPanel";
import OccupancyChart from "../Components/OccupancyChart";
import StatCard from "../Components/StatCard";
import TaskBoard from "../Components/TaskBoard";

const StaffDashboard = () => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Dashboard quản lý
        </h1>
        <p className="text-gray-500 text-sm">
          Theo dõi vận hành phòng và công việc hàng ngày
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Phòng đang thuê" value="96" />
        <StatCard title="Phòng trống" value="32" />
        <StatCard title="Yêu cầu sửa chữa" value="14" />
        <StatCard title="Hóa đơn" value="120" />
      </div>

      {/* Charts + Notification */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <OccupancyChart />
        </div>

        <NotificationPanel />
      </div>

      {/* Tasks + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TaskBoard />
        <ActivityFeed />
      </div>
    </div>
  );
};

export default StaffDashboard;
