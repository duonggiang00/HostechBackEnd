import StatCard from "../Components/StatCard";
import RevenueChart from "../Components/RevenueChart";
import CalendarWidget from "../Components/CalendarWidget";
import OccupancyChart from "../Components/OccupancyChart";
import ActivityFeed from "../Components/ActivityFeed";

const OwnerDashboard = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Owner</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Doanh thu" value="$24.300" growth="+12%" />
        <StatCard title="Tòa nhà" value="4" />
        <StatCard title="Phòng" value="128" />
        <StatCard title="Người thuê" value="96" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ActivityFeed />
      </div>

      {/* Extra */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OccupancyChart />
        <CalendarWidget />
      </div>
    </div>
  );
};

export default OwnerDashboard;
