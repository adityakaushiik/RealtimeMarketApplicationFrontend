import { createBrowserRouter, Outlet } from "react-router-dom";
import { Header } from "./shared/Components/Header";
import { StockSearchPage } from "./pages/StockSearchPage";
import { StockDetailPage } from "./pages/StockDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SectorsPage } from "./pages/SectorsPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { ConfigPage } from "./pages/ConfigPage";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./shared/Components/AppSidebar";

// Layout component that includes the Header and Sidebar
const Layout = () => {
    return (
        <SidebarProvider>
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
                path: "/sectors",
                element: <SectorsPage />,
            },
            {
                path: "/providers",
                element: <ProvidersPage />,
            },
            {
                path: "/config",
                element: <ConfigPage />,
            },
        ],
    },
]);
