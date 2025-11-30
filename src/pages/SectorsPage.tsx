import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export const SectorsPage = () => {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sectors</h1>
                    <p className="text-muted-foreground">
                        Sector analysis and performance.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sector Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Sector data is currently not available from the API.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
