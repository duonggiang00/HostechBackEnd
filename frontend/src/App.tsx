import { useRoutes, Navigate } from "react-router";
import { useEffect } from "react";
import { useTokenStore } from "./features/auth/stores/authStore";
import LayoutManage from "./Layouts/Manage/LayoutManage";
import Dashboard from "./Pages/Admin/Dashboard";
import Statistical from "./Pages/Admin/Statistical";
import AuthPage from "./features/auth/pages/Login";
import VerifyOTP from "./features/auth/pages/VerifyOTP";
import { AcceptInvite } from "./features/auth/pages/AcceptInvite";
import Notfound from "./Pages/Client/404";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import LayoutAuth from "./Layouts/Auth/LayoutAuth";

// Route registry — tất cả admin feature routes gộp tại đây
import { adminRoutes, portalRoutes } from "./app/routes/registry";
import LayoutPortal from "./Layouts/Portal/LayoutPortal";

/**
 * App.tsx — KHÔNG cần sửa khi thêm feature mới.
 *
 * Để thêm feature mới:
 *   1. Tạo features/xxx/routes.ts
 *   2. Import vào app/routes/registry.ts
 *   Done ✓
 *
 * QUAN TRỌNG: useRoutes() phải được gọi unconditionally (Rules of Hooks).
 * Spinner loading hiển thị bằng cách render null trong route element khi isLoading.
 */
function App() {
  const restoreToken = useTokenStore((state) => state.restoreToken);
  const isLoading = useTokenStore((state) => state.isLoading);

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const roles = useTokenStore((state) => state.roles);

  // useRoutes PHẢI luôn được gọi — không được đặt sau early return
  const router = useRoutes([
    { 
      path: "/", 
      element: roles?.some(r => r.toLowerCase() === "tenant")
        ? <Navigate to="/me" replace />
        : <Navigate to="/manage" replace />

    },
    { 
      path: "/auth", 
      Component: LayoutAuth,
      children: [
        { path: "", Component: AuthPage },
        { path: "login", Component: AuthPage },
        // { path: "register", Component: RegisterPage }, // Thêm sau khi hoàn thiện Register mới
      ]
    },
    { path: "/invite/:token", Component: AcceptInvite },
    { path: "/otp/verify", Component: VerifyOTP },
    {
      path: "manage",
      Component: ProtectedRoute,
      children: [
        {
          path: "",
          Component: LayoutManage,
          children: [
            { path: "", Component: Dashboard },
            { path: "statistical", Component: Statistical },
            ...adminRoutes,
          ],
        }
      ]
    },
    // Backward compatibility: /admin → /manage
    { path: "admin/*", element: <Navigate to="/manage" replace /> },
    {
      path: "me",
      element: (
        <ProtectedRoute allowedRoles={["Tenant"]}>
          <LayoutPortal />
        </ProtectedRoute>
      ),
      children: [
        { path: "", element: <div>Tenant Dashboard (Coming Soon)</div> },
        ...portalRoutes,
      ]
    },
    { path: "*", Component: Notfound },
  ]);

  // Hiển thị spinner sau khi hooks đã được gọi
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return router;
}

export default App;
