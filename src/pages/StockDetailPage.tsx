import { useParams } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Chart from "@/shared/Components/Chart";
import { useWebSocketStore } from "@/shared/services/websocketService";
import { useEffect } from 'react';

export function StockDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const { isConnected, connect } = useWebSocketStore();

    useEffect(() => {
        connect('ws://localhost:8000/ws', true); // Connect to WebSocket
    }, [connect]);

    useEffect(() => {
        if (isConnected && symbol) {
            useWebSocketStore.getState().sendMessage({ message_type: 'subscribe', channel: symbol });
        }
    }, [isConnected, symbol]);

    if (!symbol) {
        return <div>Invalid stock symbol</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{symbol}</h1>
                    <p className="text-muted-foreground">Real-time market data</p>
                </div>
            </div>

            <div className="h-[600px] w-full">
                <Chart symbol={symbol} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Current Price
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$245.32</div>
                        <p className="text-xs text-muted-foreground">
                            +2.1% from last close
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12.4M</div>
                        <p className="text-xs text-muted-foreground">
                            +18% from average
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Market Cap
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$1.2T</div>
                        <p className="text-xs text-muted-foreground">
                            Updated just now
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Day Range
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$242 - $248</div>
                        <p className="text-xs text-muted-foreground">
                            Low - High
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
