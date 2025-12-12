import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ApiService } from "@/shared/services/apiService";
import type { ExchangeInDb } from "@/shared/types/apiTypes";
import { useAppStore } from "@/shared/store/appStore";

export function Header() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const { selectedExchange, setSelectedExchange } = useAppStore();

    useEffect(() => {
        const fetchExchanges = async () => {
            try {
                const data = await ApiService.getExchanges();
                setExchanges(data);
                // Set default exchange if none selected and exchanges exist
                if (!selectedExchange && data.length > 0) {
                    setSelectedExchange(data[0].code);
                }
            } catch (error) {
                console.error("Failed to fetch exchanges:", error);
            }
        };
        fetchExchanges();
    }, [selectedExchange, setSelectedExchange]);

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background w-full">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    MarketRealtime
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <Select
                    value={selectedExchange || ""}
                    onValueChange={(value) => setSelectedExchange(value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Exchanges</SelectLabel>
                            {exchanges.map((exchange) => (
                                <SelectItem key={exchange.id} value={exchange.code}>
                                    {exchange.code}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </header>
    );
}
