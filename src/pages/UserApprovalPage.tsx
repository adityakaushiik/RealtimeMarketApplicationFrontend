
import { useState, useEffect } from 'react';
import { ApiService } from '@/shared/services/apiService';
import type { UserInDb } from '@/shared/types/apiTypes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X, Ban, RefreshCw, UserCheck, ShieldAlert, Clock, KeyRound } from 'lucide-react';
import { UserStatus } from '@/shared/utils/CommonConstants';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const UserApprovalPage = () => {
    const [pendingUsers, setPendingUsers] = useState<UserInDb[]>([]);
    const [activeUsers, setActiveUsers] = useState<UserInDb[]>([]);
    const [inactiveUsers, setInactiveUsers] = useState<UserInDb[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [pending, active, inactive] = await Promise.all([
                ApiService.getUsers(UserStatus.PENDING), // 0 = Pending
                ApiService.getUsers(UserStatus.ACTIVE), // 1 = Active/Approved
                ApiService.getUsers(UserStatus.REJECTED)  // 2 = Rejected/Blocked
            ]);
            setPendingUsers(pending);
            setActiveUsers(active);
            setInactiveUsers(inactive);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
    const [selectedUserForReset, setSelectedUserForReset] = useState<UserInDb | null>(null);
    const [newResetPassword, setNewResetPassword] = useState("");

    const openResetPasswordDialog = (user: UserInDb) => {
        setSelectedUserForReset(user);
        setNewResetPassword("");
        setResetPasswordOpen(true);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForReset) return;

        try {
            await ApiService.resetPassword(selectedUserForReset.id, { new_password: newResetPassword });
            alert(`Password for ${selectedUserForReset.username} has been reset successfully.`);
            setResetPasswordOpen(false);
            setNewResetPassword("");
            setSelectedUserForReset(null);
        } catch (error) {
            console.error("Failed to reset password", error);
            alert("Failed to reset password. Please try again.");
        }
    };

    const handleStatusUpdate = async (userId: number, newStatus: number) => {
        try {
            await ApiService.updateUserStatus(userId, newStatus);
            await fetchUsers();
        } catch (error) {
            console.error("Failed to update user status", error);
        }
    };

    const renderUserList = (users: UserInDb[], statusType: 'pending' | 'active' | 'inactive') => (
        <div className="flex flex-col gap-2 sm:gap-3">
            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center border-2 border-dashed rounded-xl bg-muted/20">
                    <div className="text-base sm:text-lg font-semibold text-muted-foreground">No users found</div>
                    <p className="text-xs sm:text-sm text-muted-foreground/80">There are no users in this category at the moment.</p>
                </div>
            ) : (
                users.map((user) => (
                    <div
                        key={user.id}
                        className="group relative flex items-center justify-between p-3 sm:p-4 bg-card hover:bg-accent/50 border rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                        {/* Status Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusType === 'active' ? 'bg-gradient-to-b from-green-500 to-emerald-600' :
                            statusType === 'pending' ? 'bg-gradient-to-b from-yellow-500 to-orange-500' :
                                'bg-red-500'
                            } opacity-80`} />

                        <div className="flex items-center gap-3 sm:gap-4 pl-2 sm:pl-3 min-w-0 flex-1">
                            {/* Avatar / Profile Picture */}
                            <div className="flex-shrink-0">
                                {user.profile_picture_url ? (
                                    <img src={user.profile_picture_url} alt="" className="w-10 h-10 rounded-full bg-muted object-cover border border-border" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                        {(user.username || user.email || '?')[0].toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-base sm:text-lg font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                                        {user.username || 'No Username'}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                                        {user.role_id === 1 ? 'Admin' : 'User'}
                                    </Badge>
                                </div>
                                <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
                                    {user.email} &bull; {user.fname} {user.lname}
                                </span>
                            </div>
                        </div>

                        {/* Actions Area */}
                        <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-4">
                            <div className="flex items-center gap-2">
                                {statusType === 'pending' && (
                                    <>
                                        <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(user.id, UserStatus.ACTIVE)}>
                                            <Check className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Approve</span>
                                        </Button>
                                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleStatusUpdate(user.id, UserStatus.REJECTED)}>
                                            <X className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Reject</span>
                                        </Button>
                                    </>
                                )}
                                {statusType === 'active' && (
                                    <Button size="sm" variant="outline" className="h-8 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate(user.id, UserStatus.REJECTED)}>
                                        <ShieldAlert className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Deactivate</span>
                                    </Button>
                                )}
                                {statusType === 'inactive' && (
                                    <Button size="sm" variant="outline" className="h-8" onClick={() => handleStatusUpdate(user.id, UserStatus.ACTIVE)}>
                                        <RefreshCw className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Reactivate</span>
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" className="h-8" onClick={() => openResetPasswordDialog(user)}>
                                    <KeyRound className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Reset Password</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div >
    );

    return (
        <div className="page-container flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage user registrations, approvals, and deactivations.</p>
                </div>
                <Button variant="outline" onClick={fetchUsers} disabled={loading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                        <Clock className="w-4 h-4" />
                        Pending Approvals
                        {pendingUsers.length > 0 && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-1.5 py-0 h-5 text-[10px] rounded-full min-w-[20px] justify-center">
                                {pendingUsers.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="active" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                        <UserCheck className="w-4 h-4" />
                        Active Users
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                        <Ban className="w-4 h-4" />
                        Rejected / Inactive
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-0 focus-visible:outline-none">
                    {renderUserList(pendingUsers, 'pending')}
                </TabsContent>

                <TabsContent value="active" className="mt-0 focus-visible:outline-none">
                    {renderUserList(activeUsers, 'active')}
                </TabsContent>

                <TabsContent value="inactive" className="mt-0 focus-visible:outline-none">
                    {renderUserList(inactiveUsers, 'inactive')}
                </TabsContent>
            </Tabs>

            <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for user <b>{selectedUserForReset?.username}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPasswordSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-password" className="text-right">
                                    New Password
                                </Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newResetPassword}
                                    onChange={(e) => setNewResetPassword(e.target.value)}
                                    className="col-span-3"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Reset Password</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
