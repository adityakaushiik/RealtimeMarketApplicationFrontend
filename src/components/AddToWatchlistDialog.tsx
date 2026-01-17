import React, { useState, useEffect } from 'react';
import { ApiService } from '../shared/services/apiService';
import type { WatchlistInDb, ExchangeInDb } from '../shared/types/apiTypes';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select"
import { Input } from './ui/input';
import { Plus, AlertCircle } from 'lucide-react';
import { Label } from './ui/label';

interface AddToWatchlistDialogProps {
    instrumentId: number;
    symbol: string;
    exchangeId: number; // Add exchange_id prop
    trigger?: React.ReactNode;
}

export function AddToWatchlistDialog({ instrumentId, symbol, exchangeId, trigger }: AddToWatchlistDialogProps) {
    const [open, setOpen] = useState(false);
    const [watchlists, setWatchlists] = useState<WatchlistInDb[]>([]);
    const [filteredWatchlists, setFilteredWatchlists] = useState<WatchlistInDb[]>([]);
    const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch exchanges on mount (uses cache)
        ApiService.getExchanges().then(setExchanges).catch(console.error);
    }, []);

    useEffect(() => {
        if (open) {
            loadWatchlists();
            resetForm();
        }
    }, [open]);

    // Filter watchlists by exchange_id when watchlists or exchangeId changes
    useEffect(() => {
        const filtered = watchlists.filter(w => w.exchange_id === exchangeId);
        setFilteredWatchlists(filtered);
    }, [watchlists, exchangeId]);

    const loadWatchlists = async () => {
        try {
            const data = await ApiService.getWatchlists();
            setWatchlists(data);
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setSelectedWatchlist('');
        setIsCreatingNew(false);
        setNewWatchlistName('');
        setError(null);
        setLoading(false);
    };

    // Get exchange name for current instrument
    const currentExchange = exchanges.find(e => e.id === exchangeId);

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            let targetWatchlistId: number;

            if (isCreatingNew) {
                if (!newWatchlistName.trim()) {
                    setError("Watchlist name is required");
                    setLoading(false);
                    return;
                }
                // Create new watchlist with the instrument's exchange_id
                const newWl = await ApiService.createWatchlist({
                    name: newWatchlistName,
                    exchange_id: exchangeId,
                    show_on_dashboard: false // Explicitly send true to satisfy backend
                });
                targetWatchlistId = newWl.id;
            } else {
                if (!selectedWatchlist) {
                    setError("Please select a watchlist");
                    setLoading(false);
                    return;
                }
                targetWatchlistId = parseInt(selectedWatchlist);
            }

            await ApiService.addItemToWatchlist(targetWatchlistId, { instrument_id: instrumentId });
            setOpen(false);
        } catch (err: any) {
            setError(err.message || "Failed to add to watchlist");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Add to Watchlist</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add {symbol} to Watchlist</DialogTitle>
                    <DialogDescription>
                        Choose a watchlist to add this instrument to, or create a new one.
                        {currentExchange && (
                            <span className="block mt-1 text-xs">
                                Only showing watchlists for <strong>{currentExchange.code}</strong> exchange.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isCreatingNew ? (
                        <div className="space-y-4">
                            {filteredWatchlists.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>Select Watchlist</Label>
                                        <Select value={selectedWatchlist} onValueChange={setSelectedWatchlist}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a watchlist" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredWatchlists.map((w) => (
                                                    <SelectItem key={w.id} value={w.id.toString()}>
                                                        {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="text-center text-sm text-muted-foreground">
                                        or
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">
                                        No watchlists found for <strong>{currentExchange?.code || 'this exchange'}</strong>.
                                    </p>
                                    <p className="text-xs text-muted-foreground/80">
                                        Create a new watchlist below to get started.
                                    </p>
                                </div>
                            )}
                            <Button variant="outline" className="w-full" onClick={() => setIsCreatingNew(true)}>
                                Create New Watchlist
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Watchlist Name</Label>
                                <Input
                                    value={newWatchlistName}
                                    onChange={(e) => setNewWatchlistName(e.target.value)}
                                    placeholder="My New Watchlist"
                                />
                                <p className="text-xs text-muted-foreground">
                                    This watchlist will be created for <strong>{currentExchange?.code || 'this exchange'}</strong>.
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
                                Back to select
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
