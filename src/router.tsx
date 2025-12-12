import { createBrowserRouter, Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { StockSearchPage } from "./pages/StockSearchPage";
import { StockDetailPage } from "./pages/StockDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ConfigPage } from "./pages/ConfigPage";
import LoginPage from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";

import { useEffect } from "react";
import { useWebSocketStore } from "@/shared/services/websocketService";

// Layout component that includes the Header and Sidebar
const Layout = () => {
    const { connect, isConnected } = useWebSocketStore();

    useEffect(() => {
        if (!isConnected) {
            connect('ws://localhost:8000/ws', true);
        }
    }, [connect, isConnected]);

    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset>
                <Header />
                <main className="flex-1 p-4">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                path: "/",
                element: <Layout />,
                children: [
                    {
                        path: "/",
                        element: <DashboardPage />,
                    },
                    {
                        path: "/dashboard",
                        element: <DashboardPage />,
                    },
                    {
                        path: "/stocks",
                        element: <StockSearchPage />,
                    },
                    {
                        path: "/stocks/:symbol",
                        element: <StockDetailPage />,
                    },
                    {
                        path: "/config",
                        element: <ConfigPage />,
                    },
                ],
            },
        ],
    },
]);
