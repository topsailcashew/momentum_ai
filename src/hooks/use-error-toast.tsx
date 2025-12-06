
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function useErrorToast() {
    const { toast } = useToast();

    const showError = (error: unknown, retry?: () => void) => {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";

        toast({
            variant: "destructive",
            title: "Something went wrong",
            description: message,
            action: retry ? (
                <Button variant="outline" size="sm" onClick={retry}>
                    Retry
                </Button>
            ) : undefined,
            duration: 10000, // Long duration for errors
        });
    };

    return { showError };
}
