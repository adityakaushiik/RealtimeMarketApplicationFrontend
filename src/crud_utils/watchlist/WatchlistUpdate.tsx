import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { WatchlistInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function WatchlistUpdateComponent() {
    const [watchlists, setWatchlists] = useState<WatchlistInDb[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [name, setName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const loadWatchlists = async () => {
        try {
            const data = await ApiService.getWatchlists();
            setWatchlists(data);
        } catch (err) {
            console.error("Failed to load watchlists", err);
        }
    };

    useEffect(() => {
        loadWatchlists();
    }, []);

    useEffect(() => {
        if (selectedId) {
            const wl = watchlists.find(w => w.id.toString() === selectedId);
            if (wl) setName(wl.name);
        } else {
            setName('');
        }
    }, [selectedId, watchlists]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.updateWatchlist(parseInt(selectedId), { name });
            setSuccess(true);
            loadWatchlists(); // Refresh list
        } catch (err: any) {
            setError(err.message || 'Failed to update watchlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Select Watchlist</Label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Watchlist" />
                    </SelectTrigger>
                    <SelectContent>
                        {watchlists.map(w => (
                            <SelectItem key={w.id} value={w.id.toString()}>
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedId && (
                <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md">
                    <div className="space-y-2">
                        <Label htmlFor="update-name">Name</Label>
                        <Input
                            id="update-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">Watchlist updated successfully!</p>}

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Name'}
                    </Button>
                </form>
            )}
        </div>
    );
}
