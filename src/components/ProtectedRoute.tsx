import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ApiService } from "@/shared/services/apiService";
import { UserStatus } from "@/shared/utils/CommonConstants";

export function ProtectedRoute() {
    const isAuthenticated = ApiService.isAuthenticated();
    const user = ApiService.getCurrentUser();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user is active using the new status field (UserStatus.ACTIVE)
    // If status is undefined (legacy), check is_active.
    // If user exists but is not active (status != UserStatus.ACTIVE), redirect to inactive page.
    if (user) {
        const isActive = user.status === UserStatus.ACTIVE || (user.status === undefined && user.is_active);

        if (!isActive) {
            if (location.pathname !== "/inactive") {
                return <Navigate to="/inactive" replace />;
            }
        } else {
            // User is active, but trying to access /inactive
            if (location.pathname === "/inactive") {
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <Outlet />;
}
