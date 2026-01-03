import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Edit, Trash2, Clock } from 'lucide-react';

interface ActivityLog {
    id: number;
    action?: string | null;
    description: string;
    user?: {
        name?: string | null;
    } | null;
    created_at: string;
    old_values?: Record<string, any> | null;
    new_values?: Record<string, any> | null;
}

interface ActivityLogTableProps {
    logs?: ActivityLog[] | null;
    activityLogs?: ActivityLog[] | null;
    isLoading?: boolean;
}

export function ActivityLogTable({ logs, activityLogs, isLoading = false }: ActivityLogTableProps) {
    const resolvedLogs = logs ?? activityLogs ?? [];

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'created':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'updated':
                return <Edit className="h-4 w-4 text-blue-600" />;
            case 'deleted':
                return <Trash2 className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-800';
            case 'updated':
                return 'bg-blue-100 text-blue-800';
            case 'deleted':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getChangedFields = (oldValues?: Record<string, any>, newValues?: Record<string, any>) => {
        if (!oldValues || !newValues) return [];

        const changes: string[] = [];
        Object.keys(newValues).forEach(key => {
            if (oldValues[key] !== newValues[key]) {
                changes.push(`${key}`);
            }
        });
        return changes;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>System activity and changes</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">Loading activity logs...</p>
                </CardContent>
            </Card>
        );
    }

    if (!resolvedLogs || resolvedLogs.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>System activity and changes</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">No activity recorded yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent system activity and changes</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-96 overflow-x-auto overflow-y-auto">
                    <Table className="min-w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Changes</TableHead>
                                <TableHead>Date & Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {resolvedLogs.map((log) => {
                                const action = log.action ?? 'updated';
                                const actionLabel = action
                                    ? action.charAt(0).toUpperCase() + action.slice(1)
                                    : 'Unknown';

                                return (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(action)}
                                                <Badge className={getActionBadgeColor(action)}>
                                                    {actionLabel}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">{log.description}</TableCell>
                                        <TableCell className="text-sm">{log.user?.name || 'System'}</TableCell>
                                        <TableCell className="text-sm">
                                            {action === 'updated' && log.old_values && log.new_values ? (
                                                <div className="space-y-1">
                                                    {getChangedFields(log.old_values, log.new_values).map((field, idx) => (
                                                        <div key={idx} className="text-xs text-muted-foreground">
                                                            • {field}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
