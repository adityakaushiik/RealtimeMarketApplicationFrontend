import { GalleryVerticalEnd } from "lucide-react";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        <span className="text-sm sm:text-base">MarketRealtime</span>
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <RegisterForm />
                    </div>
                </div>
            </div>
            <div className="bg-muted relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                        <h2 className="text-3xl xl:text-4xl font-bold">Join the Market</h2>
                        <p className="text-lg xl:text-xl text-muted-foreground">
                            Create an account to start tracking and analyzing real-time market data.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
