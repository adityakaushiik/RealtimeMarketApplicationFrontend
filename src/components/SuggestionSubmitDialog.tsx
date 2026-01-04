import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Lightbulb, Loader2 } from "lucide-react";
import { ApiService } from "@/shared/services/apiService";
import type { SuggestionTypeInDb } from "@/shared/types/apiTypes";

export function SuggestionSubmitDialog() {
    const [open, setOpen] = useState(false);
    const [types, setTypes] = useState<SuggestionTypeInDb[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [typeId, setTypeId] = useState<string>("");

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTypes();
        }
    }, [open]);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const data = await ApiService.getSuggestionTypes();
            setTypes(data);
        } catch (err) {
            console.error("Failed to fetch suggestion types", err);
            setError("Failed to load options. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !typeId) {
            setError("All fields are required.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await ApiService.createSuggestion({
                title,
                description,
                suggestion_type_id: parseInt(typeId)
            });
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                resetForm();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to submit suggestion.");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setTypeId("");
        setError(null);
        setSuccess(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Submit a Suggestion"
                    className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10 h-8 w-8 sm:h-9 sm:w-9 transition-all duration-300 transform hover:scale-105"
                >
                    <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Submit a Suggestion
                    </DialogTitle>
                    <DialogDescription>
                        We value your feedback! Let us know how we can improve.
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-6 text-center text-green-600 font-medium animate-in fade-in zoom-in duration-300">
                        <div className="mb-2">🎉</div>
                        Thank you for your suggestion!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Topic</Label>
                            <Select value={typeId} onValueChange={setTypeId} disabled={loading}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loading ? "Loading..." : "Select a topic"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {types.map((t) => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="Short summary"
                                value={title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your suggestion in detail..."
                                value={description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                className="min-h-[100px]"
                                disabled={submitting}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={submitting || loading} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Suggestion
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
