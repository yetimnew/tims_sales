import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpArticleProps {
    title: string;
    category: string;
    subcategory?: string;
    lastUpdated: string;
    readTime: string;
    children: React.ReactNode;
    className?: string;
}

export const HelpArticle = React.memo(function HelpArticle({
    title,
    category,
    subcategory,
    lastUpdated,
    readTime,
    children,
    className,
}: HelpArticleProps) {
    return (
        <article className={cn('mx-auto max-w-4xl', className)}>
            {/* Article Header */}
            <header className="mb-8 border-b pb-6">
                {/* Category Badge */}
                <div className="mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        {category}
                    </Badge>
                    {subcategory && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <Badge variant="secondary" className="text-xs">
                                {subcategory}
                            </Badge>
                        </>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                    {title}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Updated {lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{readTime} read</span>
                    </div>
                </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-semibold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-7 prose-p:mb-4 prose-ul:my-4 prose-li:my-1 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none">
                {children}
            </div>
        </article>
    );
});

