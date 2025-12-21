import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeHolidayUpdate, ExchangeHolidayInDb, ExchangeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';

export function ExchangeHolidayUpdateComponent() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [holidays, setHolidays] = useState<ExchangeHolidayInDb[]>([]);
    const [selectedHolidayId, setSelectedHolidayId] = useState<string>('');

    const [formData, setFormData] = useState<ExchangeHolidayUpdate>({});

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

    const handleHolidaySelect = (holidayId: string) => {
        setSelectedHolidayId(holidayId);
        const holiday = holidays.find(h => h.id.toString() === holidayId);
        if (holiday) {
            setFormData({
                date: holiday.date,
                description: holiday.description,
                is_closed: holiday.is_closed,
                open_time: holiday.open_time,
                close_time: holiday.close_time
            });
            setSuccess(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            is_closed: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHolidayId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.updateExchangeHoliday(parseInt(selectedHolidayId), formData);
            setSuccess(true);
            // Refresh list
            if (selectedExchangeId) fetchHolidays(parseInt(selectedExchangeId));
        } catch (err: any) {
            setError(err.message || 'Failed to update holiday');
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
                    <Label>Select Holiday to Update</Label>
                    <Select value={selectedHolidayId} onValueChange={handleHolidaySelect} disabled={fetching}>
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
                <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex items-center space-x-2 md:col-span-2">
                            <Checkbox
                                id="is_closed"
                                checked={formData.is_closed || false}
                                onCheckedChange={handleCheckboxChange}
                            />
                            <Label htmlFor="is_closed">Is Closed?</Label>
                        </div>

                        {!formData.is_closed && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="open_time">Open Time</Label>
                                    <Input
                                        id="open_time"
                                        name="open_time"
                                        type="time"
                                        value={formData.open_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="close_time">Close Time</Label>
                                    <Input
                                        id="close_time"
                                        name="close_time"
                                        type="time"
                                        value={formData.close_time || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">Holiday updated successfully!</p>}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
