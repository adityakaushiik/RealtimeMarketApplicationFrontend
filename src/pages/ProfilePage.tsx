
import { useState, useEffect } from "react";
import { ApiService } from "@/shared/services/apiService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/shared/store/appStore";
import type { UserInDb } from "@/shared/types/apiTypes";
// Checking UserSuggestionsPage, it doesn't show toast usage. UserApprovalPage doesn't either.
// I'll stick to a simple alert or console.log if I can't find a toast provider, 
// BUT most modern React apps usage I see here probably use some toast.
// I will check main.tsx or App.tsx or use window.alert if needed, but I'll try to use a standard UI pattern. 
// Actually, I'll use a simple state for success/error message for now to be safe.

export function ProfilePage() {
    const [user, setUser] = useState<UserInDb | null>(null);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { pctChangeBasis, setPctChangeBasis } = useAppStore();

    useEffect(() => {
        const currentUser = ApiService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
    }, []);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match." });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        try {
            await ApiService.changePassword({ old_password: oldPassword, new_password: newPassword });
            setMessage({ type: 'success', text: "Password changed successfully." });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to change password." });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8">Loading profile...</div>;
    }

    return (
        <div className="page-container flex flex-col gap-6 max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your account settings and security.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your basic account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Username</Label>
                            <div className="p-2 bg-muted rounded-md text-sm">{user.username || 'N/A'}</div>
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <div className="p-2 bg-muted rounded-md text-sm">{user.email}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label>First Name</Label>
                                <div className="p-2 bg-muted rounded-md text-sm">{user.fname || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <Label>Last Name</Label>
                                <div className="p-2 bg-muted rounded-md text-sm">{user.lname || '-'}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleChangePassword}>
                        <CardContent className="space-y-4">
                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="old-password">Old Password</Label>
                                <Input
                                    id="old-password"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Updating..." : "Change Password"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your application experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="pct-basis" className="flex flex-col space-y-1">
                                <span>Percentage Change Basis</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Calculate price change based on {pctChangeBasis === 'prev_close' ? 'Previous Close' : 'Opening Price'}
                                </span>
                            </Label>
                            <div className="flex items-center space-x-2">
                                <span className={pctChangeBasis === 'open' ? "font-bold" : "text-muted-foreground"}>Open</span>
                                <Switch
                                    id="pct-basis"
                                    checked={pctChangeBasis === 'prev_close'}
                                    onCheckedChange={(checked) => setPctChangeBasis(checked ? 'prev_close' : 'open')}
                                />
                                <span className={pctChangeBasis === 'prev_close' ? "font-bold" : "text-muted-foreground"}>Prev Close</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
