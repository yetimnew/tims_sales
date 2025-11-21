import NotificationPreferenceController from '@/actions/App/Http/Controllers/Settings/NotificationPreferenceController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import * as React from 'react';
import { edit } from '@/routes/notification-preferences';

type Preference = {
    type_id: number;
    key: string;
    name: string;
    description: string | null;
    in_app_enabled: boolean;
    email_enabled: boolean;
    assigned_by?: { id: number; name: string } | null;
    updated_at?: string | null;
};

type PreferenceRow = {
    typeId: number;
    key: string;
    name: string;
    description: string | null;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    assignedBy?: { id: number; name: string } | null;
    updatedAt?: string | null;
};

interface NotificationSettingsProps {
    preferences: Preference[];
}

type FlashProps = {
    flash?: {
        success?: string;
        error?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notification preferences',
        href: edit().url,
    },
];

const toRow = (preference: Preference): PreferenceRow => ({
    typeId: preference.type_id,
    key: preference.key,
    name: preference.name,
    description: preference.description,
    inAppEnabled: preference.in_app_enabled,
    emailEnabled: preference.email_enabled,
    assignedBy: preference.assigned_by ?? undefined,
    updatedAt: preference.updated_at ?? undefined,
});

const formatTimestamp = (timestamp?: string | null): string | null => {
    if (!timestamp) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(timestamp));
    } catch (error) {
        return null;
    }
};

export default function NotificationSettings({ preferences }: NotificationSettingsProps) {
    const { flash } = usePage<FlashProps>().props;
    const [rows, setRows] = React.useState<PreferenceRow[]>(() => preferences.map(toRow));

    React.useEffect(() => {
        setRows(preferences.map(toRow));
    }, [preferences]);

    const handleToggle = React.useCallback(
        (typeId: number, channel: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
            setRows(current =>
                current.map(row =>
                    row.typeId === typeId
                        ? {
                              ...row,
                              [channel]: value,
                          }
                        : row,
                ),
            );
        },
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification preferences" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage notifications</CardTitle>
                            <CardDescription>
                                Choose how you want to be notified. Contact your administrator if you need
                                access to additional notification types.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {rows.length === 0 ? (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-base">No notifications assigned yet</CardTitle>
                                <CardDescription>
                                    Your administrator has not enabled any notifications for your account. You will
                                    see options here once a notification type is assigned to you.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Form
                            {...NotificationPreferenceController.update.form()}
                            className="space-y-6"
                            options={{ preserveScroll: true }}
                        >
                            {({ processing, recentlySuccessful }) => (
                                <>
                                    {rows.map((row, index) => {
                                        const updatedAt = formatTimestamp(row.updatedAt);

                                        return (
                                            <Card key={row.typeId} className="border border-muted">
                                                <CardHeader className="gap-2">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <CardTitle className="text-lg font-semibold">
                                                                {row.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {row.description ?? 'No additional description provided.'}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 text-right">
                                                            {row.assignedBy && (
                                                                <Badge variant="outline">
                                                                    Enabled by {row.assignedBy.name}
                                                                </Badge>
                                                            )}
                                                            {updatedAt && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Updated {updatedAt}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <input
                                                        type="hidden"
                                                        name={`preferences[${index}][type_id]`}
                                                        value={row.typeId}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`preferences[${index}][in_app_enabled]`}
                                                        value={row.inAppEnabled ? '1' : '0'}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`preferences[${index}][email_enabled]`}
                                                        value={row.emailEnabled ? '1' : '0'}
                                                    />

                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
                                                            <Checkbox
                                                                id={`pref-${row.typeId}-in-app`}
                                                                checked={row.inAppEnabled}
                                                                onCheckedChange={value =>
                                                                    handleToggle(
                                                                        row.typeId,
                                                                        'inAppEnabled',
                                                                        value === true,
                                                                    )
                                                                }
                                                            />
                                                            <div>
                                                                <Label htmlFor={`pref-${row.typeId}-in-app`}>
                                                                    In-app alerts
                                                                </Label>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Receive notifications inside the application.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
                                                            <Checkbox
                                                                id={`pref-${row.typeId}-email`}
                                                                checked={row.emailEnabled}
                                                                onCheckedChange={value =>
                                                                    handleToggle(
                                                                        row.typeId,
                                                                        'emailEnabled',
                                                                        value === true,
                                                                    )
                                                                }
                                                            />
                                                            <div>
                                                                <Label htmlFor={`pref-${row.typeId}-email`}>
                                                                    Email alerts
                                                                </Label>
                                                                <p className="text-sm text-muted-foreground">
                                                                    We will send emails when this event occurs.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}

                                    <div className="flex items-center gap-4">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Saving…' : 'Save preferences'}
                                        </Button>

                                        <Transition
                                            show={recentlySuccessful || Boolean(flash?.success)}
                                            enter="transition ease-out duration-150"
                                            enterFrom="opacity-0"
                                            enterTo="opacity-100"
                                            leave="transition ease-in duration-150"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-muted-foreground">Saved</p>
                                        </Transition>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
