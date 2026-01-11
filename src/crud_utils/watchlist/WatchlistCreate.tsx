import React, { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Pin } from 'lucide-react';

export function WatchlistCreateComponent({ onCreated }: { onCreated?: () => void }) {
    const [name, setName] = useState('');
    const [showOnDashboard, setShowOnDashboard] = useState(false);
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
            await ApiService.createWatchlist({ name, show_on_dashboard: showOnDashboard });
            setSuccess(true);
            setName('');
            setShowOnDashboard(false);
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

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <Label htmlFor="show-on-dashboard" className="text-sm font-medium cursor-pointer">
                            Show on Dashboard
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Display this watchlist's instruments on your dashboard
                        </p>
                    </div>
                </div>
                <Switch
                    id="show-on-dashboard"
                    checked={showOnDashboard}
                    onCheckedChange={setShowOnDashboard}
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Watchlist created successfully!</p>}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Watchlist'}
            </Button>
        </form>
    );
}
