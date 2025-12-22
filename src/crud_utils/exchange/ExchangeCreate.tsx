import React, { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeCreate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface ExchangeCreateProps {
    onSuccess?: () => void;
}

export function ExchangeCreateComponent({ onSuccess }: ExchangeCreateProps) {
    const [formData, setFormData] = useState<ExchangeCreate>({
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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const payload: ExchangeCreate = {
                name: formData.name,
                code: formData.code,
                timezone: formData.timezone || null,
                country: formData.country || null,
                currency: formData.currency || null,
                pre_market_open_time: formData.pre_market_open_time || null,
                market_open_time: formData.market_open_time || null,
                market_close_time: formData.market_close_time || null,
                post_market_close_time: formData.post_market_close_time || null
            };
            await ApiService.createExchange(payload);
            setSuccess(true);
            setFormData({
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
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create exchange');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="National Stock Exchange"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                        id="code"
                        name="code"
                        placeholder="NSE"
                        value={formData.code}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                        id="timezone"
                        name="timezone"
                        placeholder="Asia/Kolkata"
                        value={formData.timezone || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                        id="country"
                        name="country"
                        placeholder="India"
                        value={formData.country || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                        id="currency"
                        name="currency"
                        placeholder="INR"
                        value={formData.currency || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Trading Hours</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pre_market_open_time">Pre-Market Open</Label>
                        <Input
                            id="pre_market_open_time"
                            name="pre_market_open_time"
                            type="time"
                            value={formData.pre_market_open_time || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="market_open_time">Market Open</Label>
                        <Input
                            id="market_open_time"
                            name="market_open_time"
                            type="time"
                            value={formData.market_open_time || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="market_close_time">Market Close</Label>
                        <Input
                            id="market_close_time"
                            name="market_close_time"
                            type="time"
                            value={formData.market_close_time || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="post_market_close_time">Post-Market Close</Label>
                        <Input
                            id="post_market_close_time"
                            name="post_market_close_time"
                            type="time"
                            value={formData.post_market_close_time || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Exchange created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFormData({
                    name: '', code: '', timezone: '', country: '', currency: '',
                    pre_market_open_time: '', market_open_time: '', market_close_time: '', post_market_close_time: ''
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

export default ExchangeCreateComponent;
