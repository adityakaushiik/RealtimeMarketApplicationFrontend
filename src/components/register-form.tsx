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

export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"form">) {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await ApiService.register({
                username: name,
                email: email,
                password: password,
            });
            // Redirect to login on successful registration or dashboard if auto-login
            // For now, let's redirect to login with a success message? Or just login directly if API returns token (register usually doesn't return token in this app based on type analysis, check ApiService details)
            // ApiService.register returns UserInDb, not LoginResponse. So we probably need to login or redirect to login.
            navigate("/login");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Create an account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your details below to create your account
                    </p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                    />
                </Field>

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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
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
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={loading}
                    />
                </Field>

                <Field>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                </Field>
                {/* <FieldSeparator>Or continue with</FieldSeparator> */}
                <Field>
                    {/* <Button variant="outline" type="button" disabled={true}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                            <path
                                d="M12.48 10.92v3.28h7.88c-.3 1.66-1.92 4.96-6.19 4.96c-3.73 0-6.79-3.07-6.79-6.84s3.06-6.84 6.79-6.84c2.1 0 3.51.89 4.31 1.68l2.6-2.58C19.38 3.1 16.32 2 12.48 2 6.94 2 2.44 6.49 2.44 12.03S6.94 22.06 12.48 22.06c5.78 0 9.6-4.06 9.6-9.76 0-.85-.09-1.48-.22-2.12H12.48z"
                                fill="currentColor"
                            />
                        </svg>
                        Sign up with Google
                    </Button> */}
                    <FieldDescription className="text-center">
                        Already have an account?{" "}
                        <a href="/login" className="underline underline-offset-4">
                            Login
                        </a>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
