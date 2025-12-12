import { useParams } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Chart from "@/components/Chart";
import { useWebSocketStore } from "@/shared/services/websocketService";
import { useEffect, useState } from 'react';
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb } from "@/shared/types/apiTypes";

export function StockDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const { isConnected } = useWebSocketStore();
    const [instrument, setInstrument] = useState<InstrumentInDb | null>(null);

    useEffect(() => {
        if (isConnected && symbol) {
            useWebSocketStore.getState().sendMessage({ message_type: 1, channel: symbol });
        }
    }, [isConnected, symbol]);

    useEffect(() => {
        const fetchInstrumentDetails = async () => {
            if (!symbol) return;
            try {
                // Since we don't have an endpoint to get instrument by symbol directly without exchange,
                // we'll fetch all and find it. This is not ideal for large datasets but works for now.
                const instruments = await ApiService.getAllInstruments();
                let found: InstrumentInDb | undefined;

                if (Array.isArray(instruments)) {
                    found = instruments.find(i => i.symbol === symbol);
                } else if (typeof instruments === 'object' && instruments !== null) {
                    found = Object.values(instruments).find((i: any) => i.symbol === symbol) as InstrumentInDb;
                }

                if (found) {
                    setInstrument(found);
                }
            } catch (error) {
                console.error("Failed to fetch instrument details:", error);
            }
        };
        fetchInstrumentDetails();
    }, [symbol]);

    if (!symbol) {
        return <div>Invalid stock symbol</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{symbol}</h1>
                    <p className="text-muted-foreground">
                        {instrument ? instrument.name : "Real-time market data"}
                    </p>
                </div>
            </div>

            <div className="h-[600px] w-full">
                <Chart symbol={symbol} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {instrument ? (instrument.delisted ? "Delisted" : "Active") : "--"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {instrument ? (instrument.blacklisted ? "Blacklisted" : "Tradable") : ""}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Type ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{instrument?.instrument_type_id || "--"}</div>
                        <p className="text-xs text-muted-foreground">
                            Instrument Type
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Exchange ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{instrument?.exchange_id || "--"}</div>
                        <p className="text-xs text-muted-foreground">
                            Exchange
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Sector ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{instrument?.sector_id || "--"}</div>
                        <p className="text-xs text-muted-foreground">
                            Sector
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
