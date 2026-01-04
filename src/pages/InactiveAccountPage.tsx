
import { ApiService } from "@/shared/services/apiService";
import { Button } from "@/components/ui/button";

export const InactiveAccountPage = () => {
    const handleLogout = () => {
        ApiService.logout();
        window.location.href = "/login";
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg text-center border border-border">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Account Inactive</h1>
                <p className="text-muted-foreground mb-6">
                    Your account is currently inactive. Please contact the administrator for approval or more information.
                </p>
                <div className="flex justify-center">
                    <Button onClick={handleLogout} variant="outline">
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};
