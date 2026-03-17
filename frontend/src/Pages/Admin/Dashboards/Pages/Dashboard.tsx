import OwnerDashboard from "./OwnerDashboard";
import StaffDashboard from "./StaffDashboard";
import TenantDashboard from "./TenantDashboard";

type Role = "owner" | "manager" | "staff" | "tenant";

const role: Role = "owner";

const Dashboard = () => {
  if (role === "owner") return <OwnerDashboard />;

  if (role === "manager" || role === "staff") return <StaffDashboard />;

  return <TenantDashboard />;
};

export default Dashboard;
