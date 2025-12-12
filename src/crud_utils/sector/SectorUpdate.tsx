import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { SectorUpdate } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';


interface SectorUpdateProps {
    initialSectorId?: number;
    onUpdateComplete?: () => void;
}

export function SectorUpdateComponent({ initialSectorId, onUpdateComplete }: SectorUpdateProps) {
    const [sectorId, setSectorId] = useState<string>(initialSectorId ? initialSectorId.toString() : '');
    const [formData, setFormData] = useState<SectorUpdate>({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (initialSectorId) {
            setSectorId(initialSectorId.toString());
            fetchSector(initialSectorId);
        }
    }, [initialSectorId]);

    const fetchSector = async (id: number) => {
        setFetching(true);
        setError(null);
        try {
            const sector = await ApiService.getSectorById(id);
            setFormData({
                name: sector.name,
                description: sector.description
            });
            setLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch sector');
            setLoaded(false);
        } finally {
            setFetching(false);
        }
    };

    const handleFetch = (e: React.FormEvent) => {
        e.preventDefault();
        if (sectorId) {
            fetchSector(parseInt(sectorId));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSectorId(e.target.value);
        setLoaded(false);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sectorId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.updateSector(parseInt(sectorId), formData);
            setSuccess(true);
            if (onUpdateComplete) onUpdateComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to update sector');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {!initialSectorId && (
                <form onSubmit={handleFetch} className="flex space-x-2 items-end mb-6">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="sectorId">Sector ID</Label>
                        <Input
                            id="sectorId"
                            value={sectorId}
                            onChange={handleIdChange}
                            placeholder="Enter ID"
                            type="number"
                        />
                    </div>
                    <Button type="submit" disabled={fetching || !sectorId}>
                        {fetching ? '...' : 'Load'}
                    </Button>
                </form>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {loaded && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="update-name">Name</Label>
                            <Input
                                id="update-name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-description">Description</Label>
                            <Input
                                id="update-description"
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {success && <p className="text-sm text-green-500">Sector updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => fetchSector(parseInt(sectorId))}>
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

export default SectorUpdateComponent;
