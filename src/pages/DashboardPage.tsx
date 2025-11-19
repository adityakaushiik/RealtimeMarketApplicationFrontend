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

// Mock data for the table
const stockList = [
    {
        symbol: "AAPL",
        name: "Apple Inc.",
        price: "182.52",
        change: "+1.25%",
        volume: "45.2M",
        status: "Active",
    },
    {
        symbol: "MSFT",
        name: "Microsoft Corp.",
        price: "405.12",
        change: "+0.85%",
        volume: "22.1M",
        status: "Active",
    },
    {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        price: "142.38",
        change: "-0.42%",
        volume: "18.5M",
        status: "Active",
    },
    {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        price: "175.35",
        change: "+2.15%",
        volume: "32.8M",
        status: "Active",
    },
    {
        symbol: "TSLA",
        name: "Tesla Inc.",
        price: "198.25",
        change: "-1.55%",
        volume: "85.4M",
        status: "Active",
    },
];

export const DashboardPage = () => {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Market overview and real-time statistics.
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Stocks
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,345</div>
                        <p className="text-xs text-muted-foreground">
                            +180 from last month
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
                        <div className="text-2xl font-bold">45.2M</div>
                        <p className="text-xs text-muted-foreground">
                            +19% from yesterday
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
                            Closes in 4h 30m
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
                        <div className="text-2xl font-bold">$12.4T</div>
                        <p className="text-xs text-muted-foreground">
                            +2.5% from last year
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Stocks Table */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Market Movers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Change</TableHead>
                                <TableHead>Volume</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stockList.map((stock) => (
                                <TableRow key={stock.symbol}>
                                    <TableCell className="font-medium">
                                        {stock.symbol}
                                    </TableCell>
                                    <TableCell>{stock.name}</TableCell>
                                    <TableCell>${stock.price}</TableCell>
                                    <TableCell
                                        className={
                                            stock.change.startsWith("+")
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {stock.change}
                                    </TableCell>
                                    <TableCell>{stock.volume}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            {stock.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
