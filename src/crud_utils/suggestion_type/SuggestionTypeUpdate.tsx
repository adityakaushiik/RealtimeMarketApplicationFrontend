import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { SuggestionTypeInDb, SuggestionTypeUpdate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function SuggestionTypeUpdateComponent() {
    const [types, setTypes] = useState<SuggestionTypeInDb[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [formData, setFormData] = useState<SuggestionTypeUpdate>({
        name: '',
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            const data = await ApiService.getSuggestionTypes();
            setTypes(data);
        } catch (err) {
            console.error("Failed to load suggestion types", err);
        }
    };

    const handleSelectType = (id: string) => {
        setSelectedTypeId(id);
        const type = types.find(t => t.id.toString() === id);
        if (type) {
            setFormData({
                name: type.name,
                description: type.description
            });
            setError(null);
            setSuccess(false);
        }
    };

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

        if (!selectedTypeId) {
            setError('Please select a suggestion type to update');
            setLoading(false);
            return;
        }

        try {
            await ApiService.updateSuggestionType(parseInt(selectedTypeId), formData);
            setSuccess(true);
            loadTypes(); // Refresh list
        } catch (err: any) {
            setError(err.message || 'Failed to update suggestion type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label>Select Suggestion Type</Label>
                <Select onValueChange={handleSelectType} value={selectedTypeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type to update" />
                    </SelectTrigger>
                    <SelectContent>
                        {types.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedTypeId && (
                <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
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
                            placeholder="Brief description"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-500">Suggestion Type updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
