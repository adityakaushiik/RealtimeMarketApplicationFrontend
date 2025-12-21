import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { WatchlistInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function WatchlistDeleteComponent() {
    const [watchlists, setWatchlists] = useState<WatchlistInDb[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');

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

    const handleDelete = async () => {
        if (!selectedId) return;
        if (!window.confirm("Are you sure? This will delete the watchlist and all its items.")) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteWatchlist(parseInt(selectedId));
            setSuccess(true);
            setSelectedId('');
            loadWatchlists();
        } catch (err: any) {
            setError(err.message || 'Failed to delete watchlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Select Watchlist to Delete</Label>
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
                <div className="border p-4 rounded-md space-y-4">
                    <p className="text-red-500 font-medium">Warning: This action cannot be undone.</p>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">Watchlist deleted successfully!</p>}

                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete Watchlist'}
                    </Button>
                </div>
            )}
        </div>
    );
}
