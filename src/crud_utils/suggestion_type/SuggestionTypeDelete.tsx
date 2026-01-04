import { useState, useEffect } from 'react';
import { ApiService } from '../../shared/services/apiService';
import type { SuggestionTypeInDb } from '../../shared/types/apiTypes';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog";

export function SuggestionTypeDeleteComponent() {
    const [types, setTypes] = useState<SuggestionTypeInDb[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            const data = await ApiService.getSuggestionTypes();
            setTypes(data);
        } catch (err) {
            console.error("Failed to load suggestion types", err);
        }
    };

    const handleDelete = async () => {
        if (!selectedTypeId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await ApiService.deleteSuggestionType(parseInt(selectedTypeId));
            setSuccess(true);
            setSelectedTypeId('');
            await loadTypes();
        } catch (err: any) {
            setError(err.message || 'Failed to delete suggestion type');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label>Select Suggestion Type to Delete</Label>
                <Select onValueChange={setSelectedTypeId} value={selectedTypeId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">Suggestion Type deleted successfully!</p>}

            <div className="flex justify-end pt-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!selectedTypeId || loading}>
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the suggestion type.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
