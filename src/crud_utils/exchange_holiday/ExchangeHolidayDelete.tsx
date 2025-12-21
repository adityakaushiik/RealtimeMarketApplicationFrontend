import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeHolidayInDb, ExchangeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function ExchangeHolidayDeleteComponent() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [holidays, setHolidays] = useState<ExchangeHolidayInDb[]>([]);
    const [selectedHolidayId, setSelectedHolidayId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadExchanges = async () => {
            try {
                const data = await ApiService.getExchanges();
                setExchanges(data);
            } catch (err) {
                console.error("Failed to load exchanges", err);
            }
        };
        loadExchanges();
    }, []);

    useEffect(() => {
        if (selectedExchangeId) {
            fetchHolidays(parseInt(selectedExchangeId));
        } else {
            setHolidays([]);
            setSelectedHolidayId('');
        }
    }, [selectedExchangeId]);

    const fetchHolidays = async (exchangeId: number) => {
        setFetching(true);
        try {
            const data = await ApiService.getExchangeHolidays(exchangeId);
            setHolidays(data);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setFetching(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedHolidayId) return;
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteExchangeHoliday(parseInt(selectedHolidayId));
            setSuccess(true);
            setSelectedHolidayId('');
            if (selectedExchangeId) fetchHolidays(parseInt(selectedExchangeId));
        } catch (err: any) {
            setError(err.message || 'Failed to delete holiday');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Select Exchange</Label>
                <Select value={selectedExchangeId} onValueChange={setSelectedExchangeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Exchange" />
                    </SelectTrigger>
                    <SelectContent>
                        {exchanges.map(ex => (
                            <SelectItem key={ex.id} value={ex.id.toString()}>
                                {ex.name} ({ex.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedExchangeId && (
                <div className="space-y-2">
                    <Label>Select Holiday to Delete</Label>
                    <Select value={selectedHolidayId} onValueChange={setSelectedHolidayId} disabled={fetching}>
                        <SelectTrigger>
                            <SelectValue placeholder={fetching ? "Loading..." : "Select Holiday"} />
                        </SelectTrigger>
                        <SelectContent>
                            {holidays.map(h => (
                                <SelectItem key={h.id} value={h.id.toString()}>
                                    {h.date} - {h.description || 'No Description'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedHolidayId && (
                <div className="border p-4 rounded-md space-y-4">
                    <p className="text-red-500 font-medium">Warning: This action cannot be undone.</p>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">Holiday deleted successfully!</p>}

                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete Holiday'}
                    </Button>
                </div>
            )}
        </div>
    );
}
