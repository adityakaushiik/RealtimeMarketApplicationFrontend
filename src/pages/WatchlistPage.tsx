import { useEffect, useState } from "react";
import { ApiService } from "@/shared/services/apiService";
import type { WatchlistInDb } from "@/shared/types/apiTypes";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WatchlistCreateComponent } from "@/crud_utils/watchlist/WatchlistCreate";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function WatchlistPage() {
    const [watchlists, setWatchlists] = useState<WatchlistInDb[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const fetchWatchlists = async () => {
        setLoading(true);
        try {
            const data = await ApiService.getWatchlists();
            setWatchlists(data);
        } catch (error) {
            console.error("Failed to fetch watchlists", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlists();
    }, []);

    return (
        <div className="page-container">
            <div className="page-header-row">
                <div className="page-header">
                    <h1 className="page-title">Your Watchlists</h1>
                    <p className="page-subtitle">
                        Manage and view your favorite collections of stocks.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="sm:size-default">
                            <Plus className="mr-1.5 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Create Watchlist</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Watchlist</DialogTitle>
                            <DialogDescription>
                                Give your new watchlist a name.
                            </DialogDescription>
                        </DialogHeader>
                        <WatchlistCreateComponent onCreated={() => {
                            setDialogOpen(false);
                            fetchWatchlists();
                        }} />
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10 sm:py-12">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="card-grid">
                    {watchlists.length === 0 && (
                        <div className="col-span-full text-center py-10 sm:py-12 text-muted-foreground">
                            <p className="text-sm sm:text-base">You don't have any watchlists yet. Create one to get started!</p>
                        </div>
                    )}
                    {watchlists.map((watchlist) => (
                        <Card
                            key={watchlist.id}
                            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur"
                            onClick={() => navigate(`/watchlist/${watchlist.id}`)}
                        >
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                                    <span className="truncate">{watchlist.name}</span>
                                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Created by you
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                                <div className="text-xs sm:text-sm text-muted-foreground">
                                    {watchlist.items ? `${watchlist.items.length} items` : 'View items'}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
