import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Layers,
  ListChecks,
  Search,
  ShieldCheck,
  Square,
  X,
  FolderTree,
} from 'lucide-react';

import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { validateRole } from '@/lib/validation';
import { cn } from '@/lib/utils';
import {
  buildPermissionDependencyMaps,
  addPermissionWithDependencies,
  removePermissionAndDependents,
  type PermissionRecord,
} from '@/lib/permission-dependencies';
import { type BreadcrumbItem } from '@/types';
import { index as usersIndexRoute } from '@/routes/users';
import { index as rolesIndexRoute, show as showRoleRoute, edit as editRoleRoute } from '@/routes/roles';

type Permission = PermissionRecord;

interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

interface RoleFormData {
  name: string;
  description: string;
  permissions: number[];
}

interface RoleEditProps {
  role: Role;
  permissions: Record<string, Permission[]>;
}

const formatModuleLabel = (value: string): string => {
  const normalized = value.replace(/\./g, ' / ').replace(/[_-]/g, ' ');
  return normalized.replace(/\b\w/g, (segment) => segment.toUpperCase());
};

export default function RolesEdit({ role, permissions }: RoleEditProps) {
  const { toast } = useToast();
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    role.permissions.map((permission) => permission.id).sort((first, second) => first - second),
  );
  const [moduleFilter, setModuleFilter] = useState('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const { data, setData, put, processing, errors } = useForm<RoleFormData>({
    name: role.name,
    description: role.description ?? '',
    permissions: role.permissions.map((permission) => permission.id).sort((first, second) => first - second),
  });

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'User management', href: usersIndexRoute().url },
      { title: 'Roles', href: rolesIndexRoute().url },
      { title: role.name, href: showRoleRoute(role.id).url },
      { title: 'Edit', href: editRoleRoute(role.id).url },
    ],
    [role.id, role.name],
  );

  useEffect(() => {
    const container = formRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 220);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' });
    }
  }, [errors, toast]);

  const groupedPermissions = useMemo(() => permissions || {}, [permissions]);
  const dependencyMaps = useMemo(
    () => buildPermissionDependencyMaps(groupedPermissions),
    [groupedPermissions],
  );
  const moduleEntries = useMemo(() => Object.entries(groupedPermissions), [groupedPermissions]);
  const totalPermissions = useMemo(
    () => moduleEntries.reduce((sum, [, modulePermissions]) => sum + modulePermissions.length, 0),
    [moduleEntries],
  );
  const filteredModuleEntries = useMemo(() => {
    const filter = moduleFilter.trim().toLowerCase();
    if (!filter) {
      return moduleEntries;
    }

    return moduleEntries.filter(([module, modulePermissions]) => {
      const label = formatModuleLabel(module).toLowerCase();
      if (label.includes(filter) || module.toLowerCase().includes(filter)) {
        return true;
      }

      return modulePermissions.some((permission) => permission.name.toLowerCase().includes(filter));
    });
  }, [moduleEntries, moduleFilter]);
  const hasFilter = moduleFilter.trim().length > 0;

  useEffect(() => {
    setExpandedModules((previous) => {
      const next: Record<string, boolean> = {};
      moduleEntries.forEach(([module]) => {
        next[module] = previous[module] ?? true;
      });
      return next;
    });
  }, [moduleEntries]);

  useEffect(() => {
    if (!moduleFilter.trim()) {
      return;
    }

    setExpandedModules((previous) => {
      const next = { ...previous };
      const filter = moduleFilter.toLowerCase();
      moduleEntries.forEach(([module]) => {
        const label = formatModuleLabel(module).toLowerCase();
        if (label.includes(filter) || module.toLowerCase().includes(filter)) {
          next[module] = true;
        }
      });
      return next;
    });
  }, [moduleFilter, moduleEntries]);

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof RoleFormData, value);
    setIsDirty(true);

    if (frontendErrors[field]) {
      const validationErrors = validateRole({ ...data, [field]: value });
      const error = validationErrors[field] || '';
      if (error) {
        setFrontendErrors((prev) => ({ ...prev, [field]: error }));
      } else {
        setFrontendErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const newPermissions = checked
      ? addPermissionWithDependencies(selectedPermissions, permissionId, dependencyMaps)
      : removePermissionAndDependents(selectedPermissions, permissionId, dependencyMaps);

    setSelectedPermissions(newPermissions);
    setData('permissions', newPermissions);
    setIsDirty(true);
  };

  const handleSelectAllModule = (modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map((permission) => permission.id);
    const allSelected = modulePermissionIds.every((id) => selectedPermissions.includes(id));

    let newPermissions = selectedPermissions;
    if (allSelected) {
      modulePermissionIds.forEach((id) => {
        if (newPermissions.includes(id)) {
          newPermissions = removePermissionAndDependents(newPermissions, id, dependencyMaps);
        }
      });
    } else {
      modulePermissionIds.forEach((id) => {
        if (!newPermissions.includes(id)) {
          newPermissions = addPermissionWithDependencies(newPermissions, id, dependencyMaps);
        }
      });
    }

    setSelectedPermissions(newPermissions);
    setData('permissions', newPermissions);
    setIsDirty(true);
  };

  const handleSelectAllPermissions = () => {
    let newPermissions = selectedPermissions;
    moduleEntries.forEach(([, modulePermissions]) => {
      modulePermissions.forEach((permission) => {
        if (!newPermissions.includes(permission.id)) {
          newPermissions = addPermissionWithDependencies(newPermissions, permission.id, dependencyMaps);
        }
      });
    });

    setSelectedPermissions(newPermissions);
    setData('permissions', newPermissions);
    setIsDirty(true);
  };

  const handleClearAllPermissions = () => {
    if (selectedPermissions.length === 0) {
      return;
    }

    setSelectedPermissions([]);
    setData('permissions', []);
    setIsDirty(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateRole({ ...data, permissions: selectedPermissions });

    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors);
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' });
      return;
    }

    put(`/roles/${role.id}`, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleScrollToTop = () => {
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;
  const isEverythingSelected = totalPermissions > 0 && selectedPermissions.length === totalPermissions;
  const selectionProgress = totalPermissions === 0 ? 0 : Math.round((selectedPermissions.length / totalPermissions) * 100);

  return (
    <FormPageLayout
      title="Edit Role"
      description="Adjust role information, fine-tune its permissions, and keep your access model in sync."
      headTitle={`Edit ${role.name}`}
      breadcrumbs={breadcrumbs}
      icon={<ShieldCheck className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/roles/${role.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Role
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
        </>
      }
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-32"
        style={{ minHeight: 0 }}
      >
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please resolve the highlighted issues before saving.</AlertDescription>
          </Alert>
        )}

        <FormSection
          title="Role Overview"
          description="Update the role's name and ensure the description still reflects its responsibilities."
          icon={
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <ListChecks className="h-4 w-4" />
            </div>
          }
          contentClassName="grid-cols-1 gap-6 md:grid-cols-2"
        >
          <FormField
            id="name"
            label="Role Name"
            required
            error={frontendErrors.name || errors.name}
            className="flex-1"
          >
            <Input
              id="name"
              type="text"
              value={data.name}
              onChange={(event) => handleFieldChange('name', event.target.value)}
              placeholder="e.g., Dispatch Supervisor"
              className={frontendErrors.name || errors.name ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField
            id="description"
            label="Role Description"
            helperText="Share context to help teammates understand this role's remit."
            error={frontendErrors.description || errors.description}
          >
            <Textarea
              id="description"
              value={data.description}
              onChange={(event) => handleFieldChange('description', event.target.value)}
              placeholder="Document the scope, reporting lines, or escalation responsibilities."
              rows={4}
              className={frontendErrors.description || errors.description ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500/20' : ''}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Permission Library"
          description="Review grouped permissions and adjust what this role should be allowed to do."
          icon={
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
          }
          className="relative"
          contentClassName="grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <>
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={moduleFilter}
                    onChange={(event) => setModuleFilter(event.target.value)}
                    placeholder="Search permissions or modules"
                    className="pl-9"
                  />
                  {moduleFilter && (
                    <button
                      type="button"
                      onClick={() => setModuleFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {hasFilter
                    ? `${filteredModuleEntries.length} matching group${filteredModuleEntries.length === 1 ? '' : 's'}`
                    : `Showing ${moduleEntries.length} permission group${moduleEntries.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <div className="space-y-4">
                {filteredModuleEntries.length > 0 ? (
                  filteredModuleEntries.map(([module, modulePermissions]) => {
                    const modulePermissionIds = modulePermissions.map((permission) => permission.id);
                    const selectedCount = modulePermissionIds.filter((id) => selectedPermissions.includes(id)).length;
                    const allSelected = modulePermissionIds.length > 0 && selectedCount === modulePermissionIds.length;

                    return (
                      <div
                        key={module}
                        className="overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 shadow-sm transition hover:border-slate-300 dark:border-slate-800/70 dark:bg-slate-900/40"
                      >
                        <Collapsible
                          open={expandedModules[module] ?? true}
                          onOpenChange={(value) =>
                            setExpandedModules((previous) => ({ ...previous, [module]: value }))
                          }
                        >
                          <div className="flex flex-col gap-4 border-b border-slate-200/60 bg-slate-50/70 px-5 py-4 dark:border-slate-700/60 dark:bg-slate-900/60 lg:flex-row lg:items-center lg:justify-between">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex flex-1 items-center justify-between gap-4 text-left"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <FolderTree className="h-3.5 w-3.5" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {formatModuleLabel(module)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {modulePermissions.length} available · {selectedCount} selected
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={allSelected ? 'default' : 'outline'}
                                  className={cn(
                                    'text-[11px]',
                                    allSelected
                                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                                      : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                                  )}
                                >
                                  {selectedCount}/{modulePermissions.length}
                                </Badge>
                              </button>
                            </CollapsibleTrigger>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectAllModule(modulePermissions)}
                                className="gap-2"
                              >
                                {allSelected ? (
                                  <>
                                    <Square className="h-4 w-4" />
                                    Deselect
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="h-4 w-4" />
                                    Select All
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          <CollapsibleContent className="px-5 pb-5 pt-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {modulePermissions.map((permission) => {
                                const permissionLabel = permission.name.replace(`${module}.`, '');
                                const isChecked = selectedPermissions.includes(permission.id);

                                return (
                                  <label
                                    key={permission.id}
                                    htmlFor={`permission-${permission.id}`}
                                    className={cn(
                                      'flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200/70 bg-white/70 p-3 text-sm shadow-sm transition hover:border-blue-300 hover:bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-blue-500/60 dark:hover:bg-blue-950/30',
                                      isChecked
                                        ? 'border-blue-300 bg-blue-50/70 dark:border-blue-500/70 dark:bg-blue-950/30'
                                        : '',
                                    )}
                                  >
                                    <Checkbox
                                      id={`permission-${permission.id}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        handlePermissionChange(permission.id, Boolean(checked))
                                      }
                                      className="mt-0.5"
                                    />
                                    <span className="flex flex-1 flex-col gap-1">
                                      <span className="font-medium capitalize text-slate-800 dark:text-slate-100">
                                        {permissionLabel}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Dependencies auto-selected if needed.
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/60 p-12 text-center text-sm text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/30">
                    <Search className="h-6 w-6 text-slate-400" />
                    <div>
                      <p>No permission groups match your search.</p>
                      {hasFilter && <p className="mt-1 text-xs">Try refining or clearing the filter to view all modules.</p>}
                    </div>
                  </div>
                )}

                {(frontendErrors.permissions || errors.permissions) && (
                  <p className="text-sm font-medium text-red-500">
                    {frontendErrors.permissions || errors.permissions}
                  </p>
                )}
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Selection summary</p>
                    <p className="text-xs text-muted-foreground">Keep the role lean by reviewing totals.</p>
                  </div>
                  <Badge
                    variant={isEverythingSelected ? 'default' : 'outline'}
                    className={cn(
                      'px-3 py-1 text-xs',
                      isEverythingSelected
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300',
                    )}
                  >
                    {selectedPermissions.length}/{totalPermissions}
                  </Badge>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Coverage</span>
                    <span>{selectionProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 dark:from-blue-400 dark:to-blue-500"
                      style={{ width: `${selectionProgress}%` }}
                    />
                  </div>
                  <dl className="mt-4 space-y-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-700 dark:text-slate-200">Selected</dt>
                      <dd className="text-slate-900 dark:text-slate-100">{selectedPermissions.length}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-700 dark:text-slate-200">Remaining</dt>
                      <dd className="text-slate-900 dark:text-slate-100">
                        {Math.max(0, totalPermissions - selectedPermissions.length)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="mt-6 space-y-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectAllPermissions}
                    className="w-full justify-between gap-2"
                  >
                    <span>Select everything</span>
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllPermissions}
                    disabled={selectedPermissions.length === 0}
                    className="w-full justify-between gap-2"
                  >
                    <span>Clear selection</span>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200/70 bg-slate-50/70 p-4 text-xs text-muted-foreground dark:border-slate-800/70 dark:bg-slate-900/40">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">Dependencies handled for you</p>
                    <p className="mt-1 leading-relaxed">
                      When a permission requires another, both stay aligned automatically. Review notes before finalizing.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        </FormSection>

        <FormActionsBar
          left={
            <>
              <span className="text-red-500">*</span>
              <span>Required fields</span>
            </>
          }
          right={
            <>
              <Button type="button" variant="outline" asChild>
                <Link href={`/roles/${role.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing || hasErrors}>
                Update Role
              </Button>
            </>
          }
        />
      </form>
      <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
