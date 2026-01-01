import * as React from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

export interface Heading {
    id: string;
    title: string;
    level: number;
}

interface TableOfContentsProps {
    headings: Heading[];
    className?: string;
}

export const TableOfContents = React.memo(function TableOfContents({
    headings,
    className,
}: TableOfContentsProps) {
    const [activeId, setActiveId] = React.useState<string>('');

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px',
            }
        );

        headings.forEach((heading) => {
            const element = document.getElementById(heading.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [headings]);

    const handleClick = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav className={cn('space-y-2', className)}>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                <List className="h-4 w-4" />
                <span>On This Page</span>
            </div>
            <ul className="space-y-2 text-sm">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        style={{
                            paddingLeft: `${(heading.level - 2) * 12}px`,
                        }}
                    >
                        <button
                            onClick={() => handleClick(heading.id)}
                            className={cn(
                                'block w-full text-left hover:text-primary transition-colors',
                                activeId === heading.id
                                    ? 'text-primary font-medium'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {heading.title}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
});

