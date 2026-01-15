import { useEffect, useState } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { useNavigate } from "react-router-dom"
import { Search, TrendingUp, BarChart2, ArrowRight } from "lucide-react"
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb, ExchangeInDb } from "@/shared/types/apiTypes";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/shared/store/appStore";

export function StockSearchPage() {
    const navigate = useNavigate()
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const { selectedExchange } = useAppStore();
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);

    // Fetch exchanges once on mount (uses cache)
    useEffect(() => {
        ApiService.getExchanges().then(setExchanges).catch(console.error);
    }, []);

    // Create a map for quick lookup
    const exchangeMap = exchanges.reduce((acc, ex) => {
        acc[ex.id] = ex;
        return acc;
    }, {} as Record<number, ExchangeInDb>);

    useEffect(() => {
        const fetchInstruments = async () => {
            if (!searchQuery.trim()) {
                setInstruments([]);
                return;
            }

            setLoading(true);
            try {
                const data = await ApiService.searchInstruments(searchQuery, selectedExchange || undefined);
                if (Array.isArray(data)) {
                    setInstruments(data);
                } else {
                    setInstruments([]);
                }
            } catch (error) {
                console.error("Failed to search instruments:", error);
                setInstruments([]);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchInstruments();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedExchange]);

    return (
        <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-10 sm:pt-16 lg:pt-20 overflow-hidden bg-background/50 px-4 sm:px-6">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[20%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-primary/20 blur-[80px] sm:blur-[120px] mix-blend-screen opacity-50 animate-pulse" />
                <div className="absolute top-[10%] result-[20%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-blue-500/20 blur-[60px] sm:blur-[100px] mix-blend-screen opacity-50" />
            </div>

            <div className={`w-full max-w-2xl space-y-6 sm:space-y-8 transition-all duration-500 ${searchQuery ? 'mt-0' : 'mt-4 sm:mt-10'}`}>
                <div className="text-center space-y-2 sm:space-y-4">
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-incredibly-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                        Market Search
                    </h1>
                    <p className="text-base sm:text-xl text-muted-foreground font-light max-w-lg mx-auto leading-relaxed px-4">
                        Search across all exchanges and find the instrument you're looking for.
                    </p>
                </div>

                <div
                    className={`
                        relative w-full mx-auto 
                        rounded-lg sm:rounded-xl border border-border/50 shadow-lg sm:shadow-2xl 
                        bg-background/80 backdrop-blur-xl 
                        transition-all duration-300 ease-out
                        ${isFocused ? 'ring-2 ring-primary/20 scale-[1.01]' : 'hover:border-primary/50'}
                    `}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                >
                    <Command className="rounded-lg sm:rounded-xl border-none bg-transparent" shouldFilter={false}>
                        <div className="flex items-center border-b border-border/50 px-3">
                            <Search className={`mr-2 h-4 w-4 sm:h-5 sm:w-5 shrink-0 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'}`} />
                            <CommandPrimitive.Input
                                placeholder="Search by symbol or name..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="flex h-12 sm:h-14 w-full rounded-md bg-transparent py-3 text-base sm:text-lg outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                            />
                        </div>
                        <CommandList className="max-h-[350px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
                            {loading && (
                                <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300">
                                    <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3 sm:mb-4" />
                                    <span className="text-xs sm:text-sm font-medium">Searching markets...</span>
                                </div>
                            )}

                            {!loading && instruments.length === 0 && searchQuery && (
                                <CommandEmpty className="py-8 sm:py-12 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center space-y-2">
                                        <Search className="h-10 w-10 sm:h-12 sm:w-12 opacity-20" />
                                        <p className="text-base sm:text-lg font-medium">No results found</p>
                                        <p className="text-xs sm:text-sm">Try searching for a different symbol or company name.</p>
                                    </div>
                                </CommandEmpty>
                            )}

                            {instruments.length > 0 && (
                                <CommandGroup heading={<span className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase px-2">Instruments</span>}>
                                    <div className="grid grid-cols-1 gap-1 p-2">
                                        {instruments.map((instrument) => (
                                            <CommandItem
                                                key={instrument.id}
                                                value={`${instrument.symbol} ${instrument.name}`}
                                                onSelect={() => navigate(`/stocks/${instrument.symbol}`)}
                                                className="
                                                    group flex items-center justify-between p-2.5 sm:p-3 rounded-lg 
                                                    cursor-pointer transition-all duration-200
                                                    hover:bg-primary/5 data-[selected=true]:bg-primary/10
                                                "
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                                                        <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-sm sm:text-base tracking-tight">{instrument.symbol}</span>
                                                        <span className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{instrument.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                                                    {exchangeMap[instrument.exchange_id] && (
                                                        <Badge variant="outline" className="text-[10px] sm:text-xs font-semibold bg-secondary/50 border-border/50">
                                                            {exchangeMap[instrument.exchange_id].code}
                                                        </Badge>
                                                    )}
                                                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300" />
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </div>
                                </CommandGroup>
                            )}

                            {!searchQuery && !loading && (
                                <div className="p-4 sm:p-6 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 opacity-40">
                                        <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                                        <p className="text-xs sm:text-sm text-muted-foreground">Start typing to search for stocks...</p>
                                    </div>
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </div>

                {/* Visual Footer/Hints - Hidden on small mobile */}
                <div className="hidden sm:flex justify-center gap-4 text-xs text-muted-foreground/60">
                    <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted/30">ENTER</Badge> to select</span>
                    <span className="flex items-center gap-1"><Badge variant="outline" className="text-[10px] h-5 px-1 bg-muted/30">↓</Badge> to navigate</span>
                </div>
            </div>
        </div>
    )
}
