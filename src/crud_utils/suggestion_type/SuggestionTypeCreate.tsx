import React, { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { SuggestionTypeCreate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function SuggestionTypeCreateComponent() {
    const [formData, setFormData] = useState<SuggestionTypeCreate>({
        name: '',
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.name) {
            setError('Name is required');
            setLoading(false);
            return;
        }

        try {
            await ApiService.createSuggestionType(formData);
            setSuccess(true);
            setFormData({
                name: '',
                description: ''
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create suggestion type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Feature Request"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Brief description of the type"
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Suggestion Type created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFormData({ name: '', description: '' })}>
                    Clear
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
