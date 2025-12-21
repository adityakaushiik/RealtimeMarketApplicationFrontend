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
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Your Watchlists</h1>
                    <p className="text-muted-foreground">
                        Manage and view your favorite collections of stocks.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Watchlist
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
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlists.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            You don't have any watchlists yet. Create one to get started!
                        </div>
                    )}
                    {watchlists.map((watchlist) => (
                        <Card
                            key={watchlist.id}
                            className="group relative cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur"
                            onClick={() => navigate(`/watchlist/${watchlist.id}`)}
                        >
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span className="truncate">{watchlist.name}</span>
                                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </CardTitle>
                                <CardDescription>
                                    Created by you
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
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
