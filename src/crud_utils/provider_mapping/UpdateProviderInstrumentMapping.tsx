import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ProviderInDb, ProviderInstrumentMappingInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UpdateProviderInstrumentMappingProps {
    instrumentId: number;
    onSuccess?: () => void;
}

export function UpdateProviderInstrumentMapping({ instrumentId, onSuccess }: UpdateProviderInstrumentMappingProps) {
    const [mappings, setMappings] = useState<ProviderInstrumentMappingInDb[]>([]);
    const [providers, setProviders] = useState<ProviderInDb[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("");
    const [searchCode, setSearchCode] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [providersData, mappingsData] = await Promise.all([
                    ApiService.getProviders(),
                    ApiService.getInstrumentProviderMappings(instrumentId, true)
                ]);
                setProviders(providersData);
                setMappings(mappingsData);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load initial data");
            }
        };
        fetchData();
    }, [instrumentId]);

    const handleProviderSelect = (providerIdStr: string) => {
        setSelectedProviderId(providerIdStr);
        const mapping = mappings.find(m => m.provider_id === parseInt(providerIdStr));
        if (mapping) {
            setSearchCode(mapping.provider_instrument_search_code);
        } else {
            setSearchCode("");
        }
        setSuccess(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!selectedProviderId) {
            setError("Please select a provider");
            setLoading(false);
            return;
        }

        try {
            await ApiService.updateProviderInstrumentMapping({
                provider_id: parseInt(selectedProviderId),
                instrument_id: instrumentId,
                provider_instrument_search_code: searchCode
            });
            setSuccess(true);

            // Refresh mappings
            const newMappings = await ApiService.getInstrumentProviderMappings(instrumentId);
            setMappings(newMappings);

            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update mapping');
        } finally {
            setLoading(false);
        }
    };

    // Filter providers to only those that might have mappings or allow all?
    // The user wants to UPDATE mappings. It makes sense to only list providers that HAVE a mapping for this instrument?
    // Or maybe they want to upsert? The API name is "Update", implies existence.
    // Let's filter the provider list to only those present in 'mappings'.

    const mappedProviderIds = new Set(mappings.map(m => m.provider_id));
    const providersWithMappings = providers.filter(p => mappedProviderIds.has(p.id));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="provider">Select Provider to Update</Label>
                    <Select
                        onValueChange={handleProviderSelect}
                        value={selectedProviderId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providersWithMappings.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">No mappings found to update</div>
                            ) : (
                                providersWithMappings.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {mappings.length === 0 && (
                        <p className="text-xs text-muted-foreground">This instrument has no existing mappings. Use Create instead.</p>
                    )}
                </div>

                {selectedProviderId && (
                    <div className="space-y-2">
                        <Label htmlFor="code">Search Code</Label>
                        <Input
                            id="code"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value)}
                            required
                        />
                    </div>
                )}
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="text-green-600 border-green-200 bg-green-50"><AlertDescription>Mapping updated successfully!</AlertDescription></Alert>}

            <div className="flex justify-end">
                <Button type="submit" disabled={loading || !selectedProviderId}>
                    {loading ? 'Updating...' : 'Update Mapping'}
                </Button>
            </div>
        </form>
    );
}
