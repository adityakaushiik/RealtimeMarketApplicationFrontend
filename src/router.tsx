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

// Exchange Holiday Components
import { ExchangeHolidayCreateComponent } from "@/crud_utils/exchange_holiday/ExchangeHolidayCreate";
import { ExchangeHolidayUpdateComponent } from "@/crud_utils/exchange_holiday/ExchangeHolidayUpdate";
import { ExchangeHolidayDeleteComponent } from "@/crud_utils/exchange_holiday/ExchangeHolidayDelete";

// Exchange Components
import { ExchangeCreateComponent } from "@/crud_utils/exchange/ExchangeCreate";
import { ExchangeUpdateComponent } from "@/crud_utils/exchange/ExchangeUpdate";
import { ExchangeDeleteComponent } from "@/crud_utils/exchange/ExchangeDelete";

// Watchlist Components
import { WatchlistPage } from "@/pages/WatchlistPage";
import { WatchlistDetailPage } from "@/pages/WatchlistDetailPage";

const WS_URL = 'ws://15.206.147.192:8000/ws';

// Layout component that includes the Header and Sidebar
const Layout = () => {
    const { connect, isConnected } = useWebSocketStore();

    useEffect(() => {
        if (!isConnected) {
            connect(WS_URL, true);
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
                    // Watchlist routes
                    {
                        path: "/watchlist",
                        element: <WatchlistPage />,
                    },
                    {
                        path: "/watchlist/:id",
                        element: <WatchlistDetailPage />,
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
                    // Exchange Holidays
                    {
                        path: "/config/exchange-holidays/create",
                        element: (
                            <ConfigLayout title="Create Exchange Holiday" description="Add a new holiday for an exchange.">
                                <ExchangeHolidayCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/exchange-holidays/update",
                        element: (
                            <ConfigLayout title="Update Exchange Holiday" description="Modify an existing exchange holiday.">
                                <ExchangeHolidayUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/exchange-holidays/delete",
                        element: (
                            <ConfigLayout title="Delete Exchange Holiday" description="Remove an exchange holiday.">
                                <ExchangeHolidayDeleteComponent />
                            </ConfigLayout>
                        ),
                    },
                    // Exchanges
                    {
                        path: "/config/exchanges/create",
                        element: (
                            <ConfigLayout title="Create Exchange" description="Add a new stock exchange.">
                                <ExchangeCreateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/exchanges/update",
                        element: (
                            <ConfigLayout title="Update Exchange" description="Modify an existing exchange configuration.">
                                <ExchangeUpdateComponent />
                            </ConfigLayout>
                        ),
                    },
                    {
                        path: "/config/exchanges/delete",
                        element: (
                            <ConfigLayout title="Delete Exchange" description="Remove a stock exchange.">
                                <ExchangeDeleteComponent />
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
                ],
            },
        ],
    },
]);
