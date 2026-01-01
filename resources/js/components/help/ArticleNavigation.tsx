import * as React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Article {
    title: string;
    href: string;
}

interface ArticleNavigationProps {
    previousArticle?: Article;
    nextArticle?: Article;
    categoryName?: string;
    categoryUrl?: string;
    className?: string;
}

export const ArticleNavigation = React.memo(function ArticleNavigation({
    previousArticle,
    nextArticle,
    categoryName,
    categoryUrl,
    className,
}: ArticleNavigationProps) {
    return (
        <div className={cn('mt-12 pt-8 border-t', className)}>
            {/* Back to Category Link */}
            {categoryName && categoryUrl && (
                <div className="mb-6">
                    <Link href={categoryUrl}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <Home className="h-4 w-4" />
                            Back to {categoryName}
                        </Button>
                    </Link>
                </div>
            )}

            {/* Previous/Next Navigation */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Previous Article */}
                {previousArticle ? (
                    <Link
                        href={previousArticle.href}
                        className="group flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-accent transition-colors"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-xs text-muted-foreground mb-1">
                                Previous
                            </div>
                            <div className="text-sm font-medium line-clamp-2">
                                {previousArticle.title}
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div />
                )}

                {/* Next Article */}
                {nextArticle && (
                    <Link
                        href={nextArticle.href}
                        className="group flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-accent transition-colors sm:text-right"
                    >
                        <div className="flex-1 text-left sm:text-right">
                            <div className="text-xs text-muted-foreground mb-1">
                                Next
                            </div>
                            <div className="text-sm font-medium line-clamp-2">
                                {nextArticle.title}
                            </div>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
});

