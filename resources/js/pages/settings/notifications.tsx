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
import { useTranslation } from 'react-i18next';

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

const formatTimestamp = (timestamp: string | null | undefined, locale: string): string | null => {
    if (!timestamp) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(timestamp));
    } catch (_error) {
        return null;
    }
};

export default function NotificationSettings({ preferences }: NotificationSettingsProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language || 'en-US';
    const { flash } = usePage<FlashProps>().props;
    const [rows, setRows] = React.useState<PreferenceRow[]>(() => preferences.map(toRow));
    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('notificationPreferences.title'),
                href: edit().url,
            },
        ],
        [t],
    );

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

    const enableAll = React.useCallback(() => {
        setRows(current =>
            current.map(row => ({
                ...row,
                inAppEnabled: true,
                emailEnabled: true,
            })),
        );
    }, []);

    const disableAll = React.useCallback(() => {
        setRows(current =>
            current.map(row => ({
                ...row,
                inAppEnabled: false,
                emailEnabled: false,
            })),
        );
    }, []);

    const fullyEnabledCount = React.useMemo(
        () => rows.filter(row => row.inAppEnabled && row.emailEnabled).length,
        [rows],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('notificationPreferences.title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('notificationPreferences.header.title')}</CardTitle>
                            <CardDescription>
                                {t('notificationPreferences.header.description')}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {rows.length === 0 ? (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle className="text-base">{t('notificationPreferences.empty.title')}</CardTitle>
                                <CardDescription>
                                    {t('notificationPreferences.empty.description')}
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
                                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold">{t('notificationPreferences.coverage.title')}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {t('notificationPreferences.coverage.description', { enabled: fullyEnabledCount, total: rows.length })}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button type="button" variant="secondary" onClick={enableAll}>
                                                {t('notificationPreferences.coverage.enableAll')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={disableAll}
                                                className="border-border"
                                            >
                                                {t('notificationPreferences.coverage.disableAll')}
                                            </Button>
                                        </div>
                                    </div>

                                    {rows.map((row, index) => {
                                        const updatedAt = formatTimestamp(row.updatedAt, locale);

                                        return (
                                            <Card key={row.typeId} className="border border-muted">
                                                <CardHeader className="gap-2">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <CardTitle className="text-lg font-semibold">
                                                                {row.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {row.description ?? t('notificationPreferences.rows.noDescription')}
                                                            </CardDescription>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2 text-right">
                                                            {row.assignedBy && (
                                                                <Badge variant="outline">
                                                                    {t('notificationPreferences.rows.enabledBy', { name: row.assignedBy.name })}
                                                                </Badge>
                                                            )}
                                                            {updatedAt && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {t('notificationPreferences.rows.updatedAt', { date: updatedAt })}
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
                                                                    {t('notificationPreferences.channels.inApp.title')}
                                                                </Label>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {t('notificationPreferences.channels.inApp.description')}
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
                                                                    {t('notificationPreferences.channels.email.title')}
                                                                </Label>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {t('notificationPreferences.channels.email.description')}
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
                                            {processing ? t('notificationPreferences.actions.saving') : t('notificationPreferences.actions.save')}
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
                                            <p className="text-sm text-muted-foreground">{t('notificationPreferences.actions.saved')}</p>
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
