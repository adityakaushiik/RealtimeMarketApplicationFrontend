import { useState, useEffect } from "react";
import { ApiService } from "@/shared/services/apiService";
import type { SuggestionInDb } from "@/shared/types/apiTypes";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function UserSuggestionsPage() {
    const [suggestions, setSuggestions] = useState<SuggestionInDb[]>([]);
    const [loading, setLoading] = useState(true);

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

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'secondary';
            case 'approved': return 'default'; // primary
            case 'rejected': return 'destructive';
            case 'implemented': return 'outline'; // or explicit green if available
            default: return 'outline';
        }
    };

    return (
        <div className="page-container flex flex-col section-gap">
            <h1 className="text-3xl font-bold tracking-tight">User Suggestions Review</h1>

            <Card>
                <CardHeader>
                    <CardTitle>All Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-4">Loading suggestions...</div>
                    ) : suggestions.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No suggestions found.</div>
                    ) : (
                        <Table>
                            <TableCaption>A list of all user suggestions.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type ID</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions.map((suggestion) => (
                                    <TableRow key={suggestion.id}>
                                        <TableCell className="font-medium">{suggestion.id}</TableCell>
                                        <TableCell>{suggestion.title}</TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={suggestion.description}>
                                            {suggestion.description}
                                        </TableCell>
                                        <TableCell>{suggestion.suggestion_type_id}</TableCell>
                                        <TableCell>{suggestion.user_id}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(suggestion.status)}>
                                                {suggestion.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {format(new Date(suggestion.created_at), "PP")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default UserSuggestionsPage;
