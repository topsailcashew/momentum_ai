import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
    loading?: boolean
    loadingText?: string
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ loading, loadingText, children, disabled, ...props }, ref) => {
        return (
            <Button disabled={disabled || loading} ref={ref} {...props}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading && loadingText ? loadingText : children}
            </Button>
        )
    }
)
LoadingButton.displayName = "LoadingButton"
