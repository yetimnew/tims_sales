import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    BookOpen,
    LayoutGrid,
    Truck,
    Users,
    Wrench,
    Fuel,
    TrendingUp,
    FileText,
    Settings,
    HelpCircle,
    AlertCircle,
    Globe,
    Search,
    ArrowRight,
    Zap,
    Video,
} from 'lucide-react';

const featuredArticles = [
    {
        id: 1,
        title: 'Getting Started with the Platform',
        description: 'Learn the basics and get up to speed quickly',
        href: '/help/getting-started/welcome',
        icon: BookOpen,
        category: 'Getting Started',
    },
    {
        id: 2,
        title: 'Creating Your First Operation',
        description: 'Step-by-step guide to creating and managing operations',
        href: '/help/operations/create',
        icon: Truck,
        category: 'Operations',
    },
    {
        id: 3,
        title: 'Driver Management Best Practices',
        description: 'Learn how to effectively manage your driver fleet',
        href: '/help/fleet/drivers/management',
        icon: Users,
        category: 'Fleet Management',
    },
];

const categories = [
    {
        title: 'Getting Started',
        description: 'New to the platform? Start here.',
        icon: BookOpen,
        href: '/help/getting-started',
        count: 5,
        color: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
        title: 'Dashboard',
        description: 'Understand and use the dashboard.',
        icon: LayoutGrid,
        href: '/help/dashboard',
        count: 4,
        color: 'bg-purple-50 dark:bg-purple-950',
        borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
        title: 'Fleet Management',
        description: 'Trucks, drivers, and assignments.',
        icon: Truck,
        href: '/help/fleet',
        count: 12,
        color: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
        title: 'Operations',
        description: 'Manage dispatches and operations.',
        icon: Truck,
        href: '/help/operations',
        count: 8,
        color: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
    },
    {
        title: 'Locations',
        description: 'Geographic and location management.',
        icon: Globe,
        href: '/help/locations',
        count: 8,
        color: 'bg-cyan-50 dark:bg-cyan-950',
        borderColor: 'border-cyan-200 dark:border-cyan-800',
    },
    {
        title: 'Maintenance',
        description: 'Vehicle maintenance and repairs.',
        icon: Wrench,
        href: '/help/maintenance',
        count: 10,
        color: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
    },
    {
        title: 'Fuel Management',
        description: 'Tracking and efficiency analysis.',
        icon: Fuel,
        href: '/help/fuel',
        count: 7,
        color: 'bg-amber-50 dark:bg-amber-950',
        borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
        title: 'Analytics',
        description: 'Performance and financial insights.',
        icon: TrendingUp,
        href: '/help/analytics',
        count: 14,
        color: 'bg-indigo-50 dark:bg-indigo-950',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
    {
        title: 'Reports',
        description: 'Comprehensive reporting features.',
        icon: FileText,
        href: '/help/reports',
        count: 18,
        color: 'bg-pink-50 dark:bg-pink-950',
        borderColor: 'border-pink-200 dark:border-pink-800',
    },
    {
        title: 'Administration',
        description: 'Users, roles, and settings.',
        icon: Settings,
        href: '/help/admin',
        count: 9,
        color: 'bg-gray-50 dark:bg-gray-950',
        borderColor: 'border-gray-200 dark:border-gray-800',
    },
    {
        title: 'User Profile',
        description: 'Account and preference settings.',
        icon: Users,
        href: '/help/profile',
        count: 5,
        color: 'bg-teal-50 dark:bg-teal-950',
        borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
        title: 'Troubleshooting',
        description: 'Solutions to common issues.',
        icon: AlertCircle,
        href: '/help/troubleshooting',
        count: 8,
        color: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
];

export default function HelpIndex() {
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search page or filter results
            console.log('Search:', searchQuery);
        }
    };

    return (
        <>
            <Head title="Help & Documentation Center" />
            <SidebarProvider>
                <HelpSidebar />
                <main className="flex-1 overflow-auto">
                    {/* Hero Section */}
                    <div className="border-b bg-gradient-to-b from-blue-50 to-background dark:from-blue-950 dark:to-background">
                        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-8 w-8 text-primary" />
                                    <h1 className="text-4xl font-bold tracking-tight">Help & Documentation</h1>
                                </div>
                                <p className="text-lg text-muted-foreground">
                                    Find comprehensive guides and documentation for every feature of your fleet management system.
                                </p>
                            </div>

                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="mt-8 flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search help articles, tutorials, and guides..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit" className="gap-2">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
                        {/* Quick Links / Highlights */}
                        <section>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-primary" />
                                            <CardTitle className="text-base">Quick Start</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Get up and running in 5 minutes
                                        </p>
                                        <Link href="/help/getting-started/welcome">
                                            <Button variant="outline" size="sm" className="w-full gap-1">
                                                Start Here
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <Video className="h-5 w-5 text-orange-500" />
                                            <CardTitle className="text-base">Video Tutorials</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Learn visually with step-by-step videos
                                        </p>
                                        <Button variant="outline" size="sm" className="w-full gap-1">
                                            Watch Videos
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-5 w-5 text-green-500" />
                                            <CardTitle className="text-base">FAQ</CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Answers to common questions
                                        </p>
                                        <Button variant="outline" size="sm" className="w-full gap-1">
                                            View FAQs
                                            <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Featured Articles */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
                            <div className="grid gap-4 md:grid-cols-3">
                                {featuredArticles.map((article) => {
                                    const Icon = article.icon;
                                    return (
                                        <Link key={article.id} href={article.href}>
                                            <Card className="h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer">
                                                <CardHeader>
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-lg bg-primary/10 p-2">
                                                            <Icon className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {article.category}
                                                            </span>
                                                            <CardTitle className="text-base mt-1">
                                                                {article.title}
                                                            </CardTitle>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">
                                                        {article.description}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Categories Grid */}
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Browse All Topics</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {categories.map((category) => {
                                    const Icon = category.icon;
                                    return (
                                        <Link key={category.title} href={category.href}>
                                            <Card
                                                className={`h-full hover:shadow-lg hover:border-primary transition-all cursor-pointer border ${category.borderColor}`}
                                            >
                                                <CardHeader>
                                                    <div className={`rounded-lg ${category.color} p-3 w-fit mb-3`}>
                                                        <Icon className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <CardTitle className="text-lg">{category.title}</CardTitle>
                                                    <CardDescription>{category.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {category.count} articles
                                                        </span>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Support Section */}
                        <section className="rounded-lg border bg-card p-8 text-center">
                            <h3 className="text-lg font-semibold mb-2">Didn't find what you're looking for?</h3>
                            <p className="text-muted-foreground mb-4">
                                Contact our support team for additional assistance
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline">
                                    Email Support
                                </Button>
                                <Button>
                                    Chat with Support
                                </Button>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="border-t bg-muted/50 py-6">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
                                <p>Last updated: {new Date().toLocaleDateString()}</p>
                                <div className="flex gap-4">
                                    <a href="#" className="hover:text-foreground transition">
                                        Report Issue
                                    </a>
                                    <a href="#" className="hover:text-foreground transition">
                                        Suggest Article
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </>
    );
}

