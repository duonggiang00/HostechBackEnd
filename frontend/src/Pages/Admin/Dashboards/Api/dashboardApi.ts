import axiosClient from "../../../../shared/api";

export const getOwnerStats = async () => {
  const res = await axiosClient.get("dashboard/owner");
  return res.data?.data ?? res.data;
};

export const getStaffStats = async () => {
  const res = await axiosClient.get("dashboard/staff");
  return res.data?.data ?? res.data;
};

export const getTenantStats = async () => {
  const res = await axiosClient.get("dashboard/tenant");
  return res.data?.data ?? res.data;
};
