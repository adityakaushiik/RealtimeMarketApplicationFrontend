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

// Mock data for stocks - in a real app this would come from an API
const stocks = [
    {
        value: "AAPL",
        label: "Apple Inc.",
    },
    {
        value: "GOOGL",
        label: "Alphabet Inc.",
    },
    {
        value: "MSFT",
        label: "Microsoft Corporation",
    },
    {
        value: "AMZN",
        label: "Amazon.com Inc.",
    },
    {
        value: "TSLA",
        label: "Tesla Inc.",
    },
    {
        value: "NVDA",
        label: "NVIDIA Corporation",
    },
    {
        value: "META",
        label: "Meta Platforms Inc.",
    },
    {
        value: "NFLX",
        label: "Netflix Inc.",
    },
]

export function StockSearchPage() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="w-full max-w-2xl space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight">Search Stocks</h1>
                <p className="text-muted-foreground text-lg">
                    Find and analyze real-time market data for your favorite stocks.
                </p>

                <div className="relative w-full max-w-xl mx-auto mt-8 border rounded-lg shadow-sm bg-background">
                    <Command className="rounded-lg border shadow-md">
                        <CommandInput placeholder="Type a command or search..." />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup heading="Suggestions">
                                {stocks.map((stock) => (
                                    <CommandItem
                                        key={stock.value}
                                        onSelect={() => {
                                            navigate(`/stocks/${stock.value}`)
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        <span>{stock.label}</span>
                                        <span className="ml-auto text-muted-foreground text-xs">
                                            {stock.value}
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
