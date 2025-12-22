import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApiService } from "@/shared/services/apiService";
import type { WatchlistInDb, InstrumentInDb } from "@/shared/types/apiTypes";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, MoreVertical, Edit2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WatchlistDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [watchlist, setWatchlist] = useState<WatchlistInDb | null>(null);
    const [instruments, setInstruments] = useState<Map<number, InstrumentInDb>>(new Map());
    const [loading, setLoading] = useState(true);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        if (id) {
            fetchWatchlist(parseInt(id));
        }
    }, [id]);

    const fetchWatchlist = async (watchlistId: number) => {
        setLoading(true);
        try {
            const data = await ApiService.getWatchlistById(watchlistId);
            setWatchlist(data);
            setNewName(data.name);

            // Fetch instrument details for all items
            if (data.items && data.items.length > 0) {
                const instrumentIds = data.items.map(i => i.instrument_id);
                // Unique IDs
                const uniqueIds = Array.from(new Set(instrumentIds));

                // Fetch in parallel (or optimized batch if available, but loop for now)
                const promises = uniqueIds.map(instId => ApiService.getInstrumentById(instId).catch(() => null));
                const results = await Promise.all(promises);

                const instMap = new Map<number, InstrumentInDb>();
                results.forEach(inst => {
                    if (inst) instMap.set(inst.id, inst);
                });
                setInstruments(instMap);
            }
        } catch (error) {
            console.error("Failed to fetch watchlist", error);
            // Maybe redirect if not found
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (instrumentId: number) => {
        if (!watchlist) return;
        if (!window.confirm("Remove this stock from watchlist?")) return;

        try {
            await ApiService.removeItemFromWatchlist(watchlist.id, instrumentId);
            // Refresh
            fetchWatchlist(watchlist.id);
        } catch (error) {
            console.error("Failed to remove item", error);
            alert("Failed to remove item");
        }
    };

    const handleDeleteWatchlist = async () => {
        if (!watchlist) return;
        if (!window.confirm("Are you sure you want to delete this specific watchlist?")) return;

        try {
            await ApiService.deleteWatchlist(watchlist.id);
            navigate("/watchlist");
        } catch (error) {
            console.error("Failed to delete watchlist", error);
        }
    };

    const handleRename = async () => {
        if (!watchlist || !newName.trim()) return;
        try {
            await ApiService.updateWatchlist(watchlist.id, { name: newName });
            setRenameDialogOpen(false);
            fetchWatchlist(watchlist.id);
        } catch (error) {
            console.error("Failed to rename", error);
        }
    };

    if (loading && !watchlist) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    if (!watchlist) {
        return <div className="text-center py-20">Watchlist not found.</div>;
    }

    return (
        <div className="page-container">
            <Button variant="ghost" size="sm" onClick={() => navigate("/watchlist")} className="mb-4 -ml-2 sm:-ml-3 text-sm">
                <ArrowLeft className="mr-1.5 sm:mr-2 h-4 w-4" /> Back to Watchlists
            </Button>

            <div className="page-header-row">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">{watchlist.name}</h1>
                    <p className="page-subtitle">{watchlist.items?.length || 0} items</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteWatchlist} className="text-red-500 hover:text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Watchlist
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6">
                {watchlist.items && watchlist.items.length === 0 ? (
                    <div className="text-center py-10 sm:py-12 border-2 border-dashed rounded-lg">
                        <p className="text-sm sm:text-base text-muted-foreground">This watchlist is empty.</p>
                        <Button variant="link" size="sm" onClick={() => navigate("/stocks")} className="mt-2">
                            Search for stocks to add
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-2 sm:gap-3">
                        {watchlist.items?.map((item) => {
                            const inst = instruments.get(item.instrument_id);
                            return (
                                <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col cursor-pointer min-w-0 flex-1" onClick={() => inst && navigate(`/stocks/${inst.symbol}`)}>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <span className="font-bold text-base sm:text-lg">{inst?.symbol || `ID: ${item.instrument_id}`}</span>
                                            {inst?.delisted && <span className="text-[10px] sm:text-xs bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 rounded">Delisted</span>}
                                        </div>
                                        <span className="text-xs sm:text-sm text-muted-foreground truncate">{inst?.name || 'Loading...'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveItem(item.instrument_id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Watchlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleRename}>Save Changes</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
