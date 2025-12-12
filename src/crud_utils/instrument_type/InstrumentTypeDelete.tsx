import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ApiService } from '../../shared/services/apiService';

export function InstrumentTypeDeleteComponent() {
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!window.confirm('Are you sure you want to delete this instrument type? This might affect associated instruments.')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteInstrumentType(parseInt(id));
            setSuccess(true);
            setId('');
        } catch (err: any) {
            setError(err.message || 'Failed to delete instrument type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleDelete} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="delete-type-id">Instrument Type ID</Label>
                <div className="flex space-x-2">
                    <Input
                        id="delete-type-id"
                        value={id}
                        onChange={(e) => {
                            setId(e.target.value);
                            setSuccess(false);
                        }}
                        placeholder="Enter ID to delete"
                        type="number"
                        required
                    />
                    <Button type="submit" variant="destructive" disabled={loading || !id}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Instrument Type deleted successfully!</p>}
        </form>
    );
}
