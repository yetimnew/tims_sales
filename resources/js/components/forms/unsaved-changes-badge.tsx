import { Save } from 'lucide-react';

export function UnsavedChangesBadge() {
    return (
        <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Save className="h-3 w-3" />
            Unsaved Changes
        </div>
    );
}
