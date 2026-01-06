import { useEffect, useState, useCallback } from "react";
import { ApiService } from "@/shared/services/apiService";
import { Button } from "@/components/ui/button";
import { UserX, Clock, LogOut } from "lucide-react";

const LOGOUT_TIMER_KEY = "inactive_account_logout_time";
const LOGOUT_DELAY_SECONDS = 20;

export const InactiveAccountPage = () => {
    const [secondsRemaining, setSecondsRemaining] = useState<number>(LOGOUT_DELAY_SECONDS);

    const handleLogout = useCallback(() => {
        // Clear the timer from storage
        localStorage.removeItem(LOGOUT_TIMER_KEY);
        ApiService.logout();
        window.location.href = "/login";
    }, []);

    useEffect(() => {
        // Check if there's an existing logout time stored
        const storedLogoutTime = localStorage.getItem(LOGOUT_TIMER_KEY);
        let logoutTime: number;

        if (storedLogoutTime) {
            logoutTime = parseInt(storedLogoutTime, 10);
        } else {
            // Set a new logout time 20 seconds from now
            logoutTime = Date.now() + LOGOUT_DELAY_SECONDS * 1000;
            localStorage.setItem(LOGOUT_TIMER_KEY, logoutTime.toString());
        }

        // Check if already expired (user came back after leaving)
        if (Date.now() >= logoutTime) {
            handleLogout();
            return;
        }

        // Calculate initial remaining time
        const initialRemaining = Math.ceil((logoutTime - Date.now()) / 1000);
        setSecondsRemaining(Math.max(0, initialRemaining));

        // Update countdown every second
        const interval = setInterval(() => {
            const remaining = Math.ceil((logoutTime - Date.now()) / 1000);

            if (remaining <= 0) {
                clearInterval(interval);
                handleLogout();
            } else {
                setSecondsRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [handleLogout]);

    // Calculate progress percentage for the circular timer
    const progressPercentage = (secondsRemaining / LOGOUT_DELAY_SECONDS) * 100;
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center p-4 bg-background">
            {/* Icon Container with gradient background */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-8 rounded-full border border-amber-500/30">
                    <UserX className="h-16 w-16 text-amber-500" strokeWidth={1.5} />
                </div>
            </div>

            {/* Main Content */}
            <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Account Inactive
            </h1>

            <p className="text-muted-foreground max-w-md mb-8 text-lg leading-relaxed">
                Your account is currently pending activation. An administrator will review your account shortly.
            </p>

            {/* Status Card with Timer */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 mb-8 max-w-md w-full">
                <div className="flex items-center gap-4 text-left">
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                        <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Pending Review</p>
                        <p className="text-xs text-muted-foreground">
                            Your account is awaiting administrator approval
                        </p>
                    </div>
                </div>

                {/* Countdown Timer */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="relative w-24 h-24">
                        {/* Background circle */}
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-muted/20"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="48"
                                cy="48"
                                r="45"
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-linear"
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Timer text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-amber-500">{secondsRemaining}</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium text-foreground">Auto Sign Out</p>
                        <p className="text-xs text-muted-foreground">
                            You will be signed out in {secondsRemaining} seconds
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={handleLogout}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out Now
                </Button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-muted-foreground mt-8 max-w-sm">
                If you've been waiting for more than 24 hours, please contact support for assistance.
            </p>
        </div>
    );
};
