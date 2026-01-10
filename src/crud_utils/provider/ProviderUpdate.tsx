import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ProviderUpdate, ProviderInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';


interface ProviderUpdateProps {
    initialProviderId?: number;
    onUpdateComplete?: () => void;
}

export function ProviderUpdateComponent({ initialProviderId, onUpdateComplete }: ProviderUpdateProps) {
    const [providerId, setProviderId] = useState<string>(initialProviderId ? initialProviderId.toString() : '');
    const [providers, setProviders] = useState<ProviderInDb[]>([]);
    const [formData, setFormData] = useState<ProviderUpdate>({
        name: '',
        code: '',
        rate_limit: 0,
        credentials: {},
        is_active: true
    });
    const [credentialsStr, setCredentialsStr] = useState('{}');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadList = async () => {
            try {
                const list = await ApiService.getProviders();
                setProviders(list);
            } catch (error) {
                console.error("Failed to load providers", error);
            }
        };
        loadList();
    }, []);

    useEffect(() => {
        if (initialProviderId) {
            setProviderId(initialProviderId.toString());
            fetchProvider(initialProviderId);
        }
    }, [initialProviderId]);

    const fetchProvider = async (id: number) => {
        setFetching(true);
        setError(null);
        try {
            const provider = await ApiService.getProviderById(id);
            setFormData({
                name: provider.name,
                code: provider.code,
                rate_limit: provider.rate_limit,
                credentials: provider.credentials,
                is_active: provider.is_active
            });
            setCredentialsStr(JSON.stringify(provider.credentials || {}));
            setLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch provider');
            setLoaded(false);
        } finally {
            setFetching(false);
        }
    };

    const handleFetch = (e: React.FormEvent) => {
        e.preventDefault();
        if (providerId) {
            fetchProvider(parseInt(providerId));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'rate_limit' ? parseInt(value) || 0 : value)
        }));
    };

    const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentialsStr(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData(prev => ({ ...prev, credentials: parsed }));
            setError(null);
        } catch (err) {
            // Validation on submit
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!providerId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            JSON.parse(credentialsStr);
        } catch {
            setError('Invalid JSON in credentials');
            setLoading(false);
            return;
        }

        try {
            await ApiService.updateProvider(parseInt(providerId), formData);
            setSuccess(true);
            if (onUpdateComplete) onUpdateComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to update provider');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="space-y-4">
            {!initialProviderId && (
                <div className="space-y-2 mb-6">
                    <Label>Select Provider to Update</Label>
                    <Select
                        value={providerId}
                        onValueChange={(val) => {
                            setProviderId(val);
                            fetchProvider(parseInt(val));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
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
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {loaded && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Label htmlFor="update-rate_limit">Rate Limit</Label>
                            <Input
                                id="update-rate_limit"
                                name="rate_limit"
                                type="number"
                                value={formData.rate_limit || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-credentials">Credentials (JSON)</Label>
                            <Input
                                id="update-credentials"
                                name="credentials"
                                value={credentialsStr}
                                onChange={handleCredentialsChange}
                            />
                        </div>
                        <div className="flex items-center space-x-2 md:col-span-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                name="is_active"
                                checked={formData.is_active || false}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_active">Is Active</Label>
                        </div>
                    </div>

                    {success && <p className="text-sm text-green-500">Provider updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => fetchProvider(parseInt(providerId))}>
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

export default ProviderUpdateComponent;
