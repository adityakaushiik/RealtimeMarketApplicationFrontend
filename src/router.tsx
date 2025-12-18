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
import { ConfigLayout } from "./components/ConfigLayout";

// CRUD Components
import { InstrumentCreateComponent } from '@/crud_utils/instrument/InstrumentCreate';
import { InstrumentUpdateComponent } from '@/crud_utils/instrument/InstrumentUpdate';
import { InstrumentDeleteComponent } from '@/crud_utils/instrument/InstrumentDelete';
import { ProviderCreateComponent } from '@/crud_utils/provider/ProviderCreate';
import { ProviderUpdateComponent } from '@/crud_utils/provider/ProviderUpdate';
import { ProviderDeleteComponent } from '@/crud_utils/provider/ProviderDelete';
import { SectorCreateComponent } from '@/crud_utils/sector/SectorCreate';
import { SectorUpdateComponent } from '@/crud_utils/sector/SectorUpdate';
import { SectorDeleteComponent } from '@/crud_utils/sector/SectorDelete';
import { InstrumentTypeCreateComponent } from '@/crud_utils/instrument_type/InstrumentTypeCreate';
import { InstrumentTypeUpdateComponent } from '@/crud_utils/instrument_type/InstrumentTypeUpdate';
import { InstrumentTypeDeleteComponent } from '@/crud_utils/instrument_type/InstrumentTypeDelete';

// Basic Placeholder for new routes
const Placeholder = ({ title }: { title: string }) => (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">This feature is coming soon.</p>
    </div>
);

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
                        element: <ConfigPage />, // Optional: keep as landing or remove
                    },
                    // Instruments
                    {
                        path: "/config/instruments/create",
                        element: (
                            <ConfigLayout title="Create Instrument" description="Add a new trading instrument to the system.">
                                <InstrumentCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/instruments/update",
                        element: (
                            <ConfigLayout title="Update Instrument" description="Modify an existing trading instrument.">
                                <InstrumentUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/instruments/delete",
                        element: (
                            <ConfigLayout title="Delete Instrument" description="Remove a trading instrument from the system.">
                                <InstrumentDeleteComponent />
                            </ConfigLayout>
                        ),
                    },
                    // Providers
                    {
                        path: "/config/providers/create",
                        element: (
                            <ConfigLayout title="Create Provider" description="Add a new market data provider.">
                                <ProviderCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/providers/update",
                        element: (
                            <ConfigLayout title="Update Provider" description="Modify an existing provider configuration.">
                                <ProviderUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/providers/delete",
                        element: (
                            <ConfigLayout title="Delete Provider" description="Remove a provider configuration.">
                                <ProviderDeleteComponent />
                            </ConfigLayout>
                        ),
                    },
                    // Sectors
                    {
                        path: "/config/sectors/create",
                        element: (
                            <ConfigLayout title="Create Sector" description="Define a new market sector.">
                                <SectorCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/sectors/update",
                        element: (
                            <ConfigLayout title="Update Sector" description="Modify an existing market sector.">
                                <SectorUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/sectors/delete",
                        element: (
                            <ConfigLayout title="Delete Sector" description="Remove a market sector.">
                                <SectorDeleteComponent />
                            </ConfigLayout>
                        ),
                    },
                    // Instrument Types
                    {
                        path: "/config/instrument-types/create",
                        element: (
                            <ConfigLayout title="Create Instrument Type" description="Define a new type of instrument.">
                                <InstrumentTypeCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/instrument-types/update",
                        element: (
                            <ConfigLayout title="Update Instrument Type" description="Modify an existing instrument type.">
                                <InstrumentTypeUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/instrument-types/delete",
                        element: (
                            <ConfigLayout title="Delete Instrument Type" description="Remove an instrument type.">
                                <InstrumentTypeDeleteComponent />
                            </ConfigLayout>
                        ),
                    },
                    // {
                    //     path: "/market/overview",
                    //     element: <Placeholder title="Market Overview" />,
                    // },
                    // {
                    //     path: "/analysis/reports",
                    //     element: <Placeholder title="Reports" />,
                    // },
                    // {
                    //     path: "/analysis/trends",
                    //     element: <Placeholder title="Trends" />,
                    // },
                ],
            },
        ],
    },
]);
