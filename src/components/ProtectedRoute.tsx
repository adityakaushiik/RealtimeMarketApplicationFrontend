import { Navigate, Outlet } from "react-router-dom";
import { ApiService } from "@/shared/services/apiService";

export function ProtectedRoute() {
    const isAuthenticated = ApiService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
