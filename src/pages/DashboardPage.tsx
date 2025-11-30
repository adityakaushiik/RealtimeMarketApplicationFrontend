import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, BarChart3, DollarSign, TrendingUp } from "lucide-react";
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb, PriceHistoryDailyInDb } from "@/shared/types/apiTypes";
import { useAppStore } from "@/shared/store/appStore";
import InstrumentPriceDeferred from "@/components/InstrumentPriceDeferred";

export const DashboardPage = () => {
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const { selectedExchange, setPreviousCloseMap } = useAppStore();

    useEffect(() => {
        const fetchInstruments = async () => {
            if (!selectedExchange) return;
            try {
                const data = await ApiService.getInstruments(selectedExchange);
                if (Array.isArray(data)) {
                    setInstruments(data);
                } else if (typeof data === 'object' && data !== null) {
                    setInstruments(Object.values(data));
                }
            } catch (error) {
                console.error("Failed to fetch instruments:", error);
            }
        };
        fetchInstruments();

        const fetchPreviousClose = async () => {
            if (!selectedExchange) return;
            try {
                const data: {
                    exchange: string;
                    data: {
                        instrument: InstrumentInDb;
                        price_history: PriceHistoryDailyInDb;
                    }[]
                } = await ApiService.getPreviousCloseForExchange(selectedExchange);

                const previousCloseData = data.data.reduce((acc, item) => {
                    if (item.price_history.close != null) {
                        acc[item.instrument.symbol] = item.price_history.close;
                    }
                    return acc;
                }, {} as Record<string, number>);

                setPreviousCloseMap(previousCloseData);
            } catch (error) {
                console.error("Failed to fetch previous close:", error);
            }
        };
        fetchPreviousClose();

    }, [selectedExchange, setPreviousCloseMap]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Market overview and real-time statistics for {selectedExchange || 'All Exchanges'}.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Instruments
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{instruments.length}</div>
                        <p className="text-xs text-muted-foreground">
                            In selected exchange
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Volume
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            Real-time volume
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Market Status
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Open</div>
                        <p className="text-xs text-muted-foreground">
                            --
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Value
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">
                            --
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Stocks Table */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Instruments</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {instruments.length > 0 ? (
                                instruments.map((instrument) => (
                                    <TableRow key={instrument.id}>
                                        <TableCell className="font-medium">
                                            {instrument.symbol}
                                        </TableCell>
                                        <TableCell>{instrument.name}</TableCell>
                                        <TableCell>
                                            <InstrumentPriceDeferred
                                                symbol={instrument.symbol}
                                                className="text-sm"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={!instrument.delisted ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                                {!instrument.delisted ? "Active" : "Delisted"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{instrument.instrument_type_id}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No instruments found for this exchange.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
