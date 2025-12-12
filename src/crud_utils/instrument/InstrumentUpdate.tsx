import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentUpdate, ExchangeInDb, SectorInDb, InstrumentTypeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';


interface InstrumentUpdateProps {
    initialInstrumentId?: number;
    onUpdateComplete?: () => void;
}

export function InstrumentUpdateComponent({ initialInstrumentId, onUpdateComplete }: InstrumentUpdateProps) {
    const [instrumentId, setInstrumentId] = useState<string>(initialInstrumentId ? initialInstrumentId.toString() : '');
    const [formData, setFormData] = useState<InstrumentUpdate>({
        symbol: '',
        name: '',
        exchange_id: null,
        instrument_type_id: null,
        sector_id: null,
        blacklisted: false,
        delisted: false
    });

    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [sectors, setSectors] = useState<SectorInDb[]>([]);
    const [types, setTypes] = useState<InstrumentTypeInDb[]>([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadRefs = async () => {
            const [exs, secs, typs] = await Promise.all([
                ApiService.getExchanges(),
                ApiService.getSectorList(),
                ApiService.getInstrumentTypes()
            ]);
            setExchanges(exs);
            setSectors(secs);
            setTypes(typs);
        };
        loadRefs();
    }, []);

    useEffect(() => {
        if (initialInstrumentId) {
            setInstrumentId(initialInstrumentId.toString());
            fetchInstrument(initialInstrumentId);
        }
    }, [initialInstrumentId]);

    const fetchInstrument = async (id: number) => {
        setFetching(true);
        setError(null);
        try {
            const inst = await ApiService.getInstrumentById(id);
            setFormData({
                symbol: inst.symbol,
                name: inst.name,
                exchange_id: inst.exchange_id,
                instrument_type_id: inst.instrument_type_id,
                sector_id: inst.sector_id,
                blacklisted: inst.blacklisted,
                delisted: inst.delisted
            });
            setLoaded(true);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch instrument');
            setLoaded(false);
        } finally {
            setFetching(false);
        }
    };

    const handleFetch = (e: React.FormEvent) => {
        e.preventDefault();
        if (instrumentId) {
            fetchInstrument(parseInt(instrumentId));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value === 'null' ? null : parseInt(value)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!instrumentId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.updateInstrument(parseInt(instrumentId), formData);
            setSuccess(true);
            if (onUpdateComplete) onUpdateComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to update instrument');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {!initialInstrumentId && (
                <form onSubmit={handleFetch} className="flex space-x-2 items-end mb-6">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="instrumentId">Instrument ID</Label>
                        <Input
                            id="instrumentId"
                            value={instrumentId}
                            onChange={(e) => {
                                setInstrumentId(e.target.value);
                                setLoaded(false);
                                setSuccess(false);
                            }}
                            placeholder="Enter ID"
                            type="number"
                        />
                    </div>
                    <Button type="submit" disabled={fetching || !instrumentId}>
                        {fetching ? '...' : 'Load'}
                    </Button>
                </form>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            {loaded && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="update-symbol">Symbol</Label>
                            <Input
                                id="update-symbol"
                                name="symbol"
                                value={formData.symbol || ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="update-inst-name">Name</Label>
                            <Input
                                id="update-inst-name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Exchange</Label>
                            <Select
                                value={formData.exchange_id?.toString()}
                                onValueChange={(val) => handleSelectChange('exchange_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Exchange" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exchanges.map(ex => (
                                        <SelectItem key={ex.id} value={ex.id.toString()}>
                                            {ex.name} ({ex.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.instrument_type_id?.toString()}
                                onValueChange={(val) => handleSelectChange('instrument_type_id', val)}
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

                        <div className="space-y-2 md:col-span-2">
                            <Label>Sector</Label>
                            <Select
                                value={formData.sector_id ? formData.sector_id.toString() : "null"}
                                onValueChange={(val) => handleSelectChange('sector_id', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Sector" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="null">None</SelectItem>
                                    {sectors.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-4 md:col-span-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="update-blacklisted"
                                    name="blacklisted"
                                    checked={formData.blacklisted || false}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="update-blacklisted">Blacklisted</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="update-delisted"
                                    name="delisted"
                                    checked={formData.delisted || false}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="update-delisted">Delisted</Label>
                            </div>
                        </div>
                    </div>

                    {success && <p className="text-sm text-green-500">Instrument updated successfully!</p>}

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => fetchInstrument(parseInt(instrumentId))}>
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

export default InstrumentUpdateComponent;
