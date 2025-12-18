import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb, PriceHistoryDailyInDb } from "@/shared/types/apiTypes";
import { useAppStore } from "@/shared/store/appStore";
import InstrumentPriceDeferred from "@/components/InstrumentPriceDeferred";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const DashboardPage = () => {
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const { selectedExchange, setPreviousCloseMap } = useAppStore();
    const navigate = useNavigate();

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
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {selectedExchange || 'All Exchanges'} &bull; {instruments.length} Active Instruments
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {instruments.length > 0 ? (
                    instruments.map((instrument) => (
                        <div
                            key={instrument.id}
                            onClick={() => navigate(`/stocks/${instrument.symbol}`)}
                            className="group relative flex items-center justify-between p-4 bg-card hover:bg-accent/50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                        >
                            {/* Status Indicator Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${!instrument.delisted ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-red-500'} opacity-80`} />

                            <div className="flex items-center gap-4 pl-3">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                            {instrument.symbol}
                                        </span>
                                        {instrument.delisted && (
                                            <Badge variant="destructive" className="text-[10px] py-0 h-4">Delisted</Badge>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[200px] md:max-w-[300px]">
                                        {instrument.name}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 md:gap-10">
                                <div className="hidden md:flex flex-col items-end min-w-[80px]">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Type</span>
                                    <span className="text-sm font-medium">{instrument.instrument_type_id}</span>
                                </div>

                                <div className="flex flex-col items-end min-w-[100px]">
                                    <InstrumentPriceDeferred
                                        symbol={instrument.symbol}
                                        className="text-lg font-mono font-bold"
                                    />
                                </div>

                                <div className="pr-2 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="text-lg font-semibold text-muted-foreground">No instruments found</div>
                        <p className="text-sm text-muted-foreground/80">Try selecting a different exchange or check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
