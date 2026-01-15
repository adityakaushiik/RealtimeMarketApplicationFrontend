import { useParams } from "react-router-dom";
import Chart from "@/components/Chart";
import { useEffect, useState } from 'react';
import { ApiService } from "@/shared/services/apiService";
import type { InstrumentInDb /*, ProviderInstrumentMappingInDb */ } from "@/shared/types/apiTypes";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CreateProviderInstrumentMapping } from "@/crud_utils/provider_mapping/CreateProviderInstrumentMapping";
import { UpdateProviderInstrumentMapping } from "@/crud_utils/provider_mapping/UpdateProviderInstrumentMapping";
import { InstrumentUpdateComponent } from "@/crud_utils/instrument/InstrumentUpdate";
import { InstrumentDeleteComponent } from "@/crud_utils/instrument/InstrumentDelete";
import { AddToWatchlistDialog } from "@/components/AddToWatchlistDialog";

export function StockDetailPage() {
    const { symbol } = useParams<{ symbol: string }>();
    const [instrument, setInstrument] = useState<InstrumentInDb | null>(null);
    // const [mappings, setMappings] = useState<ProviderInstrumentMappingInDb[]>([]); // Commented out
    const [openDialog, setOpenDialog] = useState<'create' | 'update' | 'update_instrument' | 'delete_instrument' | null>(null);
    const [confirmRecordingToggle, setConfirmRecordingToggle] = useState(false);

    const [currency, setCurrency] = useState<string>('');

    const user = ApiService.getCurrentUser();
    // Assuming role_id 1 is Admin.
    const isAdmin = user?.role_id === 1;

    useEffect(() => {
        const fetchInstrumentDetails = async () => {
            if (!symbol) return;
            try {
                const found = await ApiService.getInstrumentBySymbol(symbol);

                if (found) {
                    setInstrument(found);
                    try {
                        // const m = await ApiService.getInstrumentProviderMappings(found.id);
                        // setMappings(m);
                    } catch (e) {
                        console.error("Failed to fetch mappings", e);
                    }

                    try {
                        const exchange = await ApiService.getExchangeById(found.exchange_id);
                        setCurrency(exchange.currency || '');
                    } catch (e) {
                        console.error("Failed to fetch exchange details", e);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch instrument details:", error);
            }
        };
        fetchInstrumentDetails();
    }, [symbol]);

    if (!symbol) {
        return <div>Invalid stock symbol</div>;
    }

    return (
        <div className="page-container flex flex-col section-gap">
            <div className="page-header-row">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">{symbol}</h1>
                    <p className="page-subtitle">
                        {instrument ? instrument.name : "Real-time market data"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {instrument && (
                        <AddToWatchlistDialog instrumentId={instrument.id} symbol={instrument.symbol} exchangeId={instrument.exchange_id} />
                    )}
                    {isAdmin && instrument && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setOpenDialog('create')}>
                                        Create Instrument Mappings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setOpenDialog('update')}>
                                        Update Instrument Mappings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setConfirmRecordingToggle(true)}>
                                        {instrument.should_record_data ? "Disable Recording" : "Enable Recording"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setOpenDialog('update_instrument')}>
                                        Update Instrument
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setOpenDialog('delete_instrument')} className="text-red-600">
                                        Delete Instrument
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Dialog open={openDialog === 'create'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Create Provider Instrument Mapping</DialogTitle>
                                    </DialogHeader>
                                    <CreateProviderInstrumentMapping
                                        instrumentId={instrument.id}
                                        onSuccess={() => {
                                            // ApiService.getInstrumentProviderMappings(instrument.id).then(setMappings);
                                            setOpenDialog(null);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openDialog === 'update'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update Provider Instrument Mapping</DialogTitle>
                                    </DialogHeader>
                                    <UpdateProviderInstrumentMapping
                                        instrumentId={instrument.id}
                                        onSuccess={() => {
                                            // ApiService.getInstrumentProviderMappings(instrument.id).then(setMappings);
                                            setOpenDialog(null);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openDialog === 'update_instrument'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Update Instrument</DialogTitle>
                                    </DialogHeader>
                                    <InstrumentUpdateComponent
                                        initialInstrumentId={instrument.id}
                                        onUpdateComplete={() => {
                                            // Refresh instrument details
                                            ApiService.getInstrumentById(instrument.id).then(setInstrument);
                                            setOpenDialog(null);
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={openDialog === 'delete_instrument'} onOpenChange={(open) => !open && setOpenDialog(null)}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Delete Instrument</DialogTitle>
                                    </DialogHeader>
                                    <InstrumentDeleteComponent
                                        initialInstrumentId={instrument.id}
                                        onDeleteComplete={() => {
                                            setOpenDialog(null);
                                            // Navigate back to home or search page since instrument is gone
                                            window.location.href = '/';
                                        }}
                                    />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={confirmRecordingToggle} onOpenChange={setConfirmRecordingToggle}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {instrument.should_record_data ? "Disable Recording?" : "Enable Recording?"}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {instrument.should_record_data
                                                ? "Are you sure you want to disable recording? Warning: This will remove all existing recorded data for this instrument."
                                                : "Are you sure you want to enable recording for this instrument?"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setConfirmRecordingToggle(false)}>Cancel</Button>
                                        <Button variant={instrument.should_record_data ? "destructive" : "default"} onClick={async () => {
                                            try {
                                                const updated = await ApiService.toggleInstrumentRecording(instrument.id, !instrument.should_record_data);
                                                setInstrument(updated);
                                                setConfirmRecordingToggle(false);
                                            } catch (error) {
                                                console.error("Failed to toggle recording:", error);
                                            }
                                        }}>
                                            Confirm
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
            </div>

            <Chart symbol={symbol} currency={currency} />

            {/* {
                mappings.length > 0 && (
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg">Provider Mappings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                            <div className="flex flex-wrap gap-2">
                                {mappings.map((m, idx) => (
                                    <div key={idx} className="bg-muted px-2 sm:px-3 py-1 rounded text-xs sm:text-sm">
                                        <span className="font-semibold">ID {m.provider_id}:</span> {m.provider_instrument_search_code}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            } */}

            {/* <div className="stats-grid">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                            Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {instrument ? (instrument.delisted ? "Delisted" : (!instrument.is_active ? "Inactive" : "Active")) : "--"}
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {instrument ? (instrument.blacklisted ? "Blacklisted" : "Tradable") : ""}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                            Type ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-bold">{instrument?.instrument_type_id || "--"}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Instrument Type
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                            Exchange ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-bold">{instrument?.exchange_id || "--"}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Exchange
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">
                            Sector ID
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-bold">{instrument?.sector_id || "--"}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Sector
                        </p>
                    </CardContent>
                </Card>
            </div> */}
        </div >
    );
}
