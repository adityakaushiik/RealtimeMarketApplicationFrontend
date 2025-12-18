import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ProviderInstrumentMappingCreate, ProviderInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateProviderInstrumentMappingProps {
    instrumentId: number;
    onSuccess?: () => void;
}

export function CreateProviderInstrumentMapping({ instrumentId, onSuccess }: CreateProviderInstrumentMappingProps) {
    const [providers, setProviders] = useState<ProviderInDb[]>([]);
    const [formData, setFormData] = useState<Omit<ProviderInstrumentMappingCreate, 'instrument_id'>>({
        provider_id: 0,
        provider_instrument_search_code: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const data = await ApiService.getProviders();
                setProviders(data);
            } catch (err) {
                console.error("Failed to fetch providers", err);
                setError("Failed to load providers");
            }
        };
        fetchProviders();
    }, []);

    const handleChange = (val: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'provider_id' ? parseInt(val) : val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (formData.provider_id === 0) {
            setError("Please select a provider");
            setLoading(false);
            return;
        }

        try {
            await ApiService.createProviderInstrumentMapping({
                ...formData,
                instrument_id: instrumentId
            });
            setSuccess(true);
            setFormData(prev => ({ ...prev, provider_instrument_search_code: '' }));
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create mapping');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                        onValueChange={(val) => handleChange(val, 'provider_id')}
                        value={formData.provider_id ? formData.provider_id.toString() : ""}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">Search Code</Label>
                    <Input
                        id="code"
                        value={formData.provider_instrument_search_code}
                        onChange={(e) => handleChange(e.target.value, 'provider_instrument_search_code')}
                        required
                        placeholder="e.g. AAPL.US"
                    />
                </div>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="text-green-600 border-green-200 bg-green-50"><AlertDescription>Mapping created successfully!</AlertDescription></Alert>}

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Mapping'}
                </Button>
            </div>
        </form>
    );
}
