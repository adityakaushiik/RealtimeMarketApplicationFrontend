import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentCreate, ExchangeInDb, SectorInDb, InstrumentTypeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';


export function InstrumentCreateComponent() {
    const [formData, setFormData] = useState<InstrumentCreate>({
        symbol: '',
        name: '',
        exchange_id: 0,
        instrument_type_id: 0,
        sector_id: null,
        blacklisted: false,
        delisted: false,
        should_record_data: true
    });
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [sectors, setSectors] = useState<SectorInDb[]>([]);
    const [types, setTypes] = useState<InstrumentTypeInDb[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadRefs = async () => {
            try {
                const [exs, secs, typs] = await Promise.all([
                    ApiService.getExchanges(),
                    ApiService.getSectorList(),
                    ApiService.getInstrumentTypes()
                ]);
                setExchanges(exs);
                setSectors(secs);
                setTypes(typs);
            } catch (err) {
                console.error("Failed to load references", err);
            }
        };
        loadRefs();
    }, []);

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
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.exchange_id || !formData.instrument_type_id) {
            setError('Exchange and Instrument Type are required');
            setLoading(false);
            return;
        }

        try {
            await ApiService.createInstrument(formData);
            setSuccess(true);
            setFormData({
                symbol: '',
                name: '',
                exchange_id: 0,
                instrument_type_id: 0,
                sector_id: null,
                blacklisted: false,
                delisted: false,
                should_record_data: true
            });
        } catch (err: any) {
            setError(err.message || 'Failed to create instrument');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                        id="symbol"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleChange}
                        required
                        placeholder="AAPL"
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
                        placeholder="Apple Inc."
                    />
                </div>

                <div className="space-y-2">
                    <Label>Exchange</Label>
                    <Select onValueChange={(val) => handleSelectChange('exchange_id', val)}>
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
                    <Select onValueChange={(val) => handleSelectChange('instrument_type_id', val)}>
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
                    <Label>Sector (Optional)</Label>
                    <Select onValueChange={(val) => handleSelectChange('sector_id', val)}>
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
                            id="create-blacklisted"
                            name="blacklisted"
                            checked={formData.blacklisted || false}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="create-blacklisted">Blacklisted</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="create-delisted"
                            name="delisted"
                            checked={formData.delisted || false}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="create-delisted">Delisted</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="create-should-record"
                            name="should_record_data"
                            checked={formData.should_record_data || false}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="create-should-record">Record Data</Label>
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Instrument created successfully!</p>}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setFormData({
                    symbol: '', name: '', exchange_id: 0, instrument_type_id: 0, sector_id: null, blacklisted: false, delisted: false, should_record_data: true
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

export default InstrumentCreateComponent;
