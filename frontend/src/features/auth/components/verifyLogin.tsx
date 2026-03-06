import type { TGlobalProp } from "../../../Types/ReactType";
import { Navigate } from "react-router";
import { message } from "antd";
import { useTokenStore } from "../stores/authStore";
import { useEffect } from "react";

const Authorization = ({
  children,
  allowRole,
  role,
}: TGlobalProp<{ role: string; allowRole: string[] }>) => {
  const token = useTokenStore((state) => state.token);

  const normalizedRole = role?.toLowerCase() ?? "";
  const normalizedAllowRole = allowRole.map((r) => r.toLowerCase());
  const hasAccess = normalizedAllowRole.includes(normalizedRole);

  useEffect(() => {
    if (token && !hasAccess && role) {
      message.error("Bạn ko có quyền vào chức năng này!");
    }
  }, [token, hasAccess, role]);

  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  if (!hasAccess) {
    // Redirect về /auth thay vì "/" để tránh redirect loop
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default Authorization;
