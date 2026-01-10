import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiService } from "@/shared/services/apiService";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await ApiService.login({
                username_or_email: email,
                password: password,
            });
            // Redirect to dashboard on successful login
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        {/* <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                            Forgot your password?
                        </a> */}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </Field>
                <Field>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Field>
                {/* <FieldSeparator>Or continue with</FieldSeparator>
                <Field>
                    <Button variant="outline" type="button" disabled={true}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                            <path
                                d="M12.48 10.92v3.28h7.88c-.3 1.66-1.92 4.96-6.19 4.96c-3.73 0-6.79-3.07-6.79-6.84s3.06-6.84 6.79-6.84c2.1 0 3.51.89 4.31 1.68l2.6-2.58C19.38 3.1 16.32 2 12.48 2 6.94 2 2.44 6.49 2.44 12.03S6.94 22.06 12.48 22.06c5.78 0 9.6-4.06 9.6-9.76 0-.85-.09-1.48-.22-2.12H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        Login with Google
                    </Button>
                    <FieldDescription className="text-center">
                        Don&apos;t have an account?{" "}
                        <a href="/register" className="underline underline-offset-4">
                            Sign up
                        </a>
                    </FieldDescription>
                </Field> */}
                <Field>
                     <FieldDescription className="text-center">
                        Don&apos;t have an account?{" "}
                        <a href="/register" className="underline underline-offset-4">
                            Sign up
                        </a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
