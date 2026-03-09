import type { RouteConfig } from "../../shared/types/navigation";
import { OrgSettings } from "./pages/OrgSettings";
import { OrgManager } from "./pages/OrgManager";
import { OrgFormPage } from "./pages/OrgFormPage";
import { ProtectedRoute } from "../../features/auth/components/ProtectedRoute";

export const orgRoutes: RouteConfig[] = [
    {
        path: "org/settings",
        Component: () => <ProtectedRoute allowedRoles={['Owner']}><OrgSettings /></ProtectedRoute>
    },
    // Admin quản lý các org
    {
        path: "org/manager",
        Component: () => <ProtectedRoute allowedRoles={['Admin']}><OrgManager /></ProtectedRoute>
    },
    {
        path: "org/manager/create",
        Component: () => <ProtectedRoute allowedRoles={['Admin']}><OrgFormPage /></ProtectedRoute>
    },
    {
        path: "org/manager/:id/edit",
        Component: () => <ProtectedRoute allowedRoles={['Admin']}><OrgFormPage /></ProtectedRoute>
    }
];
