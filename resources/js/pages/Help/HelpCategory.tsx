import * as React from 'react';
import { Head, Link } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { getCategoryBySlug, getArticlesByCategory } from '@/lib/help-articles-registry';
import type { HelpArticle } from '@/lib/help-articles-registry';

interface HelpCategoryProps {
    category: string;
}

export default function HelpCategory({ category }: HelpCategoryProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortBy, setSortBy] = React.useState<'newest' | 'alphabetical' | 'popular'>('alphabetical');

    const categoryData = getCategoryBySlug(category);
    const allArticles = getArticlesByCategory(category);

    // Filter articles by search query
    const filteredArticles = React.useMemo(() => {
        if (!searchQuery.trim()) return allArticles;
        
        const query = searchQuery.toLowerCase();
        return allArticles.filter(article =>
            article.title.toLowerCase().includes(query) ||
            article.description.toLowerCase().includes(query) ||
            article.keywords.some(keyword => keyword.toLowerCase().includes(query))
        );
    }, [allArticles, searchQuery]);

    // Sort articles
    const sortedArticles = React.useMemo(() => {
        const articles = [...filteredArticles];
        
        switch (sortBy) {
            case 'newest':
                return articles.sort((a, b) => 
                    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
                );
            case 'alphabetical':
                return articles.sort((a, b) => a.title.localeCompare(b.title));
            case 'popular':
                // For now, just return as-is. Could integrate view counts later
                return articles;
            default:
                return articles;
        }
    }, [filteredArticles, sortBy]);

    // Group by subcategory
    const groupedArticles = React.useMemo(() => {
        const groups: Record<string, HelpArticle[]> = {};
        
        sortedArticles.forEach(article => {
            const key = article.subcategory || '_main';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(article);
        });
        
        return groups;
    }, [sortedArticles]);

    if (!categoryData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
                    <p className="text-muted-foreground mb-4">
                        The category "{category}" does not exist.
                    </p>
                    <Link href="/help">
                        <Button>Back to Help Center</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`${categoryData.name} - Help & Documentation`} />
            <SidebarProvider>
                <HelpSidebar />
                <main className="flex-1 overflow-auto">
                    {/* Header */}
                    <div className="border-b bg-card">
                        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                            <Link 
                                href="/help" 
                                className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block"
                            >
                                ← Back to Help Center
                            </Link>
                            <h1 className="text-4xl font-bold tracking-tight mb-3">
                                {categoryData.name}
                            </h1>
                            <p className="text-lg text-muted-foreground mb-4">
                                {categoryData.description}
                            </p>
                            <Badge variant="secondary">
                                {allArticles.length} {allArticles.length === 1 ? 'article' : 'articles'}
                            </Badge>
                        </div>
                    </div>

                    {/* Search and Sort */}
                    <div className="border-b bg-muted/30">
                        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search articles in this category..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Sort */}
                                <div className="flex gap-2">
                                    <Button
                                        variant={sortBy === 'alphabetical' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSortBy('alphabetical')}
                                    >
                                        A-Z
                                    </Button>
                                    <Button
                                        variant={sortBy === 'newest' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSortBy('newest')}
                                    >
                                        Newest
                                    </Button>
                                    <Button
                                        variant={sortBy === 'popular' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSortBy('popular')}
                                    >
                                        Popular
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Articles */}
                    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                        {sortedArticles.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? `No articles found matching "${searchQuery}"`
                                        : 'No articles available in this category yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedArticles).map(([subcategory, articles]) => (
                                    <div key={subcategory}>
                                        {subcategory !== '_main' && (
                                            <h2 className="text-2xl font-bold mb-4 capitalize">
                                                {subcategory.replace(/-/g, ' ')}
                                            </h2>
                                        )}
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {articles.map((article) => (
                                                <Link key={article.id} href={article.href}>
                                                    <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <CardTitle className="text-lg leading-tight">
                                                                    {article.title}
                                                                </CardTitle>
                                                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                                                            </div>
                                                            {article.subcategory && (
                                                                <Badge variant="outline" className="w-fit text-xs capitalize">
                                                                    {article.subcategory.replace(/-/g, ' ')}
                                                                </Badge>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent>
                                                            <CardDescription className="mb-3">
                                                                {article.description}
                                                            </CardDescription>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {article.readTime}
                                                                </div>
                                                                <div>
                                                                    Updated {new Date(article.lastUpdated).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-muted/50 py-6">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Can't find what you're looking for?
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Link href="/help/search">
                                        <Button variant="outline" size="sm">
                                            Search All Articles
                                        </Button>
                                    </Link>
                                    <Link href="/help/contact">
                                        <Button size="sm">
                                            Contact Support
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </>
    );
}

