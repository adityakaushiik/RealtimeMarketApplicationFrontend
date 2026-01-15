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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InstrumentPriceDeferred from "@/components/InstrumentPriceDeferred";

export function WatchlistDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [watchlist, setWatchlist] = useState<WatchlistInDb | null>(null);
    const [loading, setLoading] = useState(true);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newName, setNewName] = useState("");
    // const [togglingDashboard, setTogglingDashboard] = useState(false); // Commented out

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
        // Open confirmation dialog instead of window.confirm
        setDeleteDialogOpen(true);
    };

    const confirmDeleteWatchlist = async () => {
        if (!watchlist) return;

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

    /* Commented out - show_on_dashboard functionality
    const handleToggleDashboard = async () => {
        if (!watchlist || togglingDashboard) return;
        setTogglingDashboard(true);
        try {
            const updated = await ApiService.setWatchlistShowOnDashboard(
                watchlist.id,
                !watchlist.show_on_dashboard
            );
            setWatchlist(updated);
        } catch (error) {
            console.error("Failed to toggle dashboard", error);
            alert("Failed to update dashboard setting");
        } finally {
            setTogglingDashboard(false);
        }
    };
    */

    // Get instruments from the watchlist - either from instruments array or items with instrument
    const getInstruments = (): InstrumentInDb[] => {
        if (!watchlist) return [];

        // If instruments array is populated (from dashboard API or similar)
        if (watchlist.instruments && watchlist.instruments.length > 0) {
            return watchlist.instruments;
        }

        if (watchlist.items && watchlist.items.length > 0) {
            // Check if items are actually instruments (as confirmed by user)
            const firstItem = watchlist.items[0] as unknown as InstrumentInDb;
            if (firstItem.symbol) {
                return watchlist.items as unknown as InstrumentInDb[];
            }

            // Legacy fallback: extract from items if they have instrument data
            return watchlist.items
                .filter(item => item.instrument)
                .map(item => item.instrument!);
        }

        return [];
    };

    const instruments = getInstruments();

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
                    <div className="flex items-center gap-2">
                        <h1 className="page-title">{watchlist.name}</h1>
                        {/* Commented out - show_on_dashboard badge
                        {watchlist.show_on_dashboard && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                <Pin className="h-3 w-3" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </div>
                        )}
                        */}
                    </div>
                    <p className="page-subtitle">{watchlist.items?.length || instruments.length || 0} items</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/* Commented out - show_on_dashboard toggle
                        <DropdownMenuItem onClick={handleToggleDashboard} disabled={togglingDashboard}>
                            {watchlist.show_on_dashboard ? (
                                <>
                                    <PinOff className="mr-2 h-4 w-4" /> Remove from Dashboard
                                </>
                            ) : (
                                <>
                                    <Pin className="mr-2 h-4 w-4" /> Show on Dashboard
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        */}
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
                {instruments.length === 0 && (!watchlist.items || watchlist.items.length === 0) ? (
                    <div className="text-center py-10 sm:py-12 border-2 border-dashed rounded-lg">
                        <p className="text-sm sm:text-base text-muted-foreground">This watchlist is empty.</p>
                        <Button variant="link" size="sm" onClick={() => navigate("/stocks")} className="mt-2">
                            Search for stocks to add
                        </Button>
                    </div>
                ) : instruments.length > 0 ? (
                    <div className="grid gap-2 sm:gap-3">
                        {instruments.map((inst) => (
                            <div key={inst.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col cursor-pointer min-w-0 flex-1" onClick={() => navigate(`/stocks/${inst.symbol}`)}>
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="font-bold text-base sm:text-lg">{inst.symbol}</span>
                                        {inst.delisted && <span className="text-[10px] sm:text-xs bg-red-100 text-red-800 px-1.5 sm:px-2 py-0.5 rounded">Delisted</span>}
                                    </div>
                                    <span className="text-xs sm:text-sm text-muted-foreground truncate">{inst.name}</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                    <InstrumentPriceDeferred symbol={inst.symbol} className="text-sm sm:text-lg font-mono font-bold" />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveItem(inst.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Fallback for when we only have items without full instrument data
                    <div className="grid gap-2 sm:gap-3">
                        {watchlist.items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <span className="font-bold text-base sm:text-lg">Instrument #{item.instrument_id}</span>
                                    </div>
                                    <span className="text-xs sm:text-sm text-muted-foreground">Loading instrument details...</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleRemoveItem(item.instrument_id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
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

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the watchlist
                            "{watchlist?.name}" and remove it from your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteWatchlist} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
