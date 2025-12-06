
"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";

export function ResponsiveModal({
    children,
    ...props
}: React.ComponentProps<typeof Dialog>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <Sheet {...props}>{children}</Sheet>;
    }

    return <Dialog {...props}>{children}</Dialog>;
}

export function ResponsiveModalTrigger({
    children,
    ...props
}: React.ComponentProps<typeof DialogTrigger>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetTrigger {...props}>{children}</SheetTrigger>;
    }

    return <DialogTrigger {...props}>{children}</DialogTrigger>;
}

export function ResponsiveModalClose({
    children,
    ...props
}: React.ComponentProps<typeof DialogClose>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetClose {...props}>{children}</SheetClose>;
    }

    return <DialogClose {...props}>{children}</DialogClose>;
}

export function ResponsiveModalContent({
    children,
    className,
    side = "bottom",
    ...props
}: React.ComponentProps<typeof SheetContent>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <SheetContent side={side} className={className} {...props}>
                {children}
            </SheetContent>
        );
    }

    return (
        <DialogContent className={className} {...props}>
            {children}
        </DialogContent>
    );
}

export function ResponsiveModalHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetHeader className={className} {...props} />;
    }

    return <DialogHeader className={className} {...props} />;
}

export function ResponsiveModalFooter({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetFooter className={className} {...props} />;
    }

    return <DialogFooter className={className} {...props} />;
}

export function ResponsiveModalTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogTitle>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetTitle className={className} {...props} />;
    }

    return <DialogTitle className={className} {...props} />;
}

export function ResponsiveModalDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogDescription>) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <SheetDescription className={className} {...props} />;
    }

    return <DialogDescription className={className} {...props} />;
}
