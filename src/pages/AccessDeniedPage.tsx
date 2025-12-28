import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccessDeniedPage() {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center p-4">
            <div className="bg-destructive/10 p-6 rounded-full mb-6">
                <ShieldAlert className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h1>
            <p className="text-muted-foreground max-w-md mb-8">
                You do not have the necessary permissions to view this page. If you believe this is an error, please contact your system administrator.
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Go Back
                </Button>
                <Button onClick={() => navigate("/")}>
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
