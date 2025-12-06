
"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorBoundaryProps {
    children: React.ReactNode;
}

interface PageErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class PageErrorBoundary extends React.Component<
    PageErrorBoundaryProps,
    PageErrorBoundaryState
> {
    constructor(props: PageErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Page Error Boundary caught an error:", error, errorInfo);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6 text-center">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-semibold">Something went wrong</h2>
                    <p className="text-muted-foreground max-w-md">
                        {this.state.error?.message || "An unexpected error occurred."}
                    </p>
                    <div className="flex gap-2 mt-4">
                        <Button onClick={this.reset}>Try Again</Button>
                        <Button
                            variant="outline"
                            onClick={() => (window.location.href = "/")}
                        >
                            Go Home
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
