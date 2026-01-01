import * as React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Clock, ArrowRight, X } from 'lucide-react';
import { searchArticles, getAllCategories } from '@/lib/help-articles-registry';
import { saveSearchHistory, getSearchHistory } from '@/lib/help-utils';
import type { HelpArticle } from '@/lib/help-articles-registry';

interface HelpSearchProps {
    query?: string;
}

export default function HelpSearch({ query: initialQuery = '' }: HelpSearchProps) {
    const [query, setQuery] = React.useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
    const [searchHistory, setSearchHistory] = React.useState<string[]>([]);

    const categories = getAllCategories();

    // Load search history
    React.useEffect(() => {
        setSearchHistory(getSearchHistory());
    }, []);

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            if (query.trim()) {
                saveSearchHistory(query);
                setSearchHistory(getSearchHistory());
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Perform search
    const searchResults = React.useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return searchArticles(debouncedQuery);
    }, [debouncedQuery]);

    // Filter by category
    const filteredResults = React.useMemo(() => {
        if (!selectedCategory) return searchResults;
        return searchResults.filter(article => article.category === selectedCategory);
    }, [searchResults, selectedCategory]);

    // Highlight search terms
    const highlightText = (text: string, searchTerm: string) => {
        if (!searchTerm.trim()) return text;
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) =>
            regex.test(part) ? (
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    const handleSearchHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
    };

    return (
        <>
            <Head title={query ? `Search: ${query} - Help & Documentation` : 'Search - Help & Documentation'} />
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
                            <h1 className="text-4xl font-bold tracking-tight mb-4">
                                Search Help Articles
                            </h1>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search for help articles, features, or topics..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-11 h-12 text-base"
                                    autoFocus
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category Filter */}
                    {debouncedQuery && searchResults.length > 0 && (
                        <div className="border-b bg-muted/30">
                            <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">Filter by category:</span>
                                    <Button
                                        variant={selectedCategory === null ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedCategory(null)}
                                    >
                                        All Results
                                    </Button>
                                    {categories.map((category) => {
                                        const count = searchResults.filter(
                                            article => article.category === category.id
                                        ).length;
                                        if (count === 0) return null;
                                        
                                        return (
                                            <Button
                                                key={category.id}
                                                variant={selectedCategory === category.id ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory(category.id)}
                                            >
                                                {category.name} ({count})
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                        {!debouncedQuery ? (
                            // Initial State - Show search history
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Start Searching</h2>
                                <p className="text-muted-foreground mb-6">
                                    Type in the search box above to find help articles, guides, and documentation.
                                </p>

                                {searchHistory.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                            Recent Searches
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {searchHistory.slice(0, 10).map((historyItem, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleSearchHistoryClick(historyItem)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors text-sm"
                                                >
                                                    <Search className="h-3 w-3" />
                                                    {historyItem}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                        Popular Topics
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <button
                                            onClick={() => setQuery('add truck')}
                                            className="text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                        >
                                            <div className="font-medium mb-1">Adding Trucks</div>
                                            <div className="text-xs text-muted-foreground">
                                                Learn how to add vehicles to your fleet
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setQuery('create operation')}
                                            className="text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                        >
                                            <div className="font-medium mb-1">Creating Operations</div>
                                            <div className="text-xs text-muted-foreground">
                                                Step-by-step guide to dispatch management
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setQuery('reports filters')}
                                            className="text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                        >
                                            <div className="font-medium mb-1">Using Report Filters</div>
                                            <div className="text-xs text-muted-foreground">
                                                Master data filtering for insights
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setQuery('user permissions')}
                                            className="text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                                        >
                                            <div className="font-medium mb-1">User Management</div>
                                            <div className="text-xs text-muted-foreground">
                                                Managing users and permissions
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : filteredResults.length === 0 ? (
                            // No Results
                            <div className="text-center py-12">
                                <p className="text-lg font-medium mb-2">No results found for "{debouncedQuery}"</p>
                                <p className="text-muted-foreground mb-6">
                                    Try different keywords or browse by category
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <Link href="/help">
                                        <Button variant="outline">Browse All Topics</Button>
                                    </Link>
                                    <Link href="/help/faq">
                                        <Button variant="outline">Check FAQ</Button>
                                    </Link>
                                    <Link href="/help/contact">
                                        <Button>Contact Support</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            // Search Results
                            <div>
                                <div className="mb-6">
                                    <p className="text-muted-foreground">
                                        Found <strong>{filteredResults.length}</strong> {filteredResults.length === 1 ? 'result' : 'results'} for <strong>"{debouncedQuery}"</strong>
                                        {selectedCategory && (
                                            <span> in <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong></span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {filteredResults.map((article) => {
                                        const category = categories.find(c => c.id === article.category);
                                        
                                        return (
                                            <Link key={article.id} href={article.href}>
                                                <Card className="hover:shadow-md hover:border-primary transition-all cursor-pointer">
                                                    <CardHeader>
                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge variant="outline">
                                                                    {category?.name || article.category}
                                                                </Badge>
                                                                {article.subcategory && (
                                                                    <Badge variant="secondary" className="capitalize">
                                                                        {article.subcategory.replace(/-/g, ' ')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        </div>
                                                        <CardTitle className="text-xl leading-tight">
                                                            {highlightText(article.title, debouncedQuery)}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <CardDescription className="mb-3">
                                                            {highlightText(article.description, debouncedQuery)}
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
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-muted/50 py-6 mt-8">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                                Still need help?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link href="/help/faq">
                                    <Button variant="outline" size="sm">
                                        View FAQ
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
                </main>
            </SidebarProvider>
        </>
    );
}

