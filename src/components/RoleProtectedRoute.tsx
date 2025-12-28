import { Navigate, Outlet } from "react-router-dom";
import { ApiService } from "@/shared/services/apiService";
import AccessDeniedPage from "@/pages/AccessDeniedPage";

interface RoleProtectedRouteProps {
    allowedRoles: number[];
}

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
    const user = ApiService.getCurrentUser();
    const isAuthenticated = ApiService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user && user.role_id && !allowedRoles.includes(user.role_id)) {
        return <AccessDeniedPage />;
    }

    // Handle case where user might be authenticated but has no role_id (if that's possible in your system)
    // Assuming strict role check: if role_id is missing/null but required, deny.
    if (user && !user.role_id) {
        return <AccessDeniedPage />;
    }

    return <Outlet />;
}
