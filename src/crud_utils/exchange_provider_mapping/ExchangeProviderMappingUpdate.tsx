import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeInDb, ProviderInDb, ExchangeProviderMappingInDb, ExchangeProviderMappingUpdate } from '../../shared/types/apiTypes';
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

export function ExchangeProviderMappingUpdateComponent() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [providers, setProviders] = useState<ProviderInDb[]>([]); // All providers for lookup
    const [mappings, setMappings] = useState<ExchangeProviderMappingInDb[]>([]); // Mappings for selected exchange

    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');

    const [isActive, setIsActive] = useState<boolean>(false);
    const [isPrimary, setIsPrimary] = useState<boolean>(false);

    const [loading, setLoading] = useState(false);
    const [fetchingMappings, setFetchingMappings] = useState(false);
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
                console.error('Failed to fetch initial data', err);
                setError('Failed to load exchanges or providers');
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedExchangeId) {
            fetchMappings(parseInt(selectedExchangeId));
            setSelectedProviderId(''); // Reset selected provider when exchange changes
            setSuccess(false);
        } else {
            setMappings([]);
        }
    }, [selectedExchangeId]);

    const fetchMappings = async (exchangeId: number) => {
        setFetchingMappings(true);
        try {
            const data = await ApiService.getProvidersForExchange(exchangeId);
            setMappings(data);
        } catch (err) {
            console.error('Failed to fetch mappings', err);
            setError('Failed to fetch providers for this exchange');
        } finally {
            setFetchingMappings(false);
        }
    };

    const handleProviderSelect = (providerIdStr: string) => {
        setSelectedProviderId(providerIdStr);
        setSuccess(false);
        const mapping = mappings.find(m => m.provider_id.toString() === providerIdStr);
        if (mapping) {
            setIsActive(mapping.is_active);
            setIsPrimary(mapping.is_primary);
        }
    };

    const getProviderName = (id: number) => {
        const provider = providers.find(p => p.id === id);
        return provider ? `${provider.name} (${provider.code})` : `Provider #${id}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExchangeId || !selectedProviderId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const providerId = parseInt(selectedProviderId);
            const exchangeId = parseInt(selectedExchangeId);

            const payload: ExchangeProviderMappingUpdate = {
                is_active: isActive,
                is_primary: isPrimary
            };

            await ApiService.updateProviderExchangeMapping(exchangeId, providerId, payload);
            setSuccess(true);
            // Refresh mappings to reflect changes (though local state is arguably fresh enough, best to sync)
            fetchMappings(exchangeId);
        } catch (err: any) {
            setError(err.message || 'Failed to update mapping');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="space-y-2">
                <Label htmlFor="exchangeSelect">Select Exchange</Label>
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

            {selectedExchangeId && (
                <div className="space-y-2">
                    <Label htmlFor="providerSelect">Select Provider to Update</Label>
                    <Select value={selectedProviderId} onValueChange={handleProviderSelect}>
                        <SelectTrigger>
                            <SelectValue placeholder={fetchingMappings ? "Loading..." : "Select Provider"} />
                        </SelectTrigger>
                        <SelectContent>
                            {mappings.map((mapping) => (
                                <SelectItem key={mapping.provider_id} value={mapping.provider_id.toString()}>
                                    {getProviderName(mapping.provider_id)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {mappings.length === 0 && !fetchingMappings && (
                        <p className="text-sm text-muted-foreground">No providers mapped to this exchange yet.</p>
                    )}
                </div>
            )}

            {selectedExchangeId && selectedProviderId && (
                <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md">
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

                    {success && <p className="text-sm text-green-500">Mapping updated successfully!</p>}

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Mapping'}
                    </Button>
                </form>
            )}
        </div>
    );
}
