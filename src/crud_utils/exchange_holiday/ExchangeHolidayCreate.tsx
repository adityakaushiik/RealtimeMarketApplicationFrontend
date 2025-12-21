import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeHolidayCreate, ExchangeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';

export function ExchangeHolidayCreateComponent() {
    const [formData, setFormData] = useState<ExchangeHolidayCreate>({
        date: '',
        description: '',
        is_closed: true,
        open_time: '',
        close_time: '',
        exchange_id: 0
    });
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [loading, setLoading] = useState(false);
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

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.exchange_id) {
            setError('Exchange is required');
            setLoading(false);
            return;
        }

        try {
            // Ensure empty strings are null for optional time fields if closed
            const payload = {
                ...formData,
                open_time: formData.open_time || null,
                close_time: formData.close_time || null
            };
            await ApiService.createExchangeHoliday(payload);
            setSuccess(true);
            setFormData({
                date: '',
                description: '',
                is_closed: true,
                open_time: '',
                close_time: '',
                exchange_id: 0
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create exchange holiday');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Exchange</Label>
                    <Select onValueChange={(val) => handleSelectChange('exchange_id', val)}>
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

                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="e.g. Christmas Day"
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
            {success && <p className="text-sm text-green-500">Exchange holiday created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFormData({
                    date: '', description: '', is_closed: true, open_time: '', close_time: '', exchange_id: 0
                })}>
                    Clear
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
