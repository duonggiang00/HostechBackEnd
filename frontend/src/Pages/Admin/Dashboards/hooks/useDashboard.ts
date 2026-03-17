import { useQuery } from "@tanstack/react-query";
import {
  getOwnerStats,
  getStaffStats,
  getTenantStats,
} from "../Api/dashboardApi";

export const useOwnerDashboard = () => {
  return useQuery({
    queryKey: ["dashboard-owner"],
    queryFn: getOwnerStats,
  });
};

export const useStaffDashboard = () => {
  return useQuery({
    queryKey: ["dashboard-staff"],
    queryFn: getStaffStats,
  });
};

export const useTenantDashboard = () => {
  return useQuery({
    queryKey: ["dashboard-tenant"],
    queryFn: getTenantStats,
  });
};
