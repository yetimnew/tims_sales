import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import * as React from 'react';

interface DeleteConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName?: string;
    onConfirm: () => void;
    isLoading?: boolean;
    isDangerous?: boolean;
    confirmLabel?: string;
    cancelLabel?: string;
    errorMessage?: string | null;
    supportingText?: string;
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    onConfirm,
    isLoading = false,
    isDangerous = true,
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    errorMessage,
    supportingText,
}: DeleteConfirmationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[360px] p-0">
                <div className="space-y-4 px-6 pt-6">
                    <div className="flex items-start gap-3">
                        {isDangerous && (
                            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-destructive dark:bg-red-500/10">
                                <AlertCircle className="h-4 w-4" />
                            </span>
                        )}
                        <div className="space-y-1.5">
                            <DialogTitle className="text-lg font-semibold text-slate-950 dark:text-slate-100">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>

                    {itemName && (
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {itemName}
                        </p>
                    )}
                </div>

                {supportingText && (
                    <p className="px-6 text-sm text-slate-500 dark:text-slate-400">
                        {supportingText}
                    </p>
                )}

                {errorMessage && (
                    <div className="px-6 pt-3">
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                            {errorMessage}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-2 px-6 pb-6 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        type="button"
                        variant={isDangerous ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            confirmLabel
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
