import { useState, useEffect } from "react";
import { ApiService } from "@/shared/services/apiService";
import type { SuggestionResponse } from "@/shared/types/apiTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, User, MessageSquare } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function UserSuggestionsPage() {
    const [suggestions, setSuggestions] = useState<SuggestionResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const data = await ApiService.getSuggestions();
            setSuggestions(data);
        } catch (error) {
            console.error("Failed to load suggestions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await ApiService.deleteSuggestion(deleteId);
            setSuggestions(suggestions.filter(s => s.id !== deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete suggestion", error);
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'secondary';
            case 'approved': return 'default'; // primary
            case 'rejected': return 'destructive';
            case 'implemented': return 'outline'; // or explicit green/blue
            default: return 'outline';
        }
    };

    return (
        <div className="page-container flex flex-col section-gap animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Suggestions Review</h1>
                <p className="text-muted-foreground mt-1">Review and manage feedback and suggestions submitted by users.</p>
            </div>

            <div className="flex flex-col gap-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading suggestions...</div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="text-lg font-semibold text-muted-foreground">No suggestions found</div>
                    </div>
                ) : (
                    suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="overflow-hidden bg-card hover:bg-accent/5 transition-colors border shadow-sm">
                            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start justify-between">
                                <div className="flex-1 min-w-0 space-y-3">
                                    {/* Header: Title and Type */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <h3 className="font-semibold text-lg tracking-tight truncate pr-2">
                                            {suggestion.title}
                                        </h3>
                                        <div className="flex gap-2 items-center">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {suggestion.suggestion_type?.name || 'Unknown Type'}
                                            </Badge>
                                            <Badge variant={getStatusBadgeVariant(suggestion.status)} className="capitalize">
                                                {suggestion.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {suggestion.description}
                                    </p>

                                    {/* Footer: User & Date */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5" />
                                            <span>
                                                {suggestion.user
                                                    ? `${suggestion.user.fname || ''} ${suggestion.user.lname || ''}`.trim() || suggestion.user.username
                                                    : 'Unknown User'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            <span>{format(new Date(suggestion.created_at), "PPP")}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action: Delete */}
                                <div className="flex items-center pl-2 pt-1 sm:pt-0">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(suggestion.id)}>
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Delete Suggestion</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to delete this suggestion? This action cannot be undone.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                                                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

export default UserSuggestionsPage;
