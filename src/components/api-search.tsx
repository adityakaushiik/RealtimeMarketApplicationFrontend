import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useDebounce } from "../shared/utils/hooks/debounce-search";
import { ApiService } from '../shared/services/apiService';
import type { InstrumentInDb } from '../shared/types/apiTypes';
import { useAppStore } from '../shared/store/appStore';

interface ApiSearchProps {
    onSelect: (instrument: InstrumentInDb) => void;
    selectedId?: string | number;
    placeholder?: string;
    className?: string;
}

export function ApiSearch({ onSelect, selectedId, placeholder = "Search by symbol or name...", className }: ApiSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<InstrumentInDb[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const { selectedExchange } = useAppStore();

    // Use debounced search query with 500ms delay
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!debouncedSearchQuery.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const results = await ApiService.searchInstruments(debouncedSearchQuery, selectedExchange || undefined);
                setSearchResults(results);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsSearching(false);
            }
        };

        fetchSearchResults();
    }, [debouncedSearchQuery]);

    const handleSelect = (instrument: InstrumentInDb) => {
        setSearchQuery(instrument.symbol); // Set input to selected symbol
        setShowResults(false);
        onSelect(instrument);
    };

    return (
        <div className={cn("border rounded-md relative", className)}>
            <Command shouldFilter={false} className="overflow-visible">
                <CommandInput
                    placeholder={placeholder}
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
                                    onSelect={() => handleSelect(instrument)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedId?.toString() === instrument.id.toString() ? "opacity-100" : "opacity-0"
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
    );
}
