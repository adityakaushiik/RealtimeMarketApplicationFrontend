import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ConfigLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
}

export const ConfigLayout = ({ title, description, children }: ConfigLayoutProps) => {
    return (
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-primary">{title}</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    {description}
                </p>
            </div>
            <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                    {children}
                </CardContent>
            </Card>
        </div>
    );
};
