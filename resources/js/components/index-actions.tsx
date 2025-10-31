import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Eye, SquarePen, Trash2 } from 'lucide-react';

interface IndexActionsProps {
    showUrl: string;
    editUrl?: string;
    onDelete?: () => void;
    hasEditPermission?: boolean;
    hasDeletePermission?: boolean;
}

export function IndexActions({
    showUrl,
    editUrl,
    onDelete,
    hasEditPermission = true,
    hasDeletePermission = true
}: IndexActionsProps) {
    return (
        <div className="flex justify-center gap-2">
            {/* View Button - Always visible, muted blue */}
            <Button asChild size="sm" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">
                <Link href={showUrl}>
                    <Eye className="h-4 w-4" />
                </Link>
            </Button>

            {/* Edit Button - Blue */}
            {hasEditPermission && editUrl && (
                <Button asChild size="sm" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600">
                    <Link href={editUrl}>
                        <SquarePen className="h-4 w-4" />
                    </Link>
                </Button>
            )}

            {/* Delete Button - Red */}
            {hasDeletePermission && onDelete && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

