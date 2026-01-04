import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { type MouseEventHandler, type ReactNode } from 'react';

interface FormActionsBarProps {
    left?: ReactNode;
    right?: ReactNode;
    children?: ReactNode;
    className?: string;
    processing?: boolean;
    disabled?: boolean;
    cancelHref?: string;
    cancelLabel?: string;
    onCancel?: MouseEventHandler<HTMLButtonElement>;
    submitLabel?: string;
    onSubmit?: MouseEventHandler<HTMLButtonElement>;
    isDirty?: boolean;
    dirtyLabel?: string;
}

export function FormActionsBar({
    left,
    right,
    children,
    className,
    processing = false,
    disabled = false,
    cancelHref,
    cancelLabel = 'Cancel',
    onCancel,
    submitLabel,
    onSubmit,
    isDirty = false,
    dirtyLabel = 'You have unsaved changes',
}: FormActionsBarProps) {
    const renderCancelButton = () => {
        if (onCancel) {
            return (
                <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                    {cancelLabel}
                </Button>
            );
        }

        if (cancelHref) {
            return (
                <Button type="button" variant="outline" asChild disabled={processing}>
                    <Link href={cancelHref}>{cancelLabel}</Link>
                </Button>
            );
        }

        return null;
    };

    const renderSubmitButton = () => {
        if (!submitLabel) {
            return null;
        }

        const isDisabled = disabled || processing;

        return (
            <Button type="submit" disabled={isDisabled} onClick={onSubmit}>
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {processing ? submitLabel : submitLabel}
            </Button>
        );
    };

    const derivedLeft = left ?? (isDirty ? (
        <span className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            {dirtyLabel}
        </span>
    ) : null);

    let derivedRight: ReactNode = right;

    if (!derivedRight) {
        if (children) {
            derivedRight = children;
        } else {
            const cancelButton = renderCancelButton();
            const submitButton = renderSubmitButton();

            derivedRight = (
                <>
                    {cancelButton}
                    {submitButton}
                </>
            );
        }
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">{derivedLeft}</div>
            <div className="flex flex-wrap items-center gap-3">{derivedRight}</div>
        </div>
    );
}
