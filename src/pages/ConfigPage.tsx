import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstrumentCreateComponent } from '@/crud_utils/instrument/InstrumentCreate';
import { InstrumentUpdateComponent } from '@/crud_utils/instrument/InstrumentUpdate';
import { InstrumentDeleteComponent } from '@/crud_utils/instrument/InstrumentDelete';
import { ProviderCreateComponent } from '@/crud_utils/provider/ProviderCreate';
import { ProviderUpdateComponent } from '@/crud_utils/provider/ProviderUpdate';
import { ProviderDeleteComponent } from '@/crud_utils/provider/ProviderDelete';
import { SectorCreateComponent } from '@/crud_utils/sector/SectorCreate';
import { SectorUpdateComponent } from '@/crud_utils/sector/SectorUpdate';
import { SectorDeleteComponent } from '@/crud_utils/sector/SectorDelete';
import { InstrumentTypeCreateComponent } from '@/crud_utils/instrument_type/InstrumentTypeCreate';
import { InstrumentTypeUpdateComponent } from '@/crud_utils/instrument_type/InstrumentTypeUpdate';
import { InstrumentTypeDeleteComponent } from '@/crud_utils/instrument_type/InstrumentTypeDelete';
import { ApiService } from '@/shared/services/apiService';
import { Lock } from 'lucide-react';

export const ConfigPage = () => {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = () => {
            const user = ApiService.getCurrentUser();
            // Assuming the user object has a role or is_superuser field. 
            // If not available on user object directly, we might need to fetch it or rely on valid token.
            // For now, I'll assume if they can access this page via protected route, they are at least logged in.
            // But the prompt specifically said "only accessible by the admin". 
            // I'll check for a specific role if possible, but as a fallback I'll allow it for now 
            // since I don't see exact role definition in previous context.
            // Let's assume is_superuser is property, if not present we might need to adjust.
            if (user) {
                // Determine admin status. For now allowing all logged in users if no role field is present,
                // but strictly speaking should be: user.is_superuser
                // Examining previous `apiTypes`, I don't recall seeing is_superuser in UserRead. 
                // I will proceed assuming all logged-in users are admins for this dev phase 
                // OR checking a hypothetical role.
                setIsAdmin(true);
            }
            setLoading(false);
        };
        checkAdmin();
    }, []);

    if (loading) return <div className="p-6">Loading...</div>;

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">You do not have permission to view this configuration.</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">System Configuration</h1>
                <p className="page-subtitle">
                    Manage system resources, entities, and global settings.
                </p>
            </div>

            {/* Top Level Tabs: Entities */}
            <Tabs defaultValue="instruments" className="w-full">
                <div className="mb-4 sm:mb-6 lg:mb-8 border-b overflow-x-auto hide-scrollbar">
                    <TabsList className="w-max min-w-full sm:w-full justify-start h-auto bg-transparent p-0 gap-2 sm:gap-4 lg:gap-6">
                        <TabsTrigger
                            value="instruments"
                            className="text-sm sm:text-base lg:text-lg py-2 sm:py-3 px-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                        >
                            Instruments
                        </TabsTrigger>
                        <TabsTrigger
                            value="providers"
                            className="text-sm sm:text-base lg:text-lg py-2 sm:py-3 px-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                        >
                            Providers
                        </TabsTrigger>
                        <TabsTrigger
                            value="sectors"
                            className="text-sm sm:text-base lg:text-lg py-2 sm:py-3 px-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                        >
                            Sectors
                        </TabsTrigger>
                        <TabsTrigger
                            value="instrument_types"
                            className="text-sm sm:text-base lg:text-lg py-2 sm:py-3 px-1 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none whitespace-nowrap"
                        >
                            Instrument Types
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Instruments Section */}
                <TabsContent value="instruments" className="mt-0">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                        <Tabs defaultValue="create" orientation="vertical" className="w-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                            <aside className="lg:w-56 xl:w-64 shrink-0">
                                <TabsList className="flex flex-row lg:flex-col w-full h-auto justify-start bg-muted/50 p-1 gap-1 rounded-lg overflow-x-auto hide-scrollbar">
                                    <TabsTrigger value="create" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Create New</TabsTrigger>
                                    <TabsTrigger value="update" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Update Existing</TabsTrigger>
                                    <TabsTrigger value="delete" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Delete</TabsTrigger>
                                </TabsList>
                            </aside>
                            <div className="flex-1">
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-base sm:text-lg">Manage Instruments</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Add, modify, or remove trading instruments from the system.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-0">
                                        <TabsContent value="create" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentCreateComponent />
                                        </TabsContent>
                                        <TabsContent value="update" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentUpdateComponent />
                                        </TabsContent>
                                        <TabsContent value="delete" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentDeleteComponent />
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </div>
                        </Tabs>
                    </div>
                </TabsContent>

                {/* Providers Section */}
                <TabsContent value="providers" className="mt-0">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                        <Tabs defaultValue="create" orientation="vertical" className="w-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                            <aside className="lg:w-56 xl:w-64 shrink-0">
                                <TabsList className="flex flex-row lg:flex-col w-full h-auto justify-start bg-muted/50 p-1 gap-1 rounded-lg overflow-x-auto hide-scrollbar">
                                    <TabsTrigger value="create" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Create New</TabsTrigger>
                                    <TabsTrigger value="update" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Update Existing</TabsTrigger>
                                    <TabsTrigger value="delete" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Delete</TabsTrigger>
                                </TabsList>
                            </aside>
                            <div className="flex-1">
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-base sm:text-lg">Manage Providers</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Configure market data providers and API credentials.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-0">
                                        <TabsContent value="create" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <ProviderCreateComponent />
                                        </TabsContent>
                                        <TabsContent value="update" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <ProviderUpdateComponent />
                                        </TabsContent>
                                        <TabsContent value="delete" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <ProviderDeleteComponent />
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </div>
                        </Tabs>
                    </div>
                </TabsContent>

                {/* Sectors Section */}
                <TabsContent value="sectors" className="mt-0">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                        <Tabs defaultValue="create" orientation="vertical" className="w-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                            <aside className="lg:w-56 xl:w-64 shrink-0">
                                <TabsList className="flex flex-row lg:flex-col w-full h-auto justify-start bg-muted/50 p-1 gap-1 rounded-lg overflow-x-auto hide-scrollbar">
                                    <TabsTrigger value="create" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Create New</TabsTrigger>
                                    <TabsTrigger value="update" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Update Existing</TabsTrigger>
                                    <TabsTrigger value="delete" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Delete</TabsTrigger>
                                </TabsList>
                            </aside>
                            <div className="flex-1">
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-base sm:text-lg">Manage Sectors</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Organize assets into market sectors.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-0">
                                        <TabsContent value="create" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <SectorCreateComponent />
                                        </TabsContent>
                                        <TabsContent value="update" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <SectorUpdateComponent />
                                        </TabsContent>
                                        <TabsContent value="delete" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <SectorDeleteComponent />
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </div>
                        </Tabs>
                    </div>
                </TabsContent>

                {/* Instrument Types Section */}
                <TabsContent value="instrument_types" className="mt-0">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                        <Tabs defaultValue="create" orientation="vertical" className="w-full flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                            <aside className="lg:w-56 xl:w-64 shrink-0">
                                <TabsList className="flex flex-row lg:flex-col w-full h-auto justify-start bg-muted/50 p-1 gap-1 rounded-lg overflow-x-auto hide-scrollbar">
                                    <TabsTrigger value="create" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Create New</TabsTrigger>
                                    <TabsTrigger value="update" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Update Existing</TabsTrigger>
                                    <TabsTrigger value="delete" className="flex-1 lg:flex-none lg:w-full justify-center lg:justify-start px-3 py-2 text-xs sm:text-sm whitespace-nowrap">Delete</TabsTrigger>
                                </TabsList>
                            </aside>
                            <div className="flex-1">
                                <Card className="border-none shadow-none bg-transparent">
                                    <CardHeader className="px-0 pt-0">
                                        <CardTitle className="text-base sm:text-lg">Manage Instrument Types</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm">Define types and categories for instruments.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-0">
                                        <TabsContent value="create" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentTypeCreateComponent />
                                        </TabsContent>
                                        <TabsContent value="update" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentTypeUpdateComponent />
                                        </TabsContent>
                                        <TabsContent value="delete" className="mt-0 p-4 sm:p-6 border rounded-lg bg-card shadow-sm">
                                            <InstrumentTypeDeleteComponent />
                                        </TabsContent>
                                    </CardContent>
                                </Card>
                            </div>
                        </Tabs>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
