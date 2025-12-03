import * as React from 'react';
import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;
    const scopedPermissions = auth?.permissions ?? [];
    const allPermissions = auth?.all_permissions ?? [];

    const permissions = React.useMemo(
        () => Array.from(new Set([...scopedPermissions, ...allPermissions])),
        [scopedPermissions, allPermissions],
    );

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (permissionList: string[]): boolean => {
        return permissionList.some(permission => permissions.includes(permission));
    };

    const hasAllPermissions = (permissionList: string[]): boolean => {
        return permissionList.every(permission => permissions.includes(permission));
    };

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    };
}
