import { Input } from '@/components/ui/input';
import * as React from 'react';

interface ReportHeaderProps {
    title: string;
    subtitle?: string;
    from?: string;
    to?: string;
    onApply?: (from: string, to: string) => void;
    rightSlot?: React.ReactNode;
}

export function ReportHeader({ title, subtitle, from = '', to = '', onApply, rightSlot }: ReportHeaderProps) {
    const [fromState, setFromState] = React.useState(from);
    const [toState, setToState] = React.useState(to);

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-lg font-bold">{title}</h1>
                {subtitle && (
                    <p className="text-muted-foreground text-sm">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {onApply && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">From</span>
                            <Input type="date" value={fromState} onChange={(e) => setFromState(e.target.value)} className="w-40" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">To</span>
                            <Input type="date" value={toState} onChange={(e) => setToState(e.target.value)} className="w-40" />
                        </div>
                        <button onClick={() => onApply(fromState, toState)} className="px-3 py-2 border rounded-md text-sm">Apply</button>
                    </>
                )}
                {rightSlot}
            </div>
        </div>
    );
}



