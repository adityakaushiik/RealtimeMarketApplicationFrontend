import React, { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { InstrumentUpdate, ExchangeInDb, SectorInDb, InstrumentTypeInDb, InstrumentInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";


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

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<InstrumentInDb[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await ApiService.searchInstruments(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(fetchSearchResults, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

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
                <div className="space-y-2 mb-6">
                    <Label>Search Instrument to Update</Label>
                    <div className="border rounded-md relative">
                        <Command shouldFilter={false} className="overflow-visible">
                            <CommandInput 
                                placeholder="Search by symbol or name..." 
                                value={searchQuery}
                                onValueChange={(val) => {
                                    setSearchQuery(val);
                                    setShowResults(true);
                                }}
                            />
                            {showResults && (searchResults.length > 0 || isSearching || searchQuery) && (
                                <CommandList className="absolute top-full z-10 w-full bg-popover text-popover-foreground border shadow-md max-h-[200px]">
                                    {isSearching && <div className="p-2 text-sm text-muted-foreground">Searching...</div>}
                                    {!isSearching && searchResults.length === 0 && searchQuery && <CommandEmpty>No results found.</CommandEmpty>}
                                    <CommandGroup>
                                        {searchResults.map((instrument) => (
                                            <CommandItem
                                                key={instrument.id}
                                                value={`${instrument.symbol}-${instrument.id}`}
                                                onSelect={() => {
                                                    setInstrumentId(instrument.id.toString());
                                                    setSearchQuery(instrument.symbol); 
                                                    setShowResults(false);
                                                    fetchInstrument(instrument.id);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        instrumentId === instrument.id.toString() ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{instrument.symbol}</span>
                                                    <span className="text-xs text-muted-foreground">{instrument.name}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            )}
                        </Command>
                    </div>
                </div>
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
