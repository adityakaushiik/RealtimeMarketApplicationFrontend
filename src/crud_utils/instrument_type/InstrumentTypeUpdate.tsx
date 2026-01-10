import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentTypeUpdate, InstrumentTypeInDb } from '../../shared/types/apiTypes';

export function InstrumentTypeUpdateComponent() {
    const [id, setId] = useState('');
    const [types, setTypes] = useState<InstrumentTypeInDb[]>([]);
    const [formData, setFormData] = useState<InstrumentTypeUpdate>({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const load = async () => {
             const list = await ApiService.getInstrumentTypes();
             setTypes(list);
        };
        load();
    }, []);

    const handleFetch = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(parseInt(id));
    };

    const fetchData = async (typeId: number) => {
        setFetching(true);
        setError(null);
        setSuccess(false);
        setLoaded(false);
        try {
            const data = await ApiService.getInstrumentTypeById(typeId);
            setFormData({
                code: data.code,
                name: data.name,
                description: data.description,
                category: data.category,
                display_order: data.display_order
            });
            setLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch instrument type');
        } finally {
            setFetching(false);
        }
    };

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
            await ApiService.updateInstrumentType(parseInt(id), {
                ...formData,
                display_order: formData.display_order ? Number(formData.display_order) : null
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to update instrument type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2 mb-6">
                <Label>Select Instrument Type to Update</Label>
                 <Select
                    value={id}
                    onValueChange={(val) => {
                        setId(val);
                        fetchData(parseInt(val));
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
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

            {error && <p className="text-sm text-red-500">{error}</p>}

            {loaded && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                name="code"
                                value={formData.code || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                value={formData.category || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                name="display_order"
                                type="number"
                                value={formData.display_order?.toString() || ''}
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
                            />
                        </div>
                    </div>

                    {success && <p className="text-sm text-green-500">Instrument Type updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => fetchData(parseInt(id))}>
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
