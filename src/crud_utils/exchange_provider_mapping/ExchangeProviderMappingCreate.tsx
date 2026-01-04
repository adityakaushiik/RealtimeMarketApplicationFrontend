import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeInDb, ProviderInDb, ExchangeProviderMappingCreate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

interface ExchangeProviderMappingCreateProps {
    onCreateComplete?: () => void;
}

export function ExchangeProviderMappingCreateComponent({ onCreateComplete }: ExchangeProviderMappingCreateProps) {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [providers, setProviders] = useState<ProviderInDb[]>([]);
    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [isPrimary, setIsPrimary] = useState<boolean>(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [exchangesData, providersData] = await Promise.all([
                    ApiService.getExchanges(),
                    ApiService.getProviders()
                ]);
                setExchanges(exchangesData);
                setProviders(providersData);
            } catch (err) {
                console.error('Failed to fetch data', err);
                setError('Failed to load exchanges or providers');
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExchangeId || !selectedProviderId) {
            setError('Please select both an exchange and a provider');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const providerId = parseInt(selectedProviderId);
            const exchangeId = parseInt(selectedExchangeId);

            const payload: ExchangeProviderMappingCreate = {
                provider_id: providerId,
                exchange_id: exchangeId,
                is_active: isActive,
                is_primary: isPrimary
            };

            await ApiService.addProviderToExchange(exchangeId, providerId, payload);
            setSuccess(true);
            // Reset form partly
            setSelectedProviderId('');
            if (onCreateComplete) onCreateComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to create mapping');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="exchangeSelect">Exchange</Label>
                    <Select value={selectedExchangeId} onValueChange={setSelectedExchangeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Exchange" />
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

                <div className="space-y-2">
                    <Label htmlFor="providerSelect">Provider</Label>
                    <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id.toString()}>
                                    {provider.name} ({provider.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_active"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked as boolean)}
                    />
                    <Label htmlFor="is_active">Is Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="is_primary"
                        checked={isPrimary}
                        onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                    />
                    <Label htmlFor="is_primary">Is Primary Provider</Label>
                </div>

                {success && <p className="text-sm text-green-500">Mapping created successfully!</p>}

                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Mapping'}
                </Button>
            </form>
        </div>
    );
}
