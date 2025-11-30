import { useEffect, useState } from "react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb } from "@/shared/types/apiTypes";

export function StockSearchPage() {
    const navigate = useNavigate()
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstruments = async () => {
            try {
                const data = await ApiService.getAllInstruments();
                // Ensure data is an array
                if (Array.isArray(data)) {
                    setInstruments(data);
                } else if (typeof data === 'object' && data !== null) {
                    setInstruments(Object.values(data));
                }
            } catch (error) {
                console.error("Failed to fetch instruments:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInstruments();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="w-full max-w-2xl space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight">Search Stocks</h1>
                <p className="text-muted-foreground text-lg">
                    Find and analyze real-time market data for your favorite stocks.
                </p>

                <div className="relative w-full max-w-xl mx-auto mt-8 border rounded-lg shadow-sm bg-background">
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Type a symbol or name..." />
                        <CommandList>
                            <CommandEmpty>{loading ? "Loading..." : "No results found."}</CommandEmpty>
                            <CommandGroup heading="Suggestions">
                                {instruments.slice(0, 50).map((instrument) => (
                                    <CommandItem
                                        key={instrument.id}
                                        value={`${instrument.symbol} ${instrument.name}`}
                                        onSelect={() => {
                                            navigate(`/stocks/${instrument.symbol}`)
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        <span>{instrument.name}</span>
                                        <span className="ml-auto text-muted-foreground text-xs">
                                            {instrument.symbol}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </div>
        </div>
    )
}
