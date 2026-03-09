import { Navigate } from "react-router";
import { message } from "antd";
import { useTokenStore } from "../stores/authStore";
import { useEffect } from "react";

import type { PropsWithChildren } from "react";

const Authorization = ({
  children,
  allowRole,
}: PropsWithChildren<{ allowRole: string[] }>) => {
  const token = useTokenStore((state) => state.token);
  const roles = useTokenStore((state) => state.roles);

  const normalizedAllowRole = allowRole.map((r) => r.toLowerCase());
  const hasAccess = roles.some((r) => normalizedAllowRole.includes(r.toLowerCase()));

  useEffect(() => {
    if (token && !hasAccess && roles.length > 0) {
      message.error("Bạn ko có quyền vào chức năng này!");
    }
  }, [token, hasAccess, roles.length]);

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
