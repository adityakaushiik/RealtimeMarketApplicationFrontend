import React, { useState, useEffect } from 'react';
import { ApiService } from '../shared/services/apiService';
import type { WatchlistInDb } from '../shared/types/apiTypes';
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
import { Plus } from 'lucide-react';
import { Label } from './ui/label';

interface AddToWatchlistDialogProps {
    instrumentId: number;
    symbol: string;
    trigger?: React.ReactNode;
}

export function AddToWatchlistDialog({ instrumentId, symbol, trigger }: AddToWatchlistDialogProps) {
    const [open, setOpen] = useState(false);
    const [watchlists, setWatchlists] = useState<WatchlistInDb[]>([]);
    const [selectedWatchlist, setSelectedWatchlist] = useState<string>('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newWatchlistName, setNewWatchlistName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadWatchlists();
            resetForm();
        }
    }, [open]);

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
                const newWl = await ApiService.createWatchlist({ name: newWatchlistName });
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
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!isCreatingNew ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Select Watchlist</Label>
                                <Select value={selectedWatchlist} onValueChange={setSelectedWatchlist}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a watchlist" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {watchlists.map((w) => (
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
