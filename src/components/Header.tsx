import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { ApiService } from "@/shared/services/apiService";
import type { ExchangeInDb } from "@/shared/types/apiTypes";
import { useAppStore } from "@/shared/store/appStore";
import { useTheme } from "@/components/theme-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";

export function Header() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const { selectedExchange, setSelectedExchange } = useAppStore();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    const handleLogout = () => {
        ApiService.logout();
        navigate("/login");
    };

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
                    <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Exchanges</SelectLabel>
                            {exchanges.map((exchange) => (
                                <SelectItem key={exchange.id} value={exchange.code}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{exchange.code}</span>
                                        <span className="text-muted-foreground text-xs truncate max-w-[100px]">
                                            {exchange.name}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Logout"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Logout</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to log out?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleLogout}>
                                Logout
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
    );
}
