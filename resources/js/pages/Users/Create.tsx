import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Link } from '@inertiajs/react';
import { User, Shield, BellRing, Plus, Trash2, Sparkles, Filter, Search, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { validateUser, type ValidationErrors } from '@/lib/validation';
import { evaluatePasswordStrength } from '@/lib/password-strength';
import { index as usersIndexRoute, create as createUserRoute } from '@/routes/users';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Role {
  id: number;
  name: string;
}

interface NotificationTypeResource {
  id: number;
  key: string;
  name: string;
  description: string | null;
  default_in_app: boolean;
  default_email: boolean;
}

type NotificationPreferenceInput = {
  type_id: number;
  in_app_enabled: boolean;
  email_enabled: boolean;
};

type NotificationAssignment = {
  typeId: number;
  name: string;
  description: string | null;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  notification_preferences: NotificationPreferenceInput[];
}

interface UsersCreateProps {
  roles: Role[];
  notificationTypes: NotificationTypeResource[];
}

export default function UsersCreate({ roles, notificationTypes }: UsersCreateProps) {
  const { t } = useTranslation();
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const { data, setData, post, processing, errors } = useForm<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    notification_preferences: [],
  });
  const [assignedNotifications, setAssignedNotifications] = useState<NotificationAssignment[]>([]);
  const [pendingNotificationType, setPendingNotificationType] = useState<string>('');
  const [notificationSearchTerm, setNotificationSearchTerm] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isAdminRole = data.role === 'admin';

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('users.breadcrumbs.management'), href: usersIndexRoute().url },
      { title: t('users.title'), href: usersIndexRoute().url },
      { title: t('users.create.breadcrumb'), href: createUserRoute().url },
    ],
    [t],
  );

  useEffect(() => {
    setData(
      'notification_preferences',
      assignedNotifications.map(notification => ({
        type_id: notification.typeId,
        in_app_enabled: notification.inAppEnabled,
        email_enabled: notification.emailEnabled,
      })),
    );
  }, [assignedNotifications, setData]);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(data.password), [data.password]);

  const availableNotificationTypes = useMemo(
    () => notificationTypes.filter(type => !assignedNotifications.some(notification => notification.typeId === type.id)),
    [notificationTypes, assignedNotifications],
  );

  const filteredAssignedNotifications = useMemo(() => {
    if (notificationSearchTerm.trim() === '') {
      return assignedNotifications;
    }

    const term = notificationSearchTerm.toLowerCase();
    return assignedNotifications.filter(
      notification =>
        notification.name.toLowerCase().includes(term) || (notification.description ?? '').toLowerCase().includes(term),
    );
  }, [assignedNotifications, notificationSearchTerm]);

  const assignmentProgress = useMemo(() => {
    if (notificationTypes.length === 0) {
      return 0;
    }

    return Math.round((assignedNotifications.length / notificationTypes.length) * 100);
  }, [assignedNotifications.length, notificationTypes.length]);

  useEffect(() => {
    if (!isAdminRole) {
      return;
    }

    setAssignedNotifications(current => {
      if (
        current.length === notificationTypes.length &&
        current.every(notification => notification.inAppEnabled && notification.emailEnabled)
      ) {
        return current;
      }

      return notificationTypes.map(type => ({
        typeId: type.id,
        name: type.name,
        description: type.description,
        inAppEnabled: true,
        emailEnabled: true,
      }));
    });
  }, [isAdminRole, notificationTypes]);

  const handleAddNotificationType = useCallback(
    (value: string) => {
      if (isAdminRole) {
        return;
      }

      setPendingNotificationType('');
      const typeId = Number(value);
      if (Number.isNaN(typeId)) {
        return;
      }

      const type = notificationTypes.find(item => item.id === typeId);
      if (!type) {
        return;
      }

      setAssignedNotifications(current => {
        if (current.some(notification => notification.typeId === typeId)) {
          return current;
        }

        return [
          ...current,
          {
            typeId: type.id,
            name: type.name,
            description: type.description,
            inAppEnabled: type.default_in_app,
            emailEnabled: type.default_email,
          },
        ];
      });
      setIsDirty(true);
    },
    [isAdminRole, notificationTypes],
  );

  const handleNotificationToggle = useCallback(
    (typeId: number, channel: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
      if (isAdminRole) {
        return;
      }

      setAssignedNotifications(current =>
        current.map(notification => (notification.typeId === typeId ? { ...notification, [channel]: value } : notification)),
      );
      setIsDirty(true);
    },
    [isAdminRole],
  );

  const handleNotificationRemove = useCallback(
    (typeId: number) => {
      if (isAdminRole) {
        return;
      }

      setAssignedNotifications(current => current.filter(notification => notification.typeId !== typeId));
      setIsDirty(true);
    },
    [isAdminRole],
  );

  const assignAllAvailableNotifications = useCallback(() => {
    if (notificationTypes.length === 0) {
      return;
    }

    setAssignedNotifications(
      notificationTypes.map(type => ({
        typeId: type.id,
        name: type.name,
        description: type.description,
        inAppEnabled: true,
        emailEnabled: true,
      })),
    );
    setIsDirty(true);
  }, [notificationTypes]);

  const clearAllAssignedNotifications = useCallback(() => {
    setAssignedNotifications([]);
    setIsDirty(true);
  }, []);

  const validateField = (field: string, value: string) => {
    const validationData = { ...data, [field]: value };
    const fieldErrors = validateUser(validationData, false);
    const error = fieldErrors[field as keyof ValidationErrors] || '';

    setFrontendErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof UserFormData, value);
    validateField(field, value);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation
    const validationErrors = validateUser(data, false);

    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors);
      toast({
        title: t('users.validation.title'),
        description: t('users.validation.description'),
        variant: 'destructive',
      });
      return;
    }

    post('/users', {
      preserveScroll: true,
      onSuccess: () => {
        setIsDirty(false);
        toast({
          title: t('users.create.successTitle'),
          description: t('users.create.successDescription'),
        });
      },
    });
  };

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;
  const assignedCount = assignedNotifications.length;
  const totalNotificationTypes = notificationTypes.length;

  return (
    <FormPageLayout
      title={t('users.create.title')}
      headTitle={t('users.create.headTitle')}
      description={t('users.create.description')}
      breadcrumbs={breadcrumbs}
      icon={<User className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24">
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('users.validation.formDescription')}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title={t('users.form.sections.profile.title')}
          description={t('users.form.sections.profile.description')}
          icon={<User className="h-4 w-4" />}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label={t('users.form.fields.name.label')} required error={frontendErrors.name || (errors.name as string)}>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={event => handleFieldChange('name', event.target.value)}
                placeholder={t('users.form.fields.name.placeholder')}
              />
            </FormField>

            <FormField label={t('users.form.fields.email.label')} required error={frontendErrors.email || (errors.email as string)}>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={event => handleFieldChange('email', event.target.value)}
                placeholder={t('users.form.fields.email.placeholder')}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title={t('users.form.sections.access.title')}
          description={t('users.form.sections.access.description')}
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <FormField label={t('users.form.fields.role.label')} required error={frontendErrors.role || (errors.role as string)}>
              <Select value={data.role} onValueChange={value => handleFieldChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('users.form.fields.role.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('users.form.fields.password.label')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={event => handleFieldChange('password', event.target.value)}
                    placeholder={t('users.form.fields.password.placeholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showPassword ? t('users.form.fields.password.hide') : t('users.form.fields.password.show')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>{t('users.form.fields.passwordStrength.label')}</span>
                    <span className={passwordStrength.evaluated ? passwordStrength.textClass : 'text-slate-500 dark:text-slate-400'}>
                      {passwordStrength.evaluated ? passwordStrength.label : t('users.form.fields.passwordStrength.waiting')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                      style={{ width: `${passwordStrength.evaluated ? passwordStrength.progress : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {passwordStrength.evaluated ? passwordStrength.hint : t('users.form.fields.passwordStrength.helper')}
                  </p>
                </div>
                {(frontendErrors.password || errors.password) && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.password || errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">
                  {t('users.form.fields.passwordConfirmation.label')} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showPasswordConfirmation ? 'text' : 'password'}
                    value={data.password_confirmation}
                    onChange={event => handleFieldChange('password_confirmation', event.target.value)}
                    placeholder={t('users.form.fields.passwordConfirmation.placeholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showPasswordConfirmation ? t('users.form.fields.passwordConfirmation.hide') : t('users.form.fields.passwordConfirmation.show')}
                  >
                    {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {(frontendErrors.password_confirmation || errors.password_confirmation) && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.password_confirmation || errors.password_confirmation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('users.form.sections.notifications.title')}
          description={t('users.form.sections.notifications.description')}
          icon={<BellRing className="h-4 w-4" />}
          badge={<Badge variant="outline">{t('users.form.sections.notifications.optional')}</Badge>}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('users.form.sections.notifications.helper')}
            </p>
            {isAdminRole && (
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t('users.form.sections.notifications.adminHint')}</span>
              </div>
            )}

            {!isAdminRole && (
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  <Select
                    value={pendingNotificationType}
                    onValueChange={value => {
                      setPendingNotificationType(value);
                      handleAddNotificationType(value);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-72">
                      <SelectValue placeholder={t('users.form.sections.notifications.addPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {availableNotificationTypes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">{t('users.form.sections.notifications.allAssigned')}</div>
                      ) : (
                        availableNotificationTypes.map(type => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" />
                    {t('users.form.sections.notifications.addAction')}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={assignAllAvailableNotifications}
                    disabled={assignedNotifications.length === notificationTypes.length}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('users.form.sections.notifications.assignAll')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearAllAssignedNotifications}
                    disabled={assignedNotifications.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('users.form.sections.notifications.clear')}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-md border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{t('users.form.sections.notifications.overview.title')}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    <span>{t('users.form.sections.notifications.overview.selected', { count: assignedCount, total: totalNotificationTypes })}</span>
                  </div>
                </div>
                {assignedNotifications.length > 0 && (
                  <div className="relative flex h-10 w-full items-center gap-2 overflow-hidden rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 md:w-56">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
                      style={{ width: `${assignmentProgress}%` }}
                    />
                    <span className="relative flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t('users.form.sections.notifications.overview.coverage', { value: assignmentProgress })}
                    </span>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={notificationSearchTerm}
                  onChange={event => setNotificationSearchTerm(event.target.value)}
                  placeholder={t('users.form.sections.notifications.searchPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredAssignedNotifications.length === 0 ? (
              assignedNotifications.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  {t('users.form.sections.notifications.empty')}
                </div>
              ) : (
                <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  {t('users.form.sections.notifications.noMatches')}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {filteredAssignedNotifications.map(notification => (
                  <div
                    key={notification.typeId}
                    className="rounded-lg border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{notification.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {notification.description ?? t('users.form.sections.notifications.noDescription')}
                        </p>
                      </div>
                      {!isAdminRole && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNotificationRemove(notification.typeId)}
                          className="self-start text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> {t('users.form.sections.notifications.remove')}
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div
                        className={`flex items-start gap-3 rounded-md border p-4 ${notification.inAppEnabled ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'bg-muted/50'}`}
                      >
                        <Checkbox
                          id={`notification-${notification.typeId}-in-app`}
                          checked={notification.inAppEnabled}
                          onCheckedChange={value => handleNotificationToggle(notification.typeId, 'inAppEnabled', value === true)}
                          disabled={isAdminRole}
                        />
                        <div>
                          <Label htmlFor={`notification-${notification.typeId}-in-app`} className="text-sm font-medium">
                            {t('users.form.sections.notifications.channels.inApp.title')}
                          </Label>
                          <p className="text-xs text-muted-foreground">{t('users.form.sections.notifications.channels.inApp.description')}</p>
                        </div>
                      </div>
                      <div
                        className={`flex items-start gap-3 rounded-md border p-4 ${notification.emailEnabled ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'bg-muted/50'}`}
                      >
                        <Checkbox
                          id={`notification-${notification.typeId}-email`}
                          checked={notification.emailEnabled}
                          onCheckedChange={value => handleNotificationToggle(notification.typeId, 'emailEnabled', value === true)}
                          disabled={isAdminRole}
                        />
                        <div>
                          <Label htmlFor={`notification-${notification.typeId}-email`} className="text-sm font-medium">
                            {t('users.form.sections.notifications.channels.email.title')}
                          </Label>
                          <p className="text-xs text-muted-foreground">{t('users.form.sections.notifications.channels.email.description')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/users">{t('users.actions.cancel')}</Link>
        </Button>
        <Button type="submit" disabled={processing} onClick={handleSubmit}>
          {processing ? t('users.create.submitting') : t('users.create.submit')}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
