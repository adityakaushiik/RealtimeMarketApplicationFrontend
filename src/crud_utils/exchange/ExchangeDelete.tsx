import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

interface ExchangeDeleteProps {
    onDeleteComplete?: () => void;
}

export function ExchangeDeleteComponent({ onDeleteComplete }: ExchangeDeleteProps) {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [selectedExchange, setSelectedExchange] = useState<ExchangeInDb | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchExchanges = async () => {
            try {
                const data = await ApiService.getExchanges();
                setExchanges(data);
            } catch (err) {
                console.error('Failed to fetch exchanges', err);
            }
        };
        fetchExchanges();
    }, []);

    const handleSelectChange = (value: string) => {
        setSelectedExchangeId(value);
        setSuccess(false);
        setError(null);
        const exchange = exchanges.find(e => e.id.toString() === value);
        setSelectedExchange(exchange || null);
    };

    const handleDelete = async () => {
        if (!selectedExchangeId) return;
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteExchange(parseInt(selectedExchangeId));
            setSuccess(true);
            setSelectedExchangeId('');
            setSelectedExchange(null);
            // Refresh the list
            const data = await ApiService.getExchanges();
            setExchanges(data);
            if (onDeleteComplete) onDeleteComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to delete exchange');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium">Delete Exchange</h3>
                <p className="text-sm text-muted-foreground">Select the exchange you want to delete. This action cannot be undone.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="delete-exchange">Select Exchange</Label>
                    <Select value={selectedExchangeId} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an exchange to delete" />
                        </SelectTrigger>
                        <SelectContent>
                            {exchanges.map((exchange) => (
                                <SelectItem key={exchange.id} value={exchange.id.toString()}>
                                    {exchange.name} ({exchange.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {selectedExchange && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                        <p className="text-sm font-medium text-destructive">Warning!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You are about to delete <strong>{selectedExchange.name}</strong> ({selectedExchange.code}).
                            This will also delete all associated instruments and data.
                        </p>
                    </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">Exchange deleted successfully!</p>}

                <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={loading || !selectedExchangeId}
                    className="w-full"
                >
                    {loading ? 'Deleting...' : 'Delete Exchange'}
                </Button>
            </div>
        </div>
    );
}

export default ExchangeDeleteComponent;
