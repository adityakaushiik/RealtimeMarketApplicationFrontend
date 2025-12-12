import React, { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ProviderCreate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';


export function ProviderCreateComponent() {
    const [formData, setFormData] = useState<ProviderCreate>({
        name: '',
        code: '',
        rate_limit: 0,
        credentials: {}
    });
    const [credentialsStr, setCredentialsStr] = useState('{}');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rate_limit' ? parseInt(value) || 0 : value
        }));
    };

    const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentialsStr(e.target.value);
        try {
            const parsed = JSON.parse(e.target.value);
            setFormData(prev => ({ ...prev, credentials: parsed }));
            setError(null);
        } catch (err) {
            // Don't set error immediately on typing, but validation will happen on submit
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            JSON.parse(credentialsStr); // Validate JSON
        } catch {
            setError('Invalid JSON in credentials');
            setLoading(false);
            return;
        }

        try {
            await ApiService.createProvider(formData);
            setSuccess(true);
            setFormData({ name: '', code: '', rate_limit: 0, credentials: {} });
            setCredentialsStr('{}');
        } catch (err: any) {
            setError(err.message || 'Failed to create provider');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rate_limit">Rate Limit</Label>
                    <Input
                        id="rate_limit"
                        name="rate_limit"
                        type="number"
                        value={formData.rate_limit || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="credentials">Credentials (JSON)</Label>
                    <Input
                        id="credentials"
                        name="credentials"
                        value={credentialsStr}
                        onChange={handleCredentialsChange}
                        placeholder="{}"
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Provider created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                    setFormData({ name: '', code: '', rate_limit: 0, credentials: {} });
                    setCredentialsStr('{}');
                }}>
                    Clear
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </form>
    );
}

export default ProviderCreateComponent;
