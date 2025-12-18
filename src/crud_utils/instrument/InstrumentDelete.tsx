import { useState } from 'react';
import { ApiService } from '../../shared/services/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface InstrumentDeleteProps {
    initialInstrumentId?: number;
    onDeleteComplete?: () => void;
}

export function InstrumentDeleteComponent({ initialInstrumentId, onDeleteComplete }: InstrumentDeleteProps) {
    const [id, setId] = useState(initialInstrumentId ? initialInstrumentId.toString() : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleDelete = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteInstrument(parseInt(id));
            setSuccess(true);
            if (!initialInstrumentId) setId(''); // Only clear if not in fixed mode
            if (onDeleteComplete) onDeleteComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to delete instrument');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium">Delete Instrument</h3>
                <p className="text-sm text-muted-foreground">Enter the ID of the instrument you want to delete.</p>
            </div>

            <div className="space-y-4">
                {!initialInstrumentId ? (
                    <div className="space-y-2">
                        <Label htmlFor="delete-inst-id">Instrument ID</Label>
                        <Input
                            id="delete-inst-id"
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
                ) : (
                    <p className="font-medium text-destructive">
                        Are you sure you want to delete instrument ID {id}? This action cannot be undone.
                    </p>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">Instrument deleted successfully!</p>}

                <Button variant="destructive" onClick={handleDelete} disabled={loading || !id} className="w-full">
                    {loading ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </div>
    );
}

export default InstrumentDeleteComponent;
