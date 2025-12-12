import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentTypeCreate } from '../../shared/types/apiTypes';

export function InstrumentTypeCreateComponent() {
    const [formData, setFormData] = useState<InstrumentTypeCreate>({
        code: '',
        name: '',
        description: '',
        category: '',
        display_order: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'display_order' ? (value === '' ? null : parseInt(value)) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.createInstrumentType({
                ...formData,
                display_order: formData.display_order ? Number(formData.display_order) : null
            });
            setSuccess(true);
            setFormData({ code: '', name: '', description: '', category: '', display_order: null });
        } catch (err: any) {
            setError(err.message || 'Failed to create instrument type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        placeholder="EQ"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Equity"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                        id="category"
                        name="category"
                        value={formData.category || ''}
                        onChange={handleChange}
                        placeholder="Asset Class"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                        id="display_order"
                        name="display_order"
                        type="number"
                        value={formData.display_order || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                        placeholder="Description..."
                    />
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Instrument Type created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFormData({
                    code: '', name: '', description: '', category: '', display_order: null
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
