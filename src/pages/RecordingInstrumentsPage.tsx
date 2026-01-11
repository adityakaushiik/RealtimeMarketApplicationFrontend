import { useEffect, useState } from "react";
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb, ExchangeInDb } from "@/shared/types/apiTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export function RecordingInstrumentsPage() {
    const [instruments, setInstruments] = useState<InstrumentInDb[]>([]);
    const [exchanges, setExchanges] = useState<ExchangeInDb[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInstrument, setSelectedInstrument] = useState<InstrumentInDb | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [instData, exchData] = await Promise.all([
                ApiService.getRecordingInstruments(),
                ApiService.getExchanges()
            ]);
            setInstruments(instData);
            setExchanges(exchData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleClick = (instrument: InstrumentInDb) => {
        setSelectedInstrument(instrument);
        setDialogOpen(true);
    };

    const confirmToggle = async () => {
        if (!selectedInstrument) return;

        try {
            const updated = await ApiService.toggleInstrumentRecording(
                selectedInstrument.id,
                !selectedInstrument.should_record_data
            );

            // If the API returns only recording instruments, and we just disabled it, 
            // we should remove it from the list.
            if (!updated.should_record_data) {
                setInstruments(prev => prev.filter(i => i.id !== updated.id));
            } else {
                // If by some logic we are enabling (not typical for this specific page but good to handle), update it.
                setInstruments(prev => prev.map(inst =>
                    inst.id === updated.id ? updated : inst
                ));
            }

            setDialogOpen(false);
            setSelectedInstrument(null);
        } catch (error) {
            console.error("Failed to toggle recording", error);
        }
    };

    const getExchangeName = (id: number) => {
        return exchanges.find(e => e.id === id)?.name || id;
    };

    const filteredInstruments = instruments.filter(instrument =>
        instrument.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instrument.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <div className="flex items-center gap-2">
                        <h1 className="page-title">Recording Instruments</h1>
                        {!loading && (
                            <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-sm font-medium">
                                {instruments.length}
                            </span>
                        )}
                    </div>
                    <p className="page-subtitle">Manage instruments with active data recording.</p>
                </div>

                <div className="relative group shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-300" />
                    <Input
                        type="search"
                        placeholder="Search instruments..."
                        className="w-full sm:w-[260px] md:w-[320px] pl-10 h-10 bg-muted/30 hover:bg-muted/50 focus:bg-background border-border/40 focus:border-primary/30 rounded-xl transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/50 text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Symbol</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Exchange</TableHead>
                                <TableHead className="text-right">Recording</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredInstruments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        {instruments.length === 0 ? "No instruments are currently recording data." : "No matching instruments found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInstruments.map((inst) => (
                                    <TableRow key={inst.id}>
                                        <TableCell className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/stocks/${inst.symbol}`)}>
                                            {inst.symbol}
                                        </TableCell>
                                        <TableCell>{inst.name}</TableCell>
                                        <TableCell>{getExchangeName(inst.exchange_id)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end">
                                                <Switch
                                                    checked={inst.should_record_data}
                                                    onCheckedChange={() => handleToggleClick(inst)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedInstrument?.should_record_data ? "Disable Recording?" : "Enable Recording?"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedInstrument?.should_record_data
                                ? "Are you sure you want to disable recording? Warning: This will remove all existing recorded data for this instrument."
                                : "Are you sure you want to enable recording for this instrument?"}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant={selectedInstrument?.should_record_data ? "destructive" : "default"}
                            onClick={confirmToggle}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
