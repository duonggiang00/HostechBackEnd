import React from "react";
import { useTokenStore } from "@/features/auth/stores/authStore";

import OwnerDashboard from "./OwnerDashboard";
import StaffDashboard from "./StaffDashboard";
import TenantDashboard from "./TenantDashboard";

const Dashboard: React.FC = () => {
  const roles = useTokenStore((state) => state.roles);

  const role = roles?.[0]?.toLowerCase();

  if (role === "owner") return <OwnerDashboard />;
  if (role === "manager" || role === "staff") return <StaffDashboard />;
  if (role === "tenant") return <TenantDashboard />;

  return <div className="p-6">Không xác định role</div>;
};

export default Dashboard;
