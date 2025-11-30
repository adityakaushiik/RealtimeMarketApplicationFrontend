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
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Providers</h1>
                    <p className="text-muted-foreground">
                        Manage your data connections and view provider status.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Connected Providers</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Rate Limit</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {providers.length > 0 ? (
                                providers.map((provider) => (
                                    <TableRow key={provider.id}>
                                        <TableCell className="font-medium">{provider.name}</TableCell>
                                        <TableCell>{provider.code}</TableCell>
                                        <TableCell>{provider.rate_limit || 'Unlimited'}</TableCell>
                                        <TableCell>
                                            <Badge variant={provider.is_active ? "default" : "secondary"} className={provider.is_active ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {provider.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(provider.updated_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        No providers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
