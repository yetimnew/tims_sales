/**
 * Help Articles Registry
 * Central registry of all help articles with metadata, search, and navigation
 */

import { fuzzySearch, calculateRelevance } from './help-utils';

export interface HelpArticle {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    keywords: string[];
    href: string;
    lastUpdated: string;
    readTime: string;
    relatedArticles?: string[]; // Array of article IDs
}

export interface HelpCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    articleCount: number;
}

/**
 * Article Registry
 * Add new articles here as they are created
 */
const ARTICLES: HelpArticle[] = [
    // Getting Started
    {
        id: 'getting-started-welcome',
        slug: 'welcome',
        title: 'Welcome to Your Fleet Management System',
        description: 'Learn about your fleet management system, key features, and how to get started.',
        category: 'getting-started',
        keywords: ['welcome', 'introduction', 'getting started', 'overview', 'first steps'],
        href: '/help/getting-started/welcome',
        lastUpdated: '2025-01-01',
        readTime: '5 min',
        relatedArticles: ['getting-started-dashboard', 'getting-started-navigation'],
    },
    {
        id: 'getting-started-dashboard',
        slug: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'Understanding your dashboard and key metrics at a glance.',
        category: 'getting-started',
        keywords: ['dashboard', 'overview', 'metrics', 'kpi', 'cards'],
        href: '/help/getting-started/dashboard-overview',
        lastUpdated: '2025-01-01',
        readTime: '4 min',
        relatedArticles: ['getting-started-welcome'],
    },
    {
        id: 'getting-started-navigation',
        slug: 'navigation',
        title: 'Navigation Guide',
        description: 'Learn how to navigate through the system efficiently.',
        category: 'getting-started',
        keywords: ['navigation', 'sidebar', 'menu', 'interface'],
        href: '/help/getting-started/navigation',
        lastUpdated: '2025-01-01',
        readTime: '3 min',
        relatedArticles: ['getting-started-welcome'],
    },

    // Fleet Management - Trucks
    {
        id: 'fleet-trucks-adding',
        slug: 'adding',
        title: 'How to Add a New Truck',
        description: 'Step-by-step guide to adding trucks to your fleet.',
        category: 'fleet',
        subcategory: 'trucks',
        keywords: ['truck', 'add', 'create', 'vehicle', 'fleet', 'plate number'],
        href: '/help/fleet/trucks/adding',
        lastUpdated: '2025-01-01',
        readTime: '6 min',
        relatedArticles: ['fleet-trucks-information', 'fleet-vehicle-types'],
    },
    {
        id: 'fleet-trucks-information',
        slug: 'information',
        title: 'Truck Information Management',
        description: 'Managing and updating truck information and details.',
        category: 'fleet',
        subcategory: 'trucks',
        keywords: ['truck', 'information', 'details', 'edit', 'update'],
        href: '/help/fleet/trucks/information',
        lastUpdated: '2025-01-01',
        readTime: '5 min',
        relatedArticles: ['fleet-trucks-adding'],
    },

    // Operations
    {
        id: 'operations-creating',
        slug: 'create',
        title: 'Creating and Managing Operations',
        description: 'Complete guide to creating operations from start to finish.',
        category: 'operations',
        keywords: ['operation', 'create', 'dispatch', 'route', 'freight'],
        href: '/help/operations/create',
        lastUpdated: '2025-01-01',
        readTime: '8 min',
        relatedArticles: ['operations-routes', 'operations-status'],
    },

    // Reports
    {
        id: 'reports-filters',
        slug: 'using-filters',
        title: 'How to Use Report Filters',
        description: 'Master report filtering for better insights and analysis.',
        category: 'reports',
        keywords: ['report', 'filter', 'date range', 'export', 'analytics'],
        href: '/help/reports/using-filters',
        lastUpdated: '2025-01-01',
        readTime: '5 min',
        relatedArticles: ['reports-export'],
    },

    // Administration - Users
    {
        id: 'admin-users-managing',
        slug: 'managing-users',
        title: 'User Management Guide',
        description: 'Learn how to create, edit, and manage user accounts.',
        category: 'admin',
        subcategory: 'users',
        keywords: ['user', 'admin', 'account', 'role', 'permission', 'access'],
        href: '/help/admin/users/managing-users',
        lastUpdated: '2025-01-01',
        readTime: '7 min',
        relatedArticles: ['admin-roles', 'admin-permissions'],
    },
];

/**
 * Category Definitions
 */
const CATEGORIES: HelpCategory[] = [
    {
        id: 'getting-started',
        name: 'Getting Started',
        slug: 'getting-started',
        description: 'New to the platform? Start here.',
        icon: 'BookOpen',
        articleCount: 0,
    },
    {
        id: 'fleet',
        name: 'Fleet Management',
        slug: 'fleet',
        description: 'Trucks, drivers, and assignments.',
        icon: 'Truck',
        articleCount: 0,
    },
    {
        id: 'operations',
        name: 'Operations',
        slug: 'operations',
        description: 'Manage dispatches and operations.',
        icon: 'Activity',
        articleCount: 0,
    },
    {
        id: 'locations',
        name: 'Locations',
        slug: 'locations',
        description: 'Geographic and location management.',
        icon: 'MapPin',
        articleCount: 0,
    },
    {
        id: 'maintenance',
        name: 'Maintenance',
        slug: 'maintenance',
        description: 'Vehicle maintenance and repairs.',
        icon: 'Wrench',
        articleCount: 0,
    },
    {
        id: 'fuel',
        name: 'Fuel Management',
        slug: 'fuel',
        description: 'Tracking and efficiency analysis.',
        icon: 'Fuel',
        articleCount: 0,
    },
    {
        id: 'analytics',
        name: 'Analytics & Performance',
        slug: 'analytics',
        description: 'Performance and financial insights.',
        icon: 'TrendingUp',
        articleCount: 0,
    },
    {
        id: 'reports',
        name: 'Reports',
        slug: 'reports',
        description: 'Comprehensive reporting features.',
        icon: 'FileText',
        articleCount: 0,
    },
    {
        id: 'admin',
        name: 'Administration',
        slug: 'admin',
        description: 'Users, roles, and settings.',
        icon: 'Settings',
        articleCount: 0,
    },
    {
        id: 'profile',
        name: 'User Profile',
        slug: 'profile',
        description: 'Account and preference settings.',
        icon: 'User',
        articleCount: 0,
    },
    {
        id: 'troubleshooting',
        name: 'Troubleshooting',
        slug: 'troubleshooting',
        description: 'Solutions to common issues.',
        icon: 'AlertCircle',
        articleCount: 0,
    },
];

// Calculate article counts for categories
CATEGORIES.forEach((category) => {
    category.articleCount = ARTICLES.filter(
        (article) => article.category === category.id
    ).length;
});

/**
 * Get all articles
 */
export function getAllArticles(): HelpArticle[] {
    return ARTICLES;
}

/**
 * Get article by slug (full path)
 */
export function getArticleBySlug(
    category: string,
    subcategory?: string,
    slug?: string
): HelpArticle | undefined {
    // If only category provided, try to match just category
    if (!slug && !subcategory) {
        return ARTICLES.find((article) => article.category === category);
    }

    // If subcategory provided
    if (subcategory && slug) {
        return ARTICLES.find(
            (article) =>
                article.category === category &&
                article.subcategory === subcategory &&
                article.slug === slug
        );
    }

    // Otherwise treat subcategory as slug
    return ARTICLES.find(
        (article) =>
            article.category === category &&
            !article.subcategory &&
            article.slug === subcategory
    );
}

/**
 * Get article by ID
 */
export function getArticleById(id: string): HelpArticle | undefined {
    return ARTICLES.find((article) => article.id === id);
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(
    category: string,
    subcategory?: string
): HelpArticle[] {
    if (subcategory) {
        return ARTICLES.filter(
            (article) =>
                article.category === category &&
                article.subcategory === subcategory
        );
    }
    return ARTICLES.filter((article) => article.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): HelpCategory[] {
    return CATEGORIES;
}

/**
 * Get category by slug
 */
export function getCategoryBySlug(slug: string): HelpCategory | undefined {
    return CATEGORIES.find((category) => category.slug === slug);
}

/**
 * Search articles
 */
export function searchArticles(query: string): HelpArticle[] {
    if (!query.trim()) {
        return [];
    }

    const results = ARTICLES.filter((article) => {
        const searchText = [
            article.title,
            article.description,
            article.keywords.join(' '),
            article.category,
            article.subcategory || '',
        ].join(' ');

        return fuzzySearch(searchText, query);
    });

    // Sort by relevance
    return results.sort((a, b) => {
        const aRelevance = calculateRelevance(
            `${a.title} ${a.description} ${a.keywords.join(' ')}`,
            query
        );
        const bRelevance = calculateRelevance(
            `${b.title} ${b.description} ${b.keywords.join(' ')}`,
            query
        );
        return bRelevance - aRelevance;
    });
}

/**
 * Get related articles for an article
 */
export function getRelatedArticles(articleId: string): HelpArticle[] {
    const article = getArticleById(articleId);
    if (!article || !article.relatedArticles) {
        return [];
    }

    return article.relatedArticles
        .map((id) => getArticleById(id))
        .filter((a): a is HelpArticle => a !== undefined);
}

/**
 * Get previous article in same category
 */
export function getPreviousArticle(articleId: string): HelpArticle | undefined {
    const article = getArticleById(articleId);
    if (!article) return undefined;

    const categoryArticles = getArticlesByCategory(
        article.category,
        article.subcategory
    );
    const currentIndex = categoryArticles.findIndex((a) => a.id === articleId);

    if (currentIndex > 0) {
        return categoryArticles[currentIndex - 1];
    }

    return undefined;
}

/**
 * Get next article in same category
 */
export function getNextArticle(articleId: string): HelpArticle | undefined {
    const article = getArticleById(articleId);
    if (!article) return undefined;

    const categoryArticles = getArticlesByCategory(
        article.category,
        article.subcategory
    );
    const currentIndex = categoryArticles.findIndex((a) => a.id === articleId);

    if (currentIndex >= 0 && currentIndex < categoryArticles.length - 1) {
        return categoryArticles[currentIndex + 1];
    }

    return undefined;
}

/**
 * Get popular articles (based on view count from session storage)
 */
export function getPopularArticles(limit: number = 6): HelpArticle[] {
    try {
        const views: Record<string, number> = JSON.parse(
            sessionStorage.getItem('help-article-views') || '{}'
        );

        const articlesWithViews = ARTICLES.map((article) => ({
            article,
            views: views[article.id] || 0,
        }));

        articlesWithViews.sort((a, b) => b.views - a.views);

        return articlesWithViews.slice(0, limit).map((item) => item.article);
    } catch (error) {
        // Return first N articles if session storage fails
        return ARTICLES.slice(0, limit);
    }
}

/**
 * Get recently updated articles
 */
export function getRecentArticles(limit: number = 6): HelpArticle[] {
    const sorted = [...ARTICLES].sort((a, b) => {
        return (
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
    });

    return sorted.slice(0, limit);
}

/**
 * Track article view
 */
export function trackArticleView(articleId: string): void {
    try {
        const views: Record<string, number> = JSON.parse(
            sessionStorage.getItem('help-article-views') || '{}'
        );

        views[articleId] = (views[articleId] || 0) + 1;

        sessionStorage.setItem('help-article-views', JSON.stringify(views));
    } catch (error) {
        console.error('Failed to track article view:', error);
    }
}

