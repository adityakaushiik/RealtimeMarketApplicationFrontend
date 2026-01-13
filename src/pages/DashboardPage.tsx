import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb, ExchangeInDb, InstrumentTypeInDb, SectorInDb, WatchlistInDb } from "@/shared/types/apiTypes";
import { useAppStore } from "@/shared/store/appStore";
import InstrumentPriceDeferred from "@/components/InstrumentPriceDeferred";
import { MarketStatusIndicator } from "@/components/MarketStatusIndicator";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, ListPlus, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const DashboardPage = () => {
    const [dashboardWatchlists, setDashboardWatchlists] = useState<WatchlistInDb[]>([]);
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const [marketIndices, setMarketIndices] = useState<InstrumentInDb[]>([]);
    const [currentExchange, setCurrentExchange] = useState<ExchangeInDb | null>(null);
    const [instrumentTypes, setInstrumentTypes] = useState<InstrumentTypeInDb[]>([]);
    const [sectors, setSectors] = useState<SectorInDb[]>([]);
    const { selectedExchange } = useAppStore();
    const navigate = useNavigate();
    const [, setTick] = useState(0); // For forcing re-render to update market status
    const [searchQuery, setSearchQuery] = useState("");

    // Update market status every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchDashboardWatchlists = async () => {
            try {
                const data = await ApiService.getDashboardWatchlists();
                setDashboardWatchlists(data);

                // Extract all instruments from watchlists
                const allInstruments: InstrumentInDb[] = [];
                data.forEach(watchlist => {
                    if (watchlist.instruments && watchlist.instruments.length > 0) {
                        allInstruments.push(...watchlist.instruments);
                    } else if (watchlist.items && watchlist.items.length > 0) {
                        // Check if items are actually instruments
                        const firstItem = watchlist.items[0] as unknown as InstrumentInDb;
                        if (firstItem.symbol) {
                            allInstruments.push(...(watchlist.items as unknown as InstrumentInDb[]));
                        } else {
                            // Standard items
                            watchlist.items.forEach(item => {
                                if (item.instrument) allInstruments.push(item.instrument);
                            });
                        }
                    }
                });

                // Remove duplicates based on instrument id
                const uniqueInstruments = allInstruments.filter(
                    (inst, index, self) => index === self.findIndex(i => i.id === inst.id)
                );
                setInstruments(uniqueInstruments);
            } catch (error) {
                console.error("Failed to fetch dashboard watchlists:", error);
            }
        };
        fetchDashboardWatchlists();

        const fetchMarketIndices = async () => {
            if (!selectedExchange) return;
            try {
                // Fetch Market Indices (Type ID 2)
                const indicesData = await ApiService.getInstruments(selectedExchange, 2);
                if (Array.isArray(indicesData)) {
                    setMarketIndices(indicesData);
                } else if (typeof indicesData === 'object' && indicesData !== null) {
                    setMarketIndices(Object.values(indicesData));
                }
            } catch (error) {
                console.error("Failed to fetch market indices:", error);
            }
        };
        fetchMarketIndices();

        const fetchExchange = async () => {
            if (!selectedExchange) {
                setCurrentExchange(null);
                return;
            }
            try {
                const exchanges = await ApiService.getExchanges();
                const exchange = exchanges.find(e => e.code === selectedExchange);
                setCurrentExchange(exchange || null);
            } catch (error) {
                console.error("Failed to fetch exchange:", error);
            }
        };
        fetchExchange();

        const fetchTypesAndSectors = async () => {
            try {
                const [types, sectorsData] = await Promise.all([
                    ApiService.getInstrumentTypes(),
                    ApiService.getSectorList()
                ]);
                setInstrumentTypes(types);
                setSectors(sectorsData);
            } catch (error) {
                console.error("Failed to fetch types and sectors:", error);
            }
        };
        fetchTypesAndSectors();

    }, [selectedExchange]);

    const typeMap = instrumentTypes.reduce((acc, type) => {
        acc[type.id] = type.name;
        return acc;
    }, {} as Record<number, string>);

    const sectorMap = sectors.reduce((acc, sector) => {
        acc[sector.id] = sector.name;
        return acc;
    }, {} as Record<number, string>);

    const filteredInstruments = instruments.filter(instrument =>
        instrument.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instrument.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to get watchlist name for an instrument
    const getWatchlistForInstrument = (instrumentId: number): WatchlistInDb | undefined => {
        return dashboardWatchlists.find(wl => {
            if (wl.instruments?.some(inst => inst.id === instrumentId)) return true;

            // Check items if they are instruments
            if (wl.items && wl.items.length > 0) {
                const first = wl.items[0] as unknown as InstrumentInDb;
                if (first.symbol) {
                    return (wl.items as unknown as InstrumentInDb[]).some(inst => inst.id === instrumentId);
                }
                // Normal items
                return wl.items.some(item => item.instrument?.id === instrumentId);
            }
            return false;
        });
    };

    return (
        <div className="page-container flex flex-col section-gap">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="page-title">Dashboard</h1>
                        <MarketStatusIndicator exchange={currentExchange} />
                    </div>
                    <p className="page-subtitle mt-1">
                        {selectedExchange || 'All Exchanges'} &bull; {instruments.length} Watchlist Instruments
                    </p>
                </div>

                <div className="relative group shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                        type="search"
                        placeholder="Search instruments..."
                        className="w-full sm:w-[260px] md:w-[320px] pl-10 h-10 bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/30 rounded-xl transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/50 text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {marketIndices.length > 0 && (
                <div className="mb-2">
                    <h2 className="text-lg font-semibold mb-3">Market Indices</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {marketIndices.map((index) => (
                            <div
                                key={index.id}
                                onClick={() => navigate(`/stocks/${index.symbol}`)}
                                className="p-4 bg-card hover:bg-accent/50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg">{index.symbol}</span>
                                    <InstrumentPriceDeferred symbol={index.symbol} />
                                </div>
                                <div className="text-sm text-muted-foreground truncate">{index.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 sm:gap-3">
                {dashboardWatchlists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center border-2 border-dashed rounded-xl bg-gradient-to-br from-muted/20 to-muted/5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <ListPlus className="h-8 w-8 sm:h-10 sm:w-10 text-primary/70" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                            No Dashboard Watchlists
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground/80 max-w-md mb-6 px-4">
                            Create a watchlist and enable <span className="inline-flex items-center gap-1 text-primary font-medium"><Pin className="h-3.5 w-3.5" />Show on Dashboard</span> to see your favorite instruments here.
                        </p>
                        <Button
                            onClick={() => navigate('/watchlist')}
                            className="gap-2"
                        >
                            <ListPlus className="h-4 w-4" />
                            Go to Watchlists
                        </Button>
                    </div>
                ) : filteredInstruments.length > 0 ? (
                    filteredInstruments.map((instrument) => {
                        const watchlist = getWatchlistForInstrument(instrument.id);
                        return (
                            <div
                                key={instrument.id}
                                onClick={() => navigate(`/stocks/${instrument.symbol}`)}
                                className="group relative flex items-center justify-between p-3 sm:p-4 bg-card hover:bg-accent/50 border rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                            >
                                {/* Status Indicator Bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${!instrument.delisted ? 'bg-gradient-to-b from-green-500 to-emerald-600' : 'bg-red-500'} opacity-80`} />

                                <div className="flex items-center gap-3 sm:gap-4 pl-2 sm:pl-3 min-w-0 flex-1">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <span className="text-base sm:text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                                                {instrument.symbol}
                                            </span>
                                            {instrument.delisted && (
                                                <Badge variant="destructive" className="text-[10px] py-0 h-4">Delisted</Badge>
                                            )}
                                            {watchlist && (
                                                <Badge variant="secondary" className="text-[10px] py-0 h-4 gap-1">
                                                    <Pin className="h-2.5 w-2.5" />
                                                    {watchlist.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
                                            {instrument.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:gap-6 md:gap-10 shrink-0">
                                    <div className="hidden md:flex flex-col items-end min-w-[80px]">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Sector</span>
                                        <span className="text-sm font-medium">{instrument.sector_id ? sectorMap[instrument.sector_id] || instrument.sector_id : 'N/A'}</span>
                                    </div>

                                    <div className="hidden md:flex flex-col items-end min-w-[80px]">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Type</span>
                                        <span className="text-sm font-medium">{typeMap[instrument.instrument_type_id] || instrument.instrument_type_id}</span>
                                    </div>

                                    <div className="flex flex-col items-end min-w-[70px] sm:min-w-[100px]">
                                        <InstrumentPriceDeferred
                                            symbol={instrument.symbol}
                                            className="text-sm sm:text-lg font-mono font-bold"
                                        />
                                    </div>

                                    <div className="pr-1 sm:pr-2 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="text-base sm:text-lg font-semibold text-muted-foreground">
                            {instruments.length > 0 ? "No matching instruments found" : "No instruments in dashboard watchlists"}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground/80">
                            {instruments.length > 0 ? "Try adjusting your search terms." : "Add instruments to your dashboard watchlists to see them here."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
