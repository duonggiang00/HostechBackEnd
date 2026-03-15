import axiosClient from "../../../shared/api/axiosClient";

export interface DashboardFilter {
  from?: string;
  to?: string;
}

export const getDashboard = async (filters?: DashboardFilter): Promise<any> => {
  const params: Record<string, string> = {};
  if (filters?.from) params["from"] = filters.from;
  if (filters?.to) params["to"] = filters.to;
  const res = await axiosClient.get("dashboard", { params });
  return res.data;
};

export const getOwnerDashboard = async (filters?: DashboardFilter): Promise<any> => {
  const params: Record<string, string> = {};
  if (filters?.from) params["from"] = filters.from;
  if (filters?.to) params["to"] = filters.to;
  const res = await axiosClient.get("dashboard/owner", { params });
  return res.data;
};

export const getManagerDashboard = async (filters?: DashboardFilter): Promise<any> => {
  const params: Record<string, string> = {};
  if (filters?.from) params["from"] = filters.from;
  if (filters?.to) params["to"] = filters.to;
  const res = await axiosClient.get("dashboard/manager", { params });
  return res.data;
};
