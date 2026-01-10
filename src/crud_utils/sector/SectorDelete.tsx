import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { SectorInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';


export function SectorDeleteComponent() {
    const [id, setId] = useState('');
    const [sectors, setSectors] = useState<SectorInDb[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const load = async () => {
             const list = await ApiService.getSectorList();
             setSectors(list);
        };
        load();
    }, []);

    const handleDelete = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteSector(parseInt(id));
            setSuccess(true);
            setId('');
        } catch (err: any) {
            setError(err.message || 'Failed to delete sector');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="space-y-2 mb-4">
                <h3 className="text-lg font-medium">Delete Sector</h3>
                <p className="text-sm text-muted-foreground">Select the sector you want to delete.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Select Sector to Delete</Label>
                    <Select
                        value={id}
                        onValueChange={(val) => {
                            setId(val);
                            setSuccess(false);
                            setError(null);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Sector" />
                        </SelectTrigger>
                        <SelectContent>
                            {sectors.map(s => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">Sector deleted successfully!</p>}

                <Button variant="destructive" onClick={handleDelete} disabled={loading || !id} className="w-full">
                    {loading ? 'Deleting...' : 'Delete'}
                </Button>
            </div>
        </div>
    );
}

export default SectorDeleteComponent;
