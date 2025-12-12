import { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export function ProviderDeleteComponent() {
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
                <p className="text-sm text-muted-foreground">Enter the ID of the provider you want to delete.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="delete-provider-id">Provider ID</Label>
                    <Input
                        id="delete-provider-id"
                        value={id}
                        onChange={(e) => {
                            setId(e.target.value);
                            setSuccess(false);
                            setError(null);
                        }}
                        type="number"
                        placeholder="ID"
                    />
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
