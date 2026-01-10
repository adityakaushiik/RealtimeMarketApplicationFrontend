import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { ProviderInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

export function ProviderDeleteComponent() {
    const [id, setId] = useState('');
    const [providers, setProviders] = useState<ProviderInDb[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const load = async () => {
             try {
                 const list = await ApiService.getProviders();
                 setProviders(list);
             } catch (e) {
                 console.error(e);
             }
        };
        load();
    }, []);

    const handleDelete = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteProvider(parseInt(id));
            setSuccess(true);
            setId('');
        } catch (err: any) {
            setError(err.message || 'Failed to delete provider');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium">Delete Provider</h3>
                <p className="text-sm text-muted-foreground">Select the provider you want to delete.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Provider to Delete</Label>
                    <Select
                        value={id}
                        onValueChange={(val) => {
                            setId(val);
                            setSuccess(false);
                            setError(null);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name} (ID: {p.id})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">Provider deleted successfully!</p>}

                <Button variant="destructive" onClick={handleDelete} disabled={loading || !id} className="w-full">
                    {loading ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </div>
    );
}

export default ProviderDeleteComponent;
