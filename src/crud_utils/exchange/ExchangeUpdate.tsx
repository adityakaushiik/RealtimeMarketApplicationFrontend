import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeUpdate, ExchangeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

interface ExchangeUpdateProps {
    initialExchangeId?: number;
    onUpdateComplete?: () => void;
}

export function ExchangeUpdateComponent({ initialExchangeId, onUpdateComplete }: ExchangeUpdateProps) {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [selectedExchangeId, setSelectedExchangeId] = useState<string>(initialExchangeId ? initialExchangeId.toString() : '');
    const [formData, setFormData] = useState<ExchangeUpdate>({
        name: '',
        code: '',
        timezone: '',
        country: '',
        currency: '',
        pre_market_open_time: '',
        market_open_time: '',
        market_close_time: '',
        post_market_close_time: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loaded, setLoaded] = useState(false);

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

    useEffect(() => {
        if (initialExchangeId) {
            setSelectedExchangeId(initialExchangeId.toString());
            fetchExchange(initialExchangeId);
        }
    }, [initialExchangeId]);

    const fetchExchange = async (id: number) => {
        setFetching(true);
        setError(null);
        try {
            const exchange = await ApiService.getExchangeById(id);
            setFormData({
                name: exchange.name,
                code: exchange.code,
                timezone: exchange.timezone,
                country: exchange.country,
                currency: exchange.currency,
                pre_market_open_time: exchange.pre_market_open_time,
                market_open_time: exchange.market_open_time,
                market_close_time: exchange.market_close_time,
                post_market_close_time: exchange.post_market_close_time
            });
            setLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch exchange');
            setLoaded(false);
        } finally {
            setFetching(false);
        }
    };

    const handleSelectChange = (value: string) => {
        setSelectedExchangeId(value);
        setLoaded(false);
        setSuccess(false);
        if (value) {
            fetchExchange(parseInt(value));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExchangeId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const payload: ExchangeUpdate = {
                name: formData.name || null,
                code: formData.code || null,
                timezone: formData.timezone || null,
                country: formData.country || null,
                currency: formData.currency || null,
                pre_market_open_time: formData.pre_market_open_time || null,
                market_open_time: formData.market_open_time || null,
                market_close_time: formData.market_close_time || null,
                post_market_close_time: formData.post_market_close_time || null
            };
            await ApiService.updateExchange(parseInt(selectedExchangeId), payload);
            setSuccess(true);
            if (onUpdateComplete) onUpdateComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to update exchange');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {!initialExchangeId && (
                <div className="space-y-2 mb-6">
                    <Label htmlFor="exchangeSelect">Select Exchange</Label>
                    <Select value={selectedExchangeId} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an exchange to update" />
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
            )}

            {fetching && <p className="text-sm text-muted-foreground">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {loaded && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="update-name">Name</Label>
                            <Input
                                id="update-name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-code">Code</Label>
                            <Input
                                id="update-code"
                                name="code"
                                value={formData.code || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-timezone">Timezone</Label>
                            <Input
                                id="update-timezone"
                                name="timezone"
                                value={formData.timezone || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-country">Country</Label>
                            <Input
                                id="update-country"
                                name="country"
                                value={formData.country || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-currency">Currency</Label>
                            <Input
                                id="update-currency"
                                name="currency"
                                value={formData.currency || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-medium mb-3">Trading Hours</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="update-pre_market_open_time">Pre-Market Open</Label>
                                <Input
                                    id="update-pre_market_open_time"
                                    name="pre_market_open_time"
                                    type="time"
                                    value={formData.pre_market_open_time || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="update-market_open_time">Market Open</Label>
                                <Input
                                    id="update-market_open_time"
                                    name="market_open_time"
                                    type="time"
                                    value={formData.market_open_time || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="update-market_close_time">Market Close</Label>
                                <Input
                                    id="update-market_close_time"
                                    name="market_close_time"
                                    type="time"
                                    value={formData.market_close_time || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="update-post_market_close_time">Post-Market Close</Label>
                                <Input
                                    id="update-post_market_close_time"
                                    name="post_market_close_time"
                                    type="time"
                                    value={formData.post_market_close_time || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {success && <p className="text-sm text-green-500">Exchange updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => fetchExchange(parseInt(selectedExchangeId))}>
                            Reset
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default ExchangeUpdateComponent;
