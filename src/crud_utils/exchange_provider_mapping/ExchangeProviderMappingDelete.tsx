import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ExchangeInDb, ProviderInDb, ExchangeProviderMappingInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';

export function ExchangeProviderMappingDeleteComponent() {
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [providers, setProviders] = useState<ProviderInDb[]>([]); // All providers for lookup
    const [mappings, setMappings] = useState<ExchangeProviderMappingInDb[]>([]); // Mappings for selected exchange

    const [selectedExchangeId, setSelectedExchangeId] = useState<string>('');
    const [selectedProviderId, setSelectedProviderId] = useState<string>('');

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

    const getProviderName = (id: number) => {
        const provider = providers.find(p => p.id === id);
        return provider ? `${provider.name} (${provider.code})` : `Provider #${id}`;
    };

    const handleDelete = async () => {
        if (!selectedExchangeId || !selectedProviderId) return;

        if (!window.confirm("Are you sure you want to remove this provider from the exchange?")) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const providerId = parseInt(selectedProviderId);
            const exchangeId = parseInt(selectedExchangeId);

            await ApiService.removeProviderFromExchange(exchangeId, providerId);
            setSuccess(true);
            setSelectedProviderId('');
            fetchMappings(exchangeId);
        } catch (err: any) {
            setError(err.message || 'Failed to remove mapping');
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
                    <Label htmlFor="providerSelect">Select Provider to Remove</Label>
                    <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
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
                <div className="border p-4 rounded-md space-y-4">
                    <p className="text-sm">
                        You are about to remove <strong>{getProviderName(parseInt(selectedProviderId))}</strong> from
                        <strong> {exchanges.find(e => e.id.toString() === selectedExchangeId)?.name}</strong>.
                    </p>

                    {success && <p className="text-sm text-green-500">Mapping removed successfully!</p>}

                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading ? 'Removing...' : 'Remove Mapping'}
                    </Button>
                </div>
            )}
        </div>
    );
}
