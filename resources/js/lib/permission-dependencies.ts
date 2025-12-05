export interface PermissionRecord {
  id: number
  name: string
  guard_name: string
}

export interface PermissionDependencyMaps {
  forward: Map<number, number[]>
  reverse: Map<number, number[]>
}

const actionFromPermission = (permission: PermissionRecord): string | null => {
  const separatorIndex = permission.name.indexOf('.')
  if (separatorIndex === -1) {
    return null
  }

  return permission.name.slice(separatorIndex + 1)
}

const buildModuleActionLookup = (modulePermissions: PermissionRecord[]): Record<string, PermissionRecord> => {
  return modulePermissions.reduce<Record<string, PermissionRecord>>((accumulator, permission) => {
    const action = actionFromPermission(permission)
    if (action) {
      accumulator[action] = permission
    }

    return accumulator
  }, {})
}

export const buildPermissionDependencyMaps = (
  groupedPermissions: Record<string, PermissionRecord[]>
): PermissionDependencyMaps => {
  const forward = new Map<number, number[]>()
  const reverse = new Map<number, number[]>()

  Object.values(groupedPermissions).forEach(modulePermissions => {
    if (!Array.isArray(modulePermissions) || modulePermissions.length === 0) {
      return
    }

    const actions = buildModuleActionLookup(modulePermissions)
    const viewPermission = actions.view
    const showPermission = actions.show
    const createPermission = actions.create
    const storePermission = actions.store
    const editPermission = actions.edit
    const updatePermission = actions.update

    modulePermissions.forEach(permission => {
      const action = actionFromPermission(permission)
      if (!action) {
        return
      }

      const dependencies: number[] = []

      if (viewPermission && permission.id !== viewPermission.id) {
        dependencies.push(viewPermission.id)
      }

      if (showPermission && permission.id !== showPermission.id && action !== 'view') {
        dependencies.push(showPermission.id)
      }

      if (showPermission && permission.id === showPermission.id && viewPermission) {
        dependencies.push(viewPermission.id)
      }

      if (action === 'store' && createPermission) {
        dependencies.push(createPermission.id)
      }

      if (action === 'create' && storePermission) {
        dependencies.push(storePermission.id)
      }

      if (action === 'update' && editPermission) {
        dependencies.push(editPermission.id)
      }

      if (action === 'edit' && updatePermission) {
        dependencies.push(updatePermission.id)
      }

      if (dependencies.length === 0) {
        return
      }

      forward.set(permission.id, dependencies)

      dependencies.forEach(dependencyId => {
        const dependents = reverse.get(dependencyId) ?? []
        if (!dependents.includes(permission.id)) {
          reverse.set(dependencyId, [...dependents, permission.id])
        }
      })
    })
  })

  return { forward, reverse }
}

export const addPermissionWithDependencies = (
  selectedPermissions: number[],
  permissionId: number,
  maps: PermissionDependencyMaps
): number[] => {
  const nextSelections = new Set<number>(selectedPermissions)
  const stack: number[] = [permissionId]
  const visited = new Set<number>()

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined || visited.has(current)) {
      continue
    }

    visited.add(current)
    nextSelections.add(current)

    const dependencies = maps.forward.get(current) ?? []
    dependencies.forEach(dependencyId => {
      if (!visited.has(dependencyId)) {
        stack.push(dependencyId)
      }
    })
  }

  return Array.from(nextSelections).sort((a, b) => a - b)
}

export const removePermissionAndDependents = (
  selectedPermissions: number[],
  permissionId: number,
  maps: PermissionDependencyMaps
): number[] => {
  const nextSelections = new Set<number>(selectedPermissions)
  const stack: number[] = [permissionId]
  const visited = new Set<number>()

  while (stack.length > 0) {
    const current = stack.pop()
    if (current === undefined || visited.has(current)) {
      continue
    }

    visited.add(current)
    nextSelections.delete(current)

    const dependents = maps.reverse.get(current) ?? []
    dependents.forEach(dependentId => {
      if (!visited.has(dependentId)) {
        stack.push(dependentId)
      }
    })
  }

  return Array.from(nextSelections).sort((a, b) => a - b)
}
