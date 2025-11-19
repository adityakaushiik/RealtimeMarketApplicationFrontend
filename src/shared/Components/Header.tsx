import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background w-full">
            <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    MarketRealtime
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Exchanges</SelectLabel>
                            <SelectItem value="nyse">NYSE</SelectItem>
                            <SelectItem value="nasdaq">NASDAQ</SelectItem>
                            <SelectItem value="amex">AMEX</SelectItem>
                            <SelectItem value="euronext">Euronext</SelectItem>
                            <SelectItem value="lse">LSE</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </header>
    );
}
