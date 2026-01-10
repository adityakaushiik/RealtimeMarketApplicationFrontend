import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentTypeInDb } from '../../shared/types/apiTypes';

export function InstrumentTypeDeleteComponent() {
    const [id, setId] = useState('');
    const [types, setTypes] = useState<InstrumentTypeInDb[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const load = async () => {
             const list = await ApiService.getInstrumentTypes();
             setTypes(list);
        };
        load();
    }, []);

    const handleDelete = async () => {
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
            const list = await ApiService.getInstrumentTypes();
            setTypes(list);
        } catch (err: any) {
            setError(err.message || 'Failed to delete instrument type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Select Instrument Type to Delete</Label>
                <div className="flex space-x-2">
                     <div className="flex-1">
                        <Select
                            value={id}
                            onValueChange={(val) => {
                                setId(val);
                                setSuccess(false);
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
                    <Button onClick={handleDelete} variant="destructive" disabled={loading || !id}>
                        {loading ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Instrument Type deleted successfully!</p>}
        </div>
    );
}
