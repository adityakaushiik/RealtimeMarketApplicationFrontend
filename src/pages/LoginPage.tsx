import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <Logo className="h-8 sm:h-10 w-auto text-foreground" />
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <LoginForm />
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:block bg-[#d3d3d3]">
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 flex items-center justify-center">
                    <div className="text-center space-y-6 p-8">
                        <Logo className="h-24 xl:h-32 w-auto mx-auto text-gray-900" />
                        <p className="text-lg xl:text-xl text-gray-700 font-light italic">
                            Decision-Grade Market Intelligence
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
