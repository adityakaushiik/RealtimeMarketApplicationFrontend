import { useEffect, useState } from 'react';
import { ApiService } from "@/shared/services/apiService";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ProviderInDb } from '@/shared/types/apiTypes';

export const ProvidersPage = () => {
    const [providers, setProviders] = useState<ProviderInDb[]>([]);

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const data = await ApiService.getProviders();
                setProviders(data);
            } catch (error) {
                console.error("Failed to fetch providers:", error);
            }
        };
        fetchProviders();
    }, []);

    return (
        <div className="page-container flex flex-col section-gap">
            <div className="page-header-row">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h1 className="page-title">Data Providers</h1>
                    <p className="page-subtitle">
                        Manage your data connections and view provider status.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Connected Providers</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                    {/* Mobile Card View */}
                    <div className="sm:hidden divide-y">
                        {providers.length > 0 ? (
                            providers.map((provider) => (
                                <div key={provider.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">{provider.name}</span>
                                        <Badge variant={provider.is_active ? "default" : "secondary"} className={`text-xs ${provider.is_active ? "bg-green-600 hover:bg-green-700" : ""}`}>
                                            {provider.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <div>
                                            <span className="block font-medium text-foreground">Code</span>
                                            {provider.code}
                                        </div>
                                        <div>
                                            <span className="block font-medium text-foreground">Rate Limit</span>
                                            {provider.rate_limit || 'Unlimited'}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium text-foreground">Updated:</span> {new Date(provider.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No providers found.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs sm:text-sm">Name</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Code</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Rate Limit</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Last Updated</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providers.length > 0 ? (
                                    providers.map((provider) => (
                                        <TableRow key={provider.id}>
                                            <TableCell className="font-medium text-xs sm:text-sm">{provider.name}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{provider.code}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{provider.rate_limit || 'Unlimited'}</TableCell>
                                            <TableCell>
                                                <Badge variant={provider.is_active ? "default" : "secondary"} className={`text-xs ${provider.is_active ? "bg-green-600 hover:bg-green-700" : ""}`}>
                                                    {provider.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm">{new Date(provider.updated_at).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-xs sm:text-sm">
                                            No providers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
