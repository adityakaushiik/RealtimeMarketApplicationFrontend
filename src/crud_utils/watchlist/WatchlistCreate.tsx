import React, { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function WatchlistCreateComponent({ onCreated }: { onCreated?: () => void }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!name.trim()) {
            setError('Name is required');
            setLoading(false);
            return;
        }

        try {
            await ApiService.createWatchlist({ name });
            setSuccess(true);
            setName('');
            if (onCreated) onCreated();
        } catch (err: any) {
            setError(err.message || 'Failed to create watchlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="watchlist-name">Watchlist Name</Label>
                <Input
                    id="watchlist-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Favorites"
                    required
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Watchlist created successfully!</p>}

            <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Watchlist'}
            </Button>
        </form>
    );
}
