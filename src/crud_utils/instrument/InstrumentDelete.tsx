import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command';
import type { InstrumentInDb } from '../../shared/types/apiTypes';
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface InstrumentDeleteProps {
    initialInstrumentId?: number;
    onDeleteComplete?: () => void;
}

export function InstrumentDeleteComponent({ initialInstrumentId, onDeleteComplete }: InstrumentDeleteProps) {
    const [id, setId] = useState(initialInstrumentId ? initialInstrumentId.toString() : '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

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
                <p className="text-sm text-muted-foreground">Search for the instrument you want to delete.</p>
            </div>

            <div className="space-y-4">
                {!initialInstrumentId ? (
                    <div className="space-y-2 relative">
                        <Label>Search Instrument</Label>
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
                                                        setId(instrument.id.toString());
                                                        setSearchQuery(instrument.symbol); 
                                                        setShowResults(false);
                                                        setSuccess(false);
                                                        setError(null);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            id === instrument.id.toString() ? "opacity-100" : "opacity-0"
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
